#include "sim_config.h"
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"
#include "esp_netif.h"
#include "esp_netif_ppp.h"
#include "esp_modem.h"
#include "esp_modem_netif.h"
#include "esp_log.h"
#include "sim800.h"
#include "bg96.h"
#include "sim7600.h"
#include "esp_modem_dte.h"

static const char *TAG = "sim_module";
static EventGroupHandle_t event_group = NULL;
static const int CONNECT_BIT = BIT0;
static const int STOP_BIT = BIT1;
static modem_dte_t *dte = NULL;
static modem_dce_t *dce = NULL;
static esp_netif_t *esp_netif = NULL;
#define MODEM_COMMAND_TIMEOUT_DEFAULT 5000  // 3 giây

#define CONFIG_EXAMPLE_MODEM_UART_TX_PIN 10
#define CONFIG_EXAMPLE_MODEM_UART_RX_PIN 9
static bool handler_registered = false;

#define CONFIG_EXAMPLE_MODEM_UART_RX_BUFFER_SIZE 1024
#define CONFIG_EXAMPLE_MODEM_UART_TX_BUFFER_SIZE 1024
static void modem_event_handler(void *event_handler_arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    switch (event_id) {
    case ESP_MODEM_EVENT_PPP_START:
        ESP_LOGI(TAG, "Modem PPP Started");
        break;
    case ESP_MODEM_EVENT_PPP_STOP:
        ESP_LOGI(TAG, "Modem PPP Stopped");
        xEventGroupSetBits(event_group, STOP_BIT);
        break;
    case ESP_MODEM_EVENT_UNKNOWN:
        ESP_LOGW(TAG, "Unknown line received: %s", (char *)event_data);
        break;
    default:
        break;
    }
}

static void on_ppp_changed(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    ESP_LOGI(TAG, "PPP state changed event %ld", event_id);
}

static void on_ip_event(void *arg, esp_event_base_t event_base, int32_t event_id, void *event_data) {
    ESP_LOGD(TAG, "IP event! %ld", event_id);
    if (event_id == IP_EVENT_PPP_GOT_IP) {
        esp_netif_dns_info_t dns_info;
        ip_event_got_ip_t *event = (ip_event_got_ip_t *)event_data;

        ESP_LOGI(TAG, "Modem Connect to PPP Server");
        ESP_LOGI(TAG, "IP          : " IPSTR, IP2STR(&event->ip_info.ip));
        ESP_LOGI(TAG, "Netmask     : " IPSTR, IP2STR(&event->ip_info.netmask));
        ESP_LOGI(TAG, "Gateway     : " IPSTR, IP2STR(&event->ip_info.gw));
        esp_netif_get_dns_info(event->esp_netif, 0, &dns_info);
        ESP_LOGI(TAG, "Name Server1: " IPSTR, IP2STR(&dns_info.ip.u_addr.ip4));
        esp_netif_get_dns_info(event->esp_netif, 1, &dns_info);
        ESP_LOGI(TAG, "Name Server2: " IPSTR, IP2STR(&dns_info.ip.u_addr.ip4));
        xEventGroupSetBits(event_group, CONNECT_BIT);
    } else if (event_id == IP_EVENT_PPP_LOST_IP) {
        ESP_LOGI(TAG, "Modem Disconnect from PPP Server");
    }
}

void sim_initialize(void) {
    ESP_ERROR_CHECK(esp_netif_init());
    ESP_ERROR_CHECK(esp_event_loop_create_default());
    if (!handler_registered) {
        ESP_ERROR_CHECK(esp_event_handler_register(IP_EVENT, ESP_EVENT_ANY_ID, &on_ip_event, NULL));
        ESP_ERROR_CHECK(esp_event_handler_register(NETIF_PPP_STATUS, ESP_EVENT_ANY_ID, &on_ppp_changed, NULL));
        handler_registered = true;
    }


    event_group = xEventGroupCreate();

    esp_modem_dte_config_t config = ESP_MODEM_DTE_DEFAULT_CONFIG();
    config.tx_io_num = CONFIG_EXAMPLE_MODEM_UART_TX_PIN;
    config.rx_io_num = CONFIG_EXAMPLE_MODEM_UART_RX_PIN;


    dte = esp_modem_dte_init(&config);
    ESP_ERROR_CHECK(esp_modem_set_event_handler(dte, modem_event_handler, ESP_EVENT_ANY_ID, NULL));

    esp_netif_config_t cfg = ESP_NETIF_DEFAULT_PPP();
    esp_netif = esp_netif_new(&cfg);
    assert(esp_netif);

    void *modem_netif_adapter = esp_modem_netif_setup(dte);
    esp_modem_netif_set_default_handlers(modem_netif_adapter, esp_netif);

    dce = sim800_init(dte); // Adjust based on your modem
    assert(dce != NULL);
    ESP_ERROR_CHECK(dce->set_flow_ctrl(dce, MODEM_FLOW_CONTROL_NONE));
    ESP_ERROR_CHECK(dce->store_profile(dce));
}

void sim_connect(void) {
    ESP_LOGI(TAG, "Connecting to PPP...");
    esp_netif_attach(esp_netif, esp_modem_netif_setup(dte));

    EventBits_t bits = xEventGroupWaitBits(event_group, CONNECT_BIT, pdTRUE, pdTRUE, pdMS_TO_TICKS(10000));
    if (bits & CONNECT_BIT) {
        ESP_LOGI(TAG, "PPP connection established successfully.");
    } else {
        ESP_LOGE(TAG, "Failed to establish PPP connection. Reinitializing...");
        sim_initialize(); // Khởi tạo lại nếu kết nối thất bại
    }
}

void sim_disconnect(void) {
    ESP_ERROR_CHECK(esp_modem_stop_ppp(dte));
    ESP_LOGI(TAG, "PPP Stopped");

    esp_modem_netif_clear_default_handlers(esp_modem_netif_setup(dte));
    esp_modem_netif_teardown(esp_modem_netif_setup(dte));
    esp_netif_destroy(esp_netif);
    ESP_ERROR_CHECK(dte->deinit(dte));
}
void sim_enter_sleep_mode(void) {
    ESP_LOGI(TAG, "Entering sleep mode...");
    if (dce && dce->dte) {
        // Thoát PPP trước khi gửi lệnh
        ESP_LOGI(TAG, "Stopping PPP mode...");
        esp_err_t err = esp_modem_stop_ppp(dce->dte);
        if (err != ESP_OK) {
            ESP_LOGE(TAG, "Failed to stop PPP mode. Error: %s", esp_err_to_name(err));
            return;
        }
        ESP_LOGI(TAG, "PPP mode stopped successfully.");

        // Gửi lệnh để vào chế độ ngủ
        const char *at_command = "AT+CSCLK=1\r\n";
        dce->handle_line = esp_modem_dce_handle_response_default;
        err = dce->dte->send_cmd(dce->dte, at_command, MODEM_COMMAND_TIMEOUT_DEFAULT);
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "SIM module entered sleep mode successfully.");
        } else {
            ESP_LOGE(TAG, "Failed to put SIM module into sleep mode. Error: %s", esp_err_to_name(err));
        }
    } else {
        ESP_LOGE(TAG, "DCE (modem) or DTE is not initialized.");
    }
}

void sim_wake_from_sleep_mode(void) {
    ESP_LOGI(TAG, "Waking up from sleep mode...");
    
    if (dce && dce->dte) {
        // Lệnh AT để đánh thức module
        const char *at_command = "AT\r\n";  // Lệnh AT đơn giản để đánh thức
        dce->handle_line = esp_modem_dce_handle_response_default;  // Xử lý mặc định dòng trả về
        
        // Gửi lệnh AT và đợi phản hồi lâu hơn một chút
        esp_err_t err = dce->dte->send_cmd(dce->dte, at_command, 15000); // Tăng thời gian chờ lên 15s
        if (err == ESP_OK) {
            ESP_LOGI(TAG, "SIM module woke up successfully.");
            
            // Đồng bộ lại module với lệnh sync
            err = dce->sync(dce);
            if (err == ESP_OK) {
                ESP_LOGI(TAG, "SIM module re-synced successfully.");
            } else {
                ESP_LOGE(TAG, "Failed to re-sync SIM module. Reinitializing...");
                sim_initialize();  // Khởi tạo lại nếu cần thiết
            }
        } else {
            ESP_LOGE(TAG, "Failed to wake up SIM module. Error: %s", esp_err_to_name(err));
            ESP_LOGE(TAG, "Reinitializing...");
            sim_initialize();  // Khởi tạo lại nếu wakeup thất bại
        }
    } else {
        ESP_LOGE(TAG, "DCE (modem) or DTE is not initialized.");
        sim_initialize();  // Khởi tạo lại nếu DCE/DTE không sẵn sàng
    }
}


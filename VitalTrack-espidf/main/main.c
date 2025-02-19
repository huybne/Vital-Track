

#include <stdio.h>
#include <string.h>
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/semphr.h"
#include "esp_log.h"
#include "driver/uart.h"
#include "gps.h"
#include "max30102.h"
#include "algorithm.h"
#include "i2c-easy.h"
#include "ble.h"
#include "esp_mac.h"
#include "esp_system.h"
#include "nvs_flash.h"
#include "nvs.h"
#include "esp_sleep.h"
#include "driver/gpio.h"

#define I2C_MASTER_SCL_IO 8
#define I2C_MASTER_SDA_IO 7
#define I2C_MASTER_NUM I2C_NUM_0
#define I2C_MASTER_FREQ_HZ 100000

#define I2C_MASTER_SCL2_IO 4
#define I2C_MASTER_SDA2_IO 3
#define MAX17043_ADDR 0x36

#define A7680C_UART_NUM UART_NUM_1
#define A7680C_TX_PIN 10
#define A7680C_RX_PIN 9
#define BUF_SIZE 1024

static const char *TAG = "SYSTEM";
static SemaphoreHandle_t i2c_mutex;
static TaskHandle_t max30102_task_handle = NULL;
typedef enum
{
    STATE_BLE_WIFI,
    STATE_BLE_NO_WIFI,
    STATE_NO_BLE_4G,

} device_state_t;

device_state_t current_state;

typedef struct
{
    double latitude;
    double longitude;
    bool valid;
} GPSData;

GPSData latest_gps_data = {0};
bool new_gps_data_available = false;

void uart_a7680c_init()
{
    uart_config_t uart_config = {
        .baud_rate = 115200,                   // Baud rate
        .data_bits = UART_DATA_8_BITS,         // 8-bit data
        .parity = UART_PARITY_DISABLE,         // No parity
        .stop_bits = UART_STOP_BITS_1,         // 1 stop bit
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE, // No flow control
    };

    ESP_ERROR_CHECK(uart_param_config(A7680C_UART_NUM, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(A7680C_UART_NUM, A7680C_TX_PIN, A7680C_RX_PIN, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_ERROR_CHECK(uart_driver_install(A7680C_UART_NUM, BUF_SIZE * 2, 0, 0, NULL, 0));

    ESP_LOGI(TAG, "UART for A7680C initialized.");
}

void i2c_setup(void)
{
    ESP_ERROR_CHECK(i2c_master_init(I2C_MASTER_NUM, I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO));
    ESP_LOGI(TAG, "I2C initialized successfully on SDA=%d, SCL=%d", I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);
}

void i2c_select_pins(int sda_io, int scl_io)
{
    ESP_ERROR_CHECK(i2c_set_pin(I2C_MASTER_NUM, sda_io, scl_io, GPIO_PULLUP_ENABLE, GPIO_PULLUP_ENABLE, I2C_MODE_MASTER));
    vTaskDelay(pdMS_TO_TICKS(50));
    ESP_LOGI(TAG, "I2C pins set: SDA=%d, SCL=%d", sda_io, scl_io);
}

void get_mac_address(char *mac_str, size_t len)
{
    uint8_t mac[6];
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    snprintf(mac_str, len, "%02X%02X%02X%02X%02X%02X", mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
}

void gps_deactivate()
{
    gps_sleep(); // Đưa GPS vào chế độ ngủ
    ESP_LOGI(TAG, "GPS deactivated.");
}

void send_at_command(const char *command, int delay_ms)
{
    uart_write_bytes(A7680C_UART_NUM, command, strlen(command));
    uart_write_bytes(A7680C_UART_NUM, "\r\n", 2);
    vTaskDelay(pdMS_TO_TICKS(delay_ms));
}

void sim_deactivate()
{
    send_at_command("AT+CSCLK=1", 1000); // Lệnh đưa SIM vào chế độ ngủ
    ESP_LOGI(TAG, "SIM module deactivated.");
}

void sim_wake()
{
    send_at_command("AT+CPOWD=0", 1000); // Đánh thức SIM và bật chức năng mạng
    ESP_LOGI(TAG, "SIM module activated.");
}

void send_alert_to_mail()
{
    char json_data[256];
    char http_command[512];
    char url[256];
    char mac_str[18];

    get_mac_address(mac_str, sizeof(mac_str));
    ESP_LOGI(TAG, "Device MAC Address: %s", mac_str);

    snprintf(url, sizeof(url), "http://3.25.111.31:8080/api/v1/alert");

    snprintf(json_data, sizeof(json_data), "{\"deviceId\":\"%s\"}", mac_str);
    ESP_LOGI(TAG, "Payload: %s", json_data);
    ESP_LOGI(TAG, "Starting HTTP POST...");
    ESP_LOGI(TAG, "POST URL: %s", url);

    send_at_command("AT+HTTPINIT", 1000);

    char command[512];
    snprintf(command, sizeof(command), "AT+HTTPPARA=\"URL\",\"%s\"", url);
    send_at_command(command, 1000);

    send_at_command("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 1000);

    snprintf(http_command, sizeof(http_command), "AT+HTTPDATA=%d,10000", strlen(json_data));
    send_at_command(http_command, 1000);
    send_at_command(json_data, 1000);

    send_at_command("AT+HTTPACTION=1", 10000);

    char response[64];
    int status_code = -1;
    uart_read_bytes(A7680C_UART_NUM, response, sizeof(response), pdMS_TO_TICKS(2000));
    if (sscanf(response, "+HTTPACTION: 1,%d", &status_code) == 1)
    {
        if (status_code == 200)
        {
            ESP_LOGI(TAG, "HTTP POST successful. Status code: %d", status_code);
        }
        else
        {
            ESP_LOGE(TAG, "HTTP POST failed. Status code: %d", status_code);
        }
    }
    else
    {
        ESP_LOGE(TAG, "Failed to parse HTTPACTION response.");
    }

    send_at_command("AT+HTTPREAD", 2000);

    send_at_command("AT+HTTPTERM", 1000);
    ESP_LOGI(TAG, "HTTP POST completed.");
}

void handle_fall_warning()
{
    static bool already_warned = false;

    if (!already_warned)
    {
        already_warned = true;
        ESP_LOGW("FALL_WARNING", "Fall detected! Sending alert...");

        send_alert_to_mail();            // Gửi cảnh báo
        vTaskDelay(pdMS_TO_TICKS(5000)); // Chờ 5 giây trước khi cho phép gửi lại
        already_warned = false;
    }
}

void send_https_post(double latitude, double longitude)
{
    char json_data[256];
    char http_command[512];
    char url[256];
    char mac_str[18];

    get_mac_address(mac_str, sizeof(mac_str));

    snprintf(url, sizeof(url),
             "https://vitaltrack-92b70-default-rtdb.asia-southeast1.firebasedatabase.app/%s/user.json",
             mac_str);

    snprintf(json_data, sizeof(json_data),
             "{\"latitude\": %.6f, \"longitude\": %.6f}", latitude, longitude);

    ESP_LOGI(TAG, "Starting HTTPS PUT...");
    ESP_LOGI(TAG, "PUT URL: %s", url);

    send_at_command("AT+HTTPINIT", 1000);
    send_at_command("AT+HTTPSSL=1", 1000);

    char command[512];
    snprintf(command, sizeof(command), "AT+HTTPPARA=\"URL\",\"%s\"", url);
    send_at_command("AT+HTTPPARA=\"CID\",1", 1000);
    send_at_command(command, 1000);
    send_at_command("AT+HTTPPARA=\"CONTENT\",\"application/json\"", 1000);

    snprintf(http_command, sizeof(http_command), "AT+HTTPDATA=%d,10000", strlen(json_data));
    send_at_command(http_command, 1000);
    send_at_command(json_data, 1000);

    send_at_command("AT+HTTPACTION=1", 5000);

    char response[64];
    int status_code = -1;

    uart_read_bytes(A7680C_UART_NUM, response, sizeof(response), pdMS_TO_TICKS(1000));
    if (sscanf(response, "+HTTPACTION: 1,%d", &status_code) == 1)
    {
        if (status_code == 200)
        {
            ESP_LOGI(TAG, "HTTPS PUT successful. Status code: %d", status_code);
        }
        else
        {
            ESP_LOGE(TAG, "HTTPS PUT failed. Status code: %d", status_code);
        }
    }
    else
    {
        ESP_LOGE(TAG, "Failed to parse HTTPACTION response.");
    }

    send_at_command("AT+HTTPREAD", 2000); // Đọc dữ liệu trả về nếu cần
    send_at_command("AT+HTTPTERM", 1000); // Kết thúc phiên HTTP
    ESP_LOGI(TAG, "HTTPS PUT completed.");
}

void health_data_task(void *pvParameters)
{
    while (1)
    {
        if (health_data_active && current_conn_handle != 0)
        {
            ESP_LOGI(TAG, "health_data_active: %d, current_conn_handle: %d", health_data_active, current_conn_handle);

            if (max30102_is_active())
            {

                char health_data[128];
                snprintf(health_data, sizeof(health_data),
                         "{\"HeartRate\":%.2f,\"SpO2\":%.2f}", heartrate, pctspo2);

                ble_set_data(health_data);
                ESP_LOGI(TAG, "HeartRate: %.2f, SpO2: %.2f", heartrate, pctspo2);
            }
            else
            {
                ESP_LOGW(TAG, "MAX30102 is in sleep mode, skipping read.");
            }

            vTaskDelay(pdMS_TO_TICKS(1900)); // Gửi dữ liệu mỗi 2 giây
        }
        else
        {
            vTaskDelay(pdMS_TO_TICKS(500)); // Kiểm tra lại mỗi 500ms
        }
    }
}

void gps_task(void *pvParameters)
{

    esp_err_t gps_init_result = GPS_init();
    if (gps_init_result != ESP_OK)
    {
        printf("Failed to initialize GPS module, error: %d\n", gps_init_result);
        vTaskDelete(NULL); // Delete the task if initialization failed
        return;            // Exit if initialization failed
    }

    while (1)
    {

        if (gps_active)
        {

            GPS_data gps_data = gps_get_value();

            if (gps_data.valid)
            {
                latest_gps_data.latitude = gps_data.latitude;
                latest_gps_data.longitude = gps_data.longitude;
                new_gps_data_available = true;

                printf("Latitude: %.6f, Longitude: %.6f, Time: %02d:%02d:%02d\n",
                       gps_data.latitude, gps_data.longitude, gps_data.hour, gps_data.minute, gps_data.second);
            }
            else
            {
                printf("GPS not connected yet.\n");
            }
        }
        else
        {
            ESP_LOGI("GPS", "GPS is in sleep mode. Skipping data read.");
        }

        vTaskDelay(2000 / portTICK_PERIOD_MS);
    }
}

void sim_gps_task(void *pvParameters)
{
    while (1)
    {
        if (current_state == STATE_BLE_NO_WIFI || current_state == STATE_NO_BLE_4G)
        {
            if (new_gps_data_available)
            {
                send_https_post(latest_gps_data.latitude, latest_gps_data.longitude);
                new_gps_data_available = false;
            }
            vTaskDelay(pdMS_TO_TICKS(2000));
        }
        else
        {
            vTaskDelay(pdMS_TO_TICKS(5000));
        }
    }
}

void mpu9250_task(void *pvParameters)
{
    while (1)
    {
        if (xSemaphoreTake(i2c_mutex, portMAX_DELAY)) // Lấy mutex
        {

            i2c_select_pins(I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);

            run_imu();                 // Đọc giá trị IMU (gia tốc, góc nghiêng)
            xSemaphoreGive(i2c_mutex); // Trả lại mutex
        }
        else
        {
            ESP_LOGW(TAG, "Failed to acquire I2C mutex in MPU9250 task.");
        }

        vTaskDelay(pdMS_TO_TICKS(100));
    }
}

void check_state()
{
    static device_state_t previous_state = -1; // Lưu trạng thái trước đó để tránh thực hiện lại

    if (ble_connected()) // BLE đang kết nối
    {
        if (network_connected) // Có mạng Wi-Fi hoặc 4G
        {
            current_state = STATE_BLE_WIFI;

            if (previous_state != STATE_BLE_WIFI)
            {
                gps_deactivate(); // Tắt GPS
                sim_deactivate(); // Tắt SIM
                ESP_LOGI(TAG, "State 0: BLE + Wi-Fi. Deactivated GPS and SIM.");
            }
        }
        else
        {
            current_state = STATE_BLE_NO_WIFI;

            if (previous_state != STATE_BLE_NO_WIFI)
            {
                gps_wake(); // Bật GPS
                sim_wake(); // Bật SIM
                ESP_LOGI(TAG, "State 1: BLE + No Wi-Fi. Activated GPS and SIM.");
            }
        }
    }
    else // Không có BLE -> Chuyển về dùng 4G
    {
        current_state = STATE_NO_BLE_4G;

        if (previous_state != STATE_NO_BLE_4G)
        {
            gps_wake(); // Bật GPS
            sim_wake(); // Bật SIM
            ESP_LOGI(TAG, "State 2: No BLE + 4G. Activated GPS and SIM.");
        }
    }

    previous_state = current_state;
}

void handle_command(const char *command)
{
    if (strcmp(command, "GET_HEALTH_DATA") == 0)
    {
        health_data_active = true; // Bật trạng thái
        max30102_wake();           // Đánh thức MAX30102
        ESP_LOGI(TAG, "Health Data Activated - MAX30102 Wake Up");

        if (max30102_task_handle == NULL)
        {
            i2c_select_pins(I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);

            xTaskCreate(health_data_task, "max30102_task", 2048, NULL, 5, &max30102_task_handle);
            ESP_LOGI(TAG, "MAX30102 Task Created");
        }
    }
    else if (strcmp(command, "OFF_HEALTH_DATA") == 0)
    {
        health_data_active = false; // Tắt trạng thái
        max30102_sleep();           // Đưa MAX30102 về chế độ ngủ
    }
    else if (strcmp(command, "NETWORK_ON") == 0)
    {
        network_connected = true;
        ESP_LOGI(TAG, "Network status: ONLINE");
    }
    else if (strcmp(command, "NETWORK_OFF") == 0)
    {
        network_connected = false;
        ESP_LOGI(TAG, "Network status: NO NETWORK");
    }
    else if (strcmp(command, "LOST_NETWORK") == 0)
    {
        ESP_LOGI(TAG, "Received LOST_NETWORK command. Switching to BLE + No Wi-Fi mode...");
        current_state = STATE_BLE_NO_WIFI; // Chuyển sang trạng thái BLE + No Wi-Fi
        gps_wake();                        // Bật GPS
        sim_wake();                        // Bật SIM
        ESP_LOGI(TAG, "State: BLE + No Wi-Fi. Activated GPS and SIM.");
    }
    else
    {
        ESP_LOGW(TAG, "Unknown Command: %s", command);
    }
}

#define I2C_RETRY_COUNT 3

void update_battery_ble_buffer(float percentage, float voltage)
{
    snprintf(battery_ble_buffer, BATTERY_BLE_BUFFER_SIZE, "{\"Battery\":%.2f,\"Voltage\":%.2f}", percentage, voltage);
    ble_set_data(battery_ble_buffer); // Gửi buffer qua BLE
    ESP_LOGI(TAG, "Battery data updated in BLE buffer: %s", battery_ble_buffer);
}

void read_battery_data(float *percentage, float *voltage)
{
    uint8_t data[4];
    esp_err_t ret;
    int retry = 0;

    while (retry < I2C_RETRY_COUNT)
    {
        ESP_LOGI(TAG, "Attempting to read battery data (try %d/%d)", retry + 1, I2C_RETRY_COUNT);
        ret = i2c_read_bytes(I2C_MASTER_NUM, MAX17043_ADDR, 0x02, data, 4); // Đọc cả điện áp và phần trăm pin

        if (ret == ESP_OK)
        {
            uint16_t voltage_raw = (data[0] << 4) | (data[1] >> 4);
            uint16_t soc_raw = (data[2] << 8) | data[3];

            *voltage = voltage_raw * 1.25 / 1000.0; // Quy đổi giá trị điện áp
            *percentage = soc_raw / 256.0;          // Quy đổi phần trăm pin

            ESP_LOGI(TAG, "Battery data read successfully: Percentage=%.2f%%, Voltage=%.2fV", *percentage, *voltage);
            return;
        }
        else
        {
            ESP_LOGE(TAG, "Failed to read battery data, retrying...");
            vTaskDelay(pdMS_TO_TICKS(500)); // Chờ 500ms trước khi thử lại
            retry++;
        }
    }

    ESP_LOGE(TAG, "Failed to read battery data after %d retries", I2C_RETRY_COUNT);
    *percentage = -1;
    *voltage = -1;
}

void battery_monitor_task(void *pvParameters)
{
    float battery_percentage = 0;
    float battery_voltage = 0;

    while (1)
    {

        i2c_select_pins(I2C_MASTER_SDA2_IO, I2C_MASTER_SCL2_IO);
        ESP_LOGI(TAG, "Selected I2C pins for MAX17043: SDA=%d, SCL=%d", I2C_MASTER_SDA2_IO, I2C_MASTER_SCL2_IO);

        read_battery_data(&battery_percentage, &battery_voltage);

        if (battery_percentage >= 0 && battery_voltage >= 0)
        {
            ESP_LOGI(TAG, "Battery percentage: %.2f%%", battery_percentage);
            ESP_LOGI(TAG, "Battery voltage: %.2fV", battery_voltage);

            update_battery_ble_buffer(battery_percentage, battery_voltage);

            if (ble_connected())
            {
                ble_notify(current_conn_handle, battery_ble_buffer); // Gửi thông báo dữ liệu pin qua BLE
                ESP_LOGI(TAG, "Notification sent with battery data: %s", battery_ble_buffer);
            }
        }
        else
        {
            ESP_LOGE(TAG, "Error reading battery data.");
        }

        i2c_select_pins(I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);
        ESP_LOGI(TAG, "Restored I2C pins for MPU9250 and MAX30102: SDA=%d, SCL=%d", I2C_MASTER_SDA_IO, I2C_MASTER_SCL_IO);

        vTaskDelay(pdMS_TO_TICKS(60000)); // Chờ 60 giây trước khi đọc lại
    }
}

void app_main()
{
    i2c_mutex = xSemaphoreCreateMutex();
    i2c_setup();
    uart_a7680c_init();

    register_fall_warning_callback(handle_fall_warning);

    connect_ble();
    register_command_callback(handle_command);
    max30102_task_handle = NULL;
    xTaskCreate(gps_task, "gps_task", 4096, NULL, 5, NULL);
    xTaskCreate(sim_gps_task, "sim_gps_task", 4096, NULL, 5, NULL);
    xTaskCreate(battery_monitor_task, "battery_monitor_task", 2048, NULL, 5, NULL);
    ESP_LOGI(TAG, "Battery monitor task created.");

    xTaskCreate(mpu9250_task, "mpu9250_task", 4096, NULL, 5, NULL);

    while (1)
    {

        check_state();
        ESP_LOGI(TAG, "Current state: %d", current_state);
        vTaskDelay(pdMS_TO_TICKS(5000));
    }
}

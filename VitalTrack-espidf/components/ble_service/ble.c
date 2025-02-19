#include "ble.h"
#include <string.h>
#include "driver/gpio.h"
#include "nvs_flash.h" // Thêm thư viện này để sử dụng nvs_flash_init
#include "max30102.h"
#include "esp_sleep.h"
#include "esp_bt.h"

#include "esp_mac.h" // Thư viện hỗ trợ esp_read_mac
static int device_read_battery(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg);

// Khai báo trước hàm read_mac_callback
int read_mac_callback(uint16_t conn_handle, uint16_t attr_handle,
                      struct ble_gatt_access_ctxt *ctxt, void *arg);
static const char *TAG = "BLE-Server";


uint8_t ble_addr_type;
struct ble_gap_adv_params adv_params;
bool ble_connected(void)
{
    return (current_conn_handle != 0); // Nếu có conn_handle khác 0 thì BLE đang kết nối
}

bool network_connected = false;
bool health_data_active = false;
#define BLE_DATA_BUFFER_SIZE 512
char ble_data_buffer[BLE_DATA_BUFFER_SIZE] = {0};

// Hàm để cập nhật buffer
void ble_set_data(const char *data)
{
    // Sao chép dữ liệu vào buffer, giới hạn kích thước
    strncpy(ble_data_buffer, data, BLE_DATA_BUFFER_SIZE - 1);
    ble_data_buffer[BLE_DATA_BUFFER_SIZE - 1] = '\0'; // Đảm bảo kết thúc chuỗi
}

// Hàm để xóa buffer
void ble_clear_data()
{
    memset(ble_data_buffer, 0, sizeof(ble_data_buffer));
}
// Khai báo trước hàm host_task
void host_task(void *param);
static int device_description_read(uint16_t conn_handle, uint16_t attr_handle,
                                   struct ble_gatt_access_ctxt *ctxt, void *arg);
static int device_description_write(uint16_t conn_handle, uint16_t attr_handle,
                                    struct ble_gatt_access_ctxt *ctxt, void *arg);

uint8_t ble_addr_type;
struct ble_gap_adv_params adv_params;
uint16_t current_conn_handle = 0;
// GATT Service Definitions
static const struct ble_gatt_svc_def gatt_svcs[] = {
    {
        .type = BLE_GATT_SVC_TYPE_PRIMARY,
        .uuid = BLE_UUID16_DECLARE(0x0180), // UUID của dịch vụ
        .characteristics = (struct ble_gatt_chr_def[]){
            {
                .uuid = BLE_UUID16_DECLARE(0xFEF4), // UUID của đặc tính
                .flags = BLE_GATT_CHR_F_READ,
                .access_cb = device_read,
                .descriptors = (struct ble_gatt_dsc_def[]){
                    {
                        .uuid = BLE_UUID16_DECLARE(0x2901), // UUID chuẩn cho "Characteristic User Description"
                        .att_flags = BLE_ATT_F_READ,
                        .access_cb = device_description_read, // Callback để cung cấp mô tả
                    },
                    {0}, // Kết thúc danh sách descriptors
                },
            },
            {
                .uuid = BLE_UUID16_DECLARE(0xDEAD), // UUID của đặc tính
                .flags = BLE_GATT_CHR_F_WRITE,
                .access_cb = device_write,
                .descriptors = (struct ble_gatt_dsc_def[]){
                    {
                        .uuid = BLE_UUID16_DECLARE(0x2901), // UUID chuẩn cho "Characteristic User Description"
                        .att_flags = BLE_ATT_F_READ,
                        .access_cb = device_description_write, // Callback để cung cấp mô tả
                    },
                    {0}, // Kết thúc danh sách descriptors
                },
            },
            {
                .uuid = BLE_UUID16_DECLARE(0xF00D), // UUID mới cho đặc tính đọc MAC Address
                .flags = BLE_GATT_CHR_F_READ,       // Chỉ cho phép đọc
                .access_cb = read_mac_callback,     // Callback trả về MAC Address
            },
            {
                .uuid = BLE_UUID16_DECLARE(0xBEEF),                   // UUID mới cho dữ liệu pin
                .flags = BLE_GATT_CHR_F_READ | BLE_GATT_CHR_F_NOTIFY, // Cho phép đọc và thông báo
                .access_cb = device_read_battery,                     // Callback để đọc dữ liệu pin
            },

            {0}, // Kết thúc danh sách Characteristics
        },
    },
    {0}, // Kết thúc danh sách Services
};
char battery_ble_buffer[BATTERY_BLE_BUFFER_SIZE] = {0};

static int device_read_battery(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    if (strlen(battery_ble_buffer) == 0)
    {
        ESP_LOGW(TAG, "Battery BLE buffer is empty");
        return BLE_ATT_ERR_INSUFFICIENT_RES;
    }

    // Gửi dữ liệu pin từ buffer qua BLE
    os_mbuf_append(ctxt->om, battery_ble_buffer, strlen(battery_ble_buffer));
    ESP_LOGI(TAG, "Sent battery data: %s", battery_ble_buffer);

    return 0; // Trả về thành công
}


static int device_description_read(uint16_t conn_handle, uint16_t attr_handle,
                                   struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    const char *description = "Characteristic for reading data";
    os_mbuf_append(ctxt->om, description, strlen(description));
    return 0;
}

static int device_description_write(uint16_t conn_handle, uint16_t attr_handle,
                                    struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    const char *description = "Characteristic for writing data";
    os_mbuf_append(ctxt->om, description, strlen(description));
    return 0;
}

// Advertise BLE
void ble_app_advertise(void)
{
    struct ble_hs_adv_fields fields;
    memset(&fields, 0, sizeof(fields));

    const char *device_name = ble_svc_gap_device_name();
    fields.name = (uint8_t *)device_name;
    fields.name_len = strlen(device_name);
    fields.name_is_complete = 1;

    ble_gap_adv_set_fields(&fields);
    memset(&adv_params, 0, sizeof(adv_params));
    adv_params.conn_mode = BLE_GAP_CONN_MODE_UND;
    adv_params.disc_mode = BLE_GAP_DISC_MODE_GEN;

    ESP_ERROR_CHECK(ble_gap_adv_start(ble_addr_type, NULL, BLE_HS_FOREVER, &adv_params, ble_gap_event, NULL));
    ESP_LOGI(TAG, "BLE advertising started.");
}

// BLE on sync callback
void ble_app_on_sync(void)
{
    ble_hs_id_infer_auto(0, &ble_addr_type);
    ble_app_advertise();
}

// BLE GAP Event Callback
int ble_gap_event(struct ble_gap_event *event, void *arg)
{
    switch (event->type)
    {
    case BLE_GAP_EVENT_CONNECT:
        ESP_LOGI(TAG, "BLE connection %s", event->connect.status == 0 ? "established" : "failed");
        if (event->connect.status == 0)
        {
            current_conn_handle = event->connect.conn_handle; // Lưu conn_handle khi kết nối
        }
        else
        {
            ble_app_advertise(); // Quảng bá lại nếu kết nối thất bại
        }
        break;

    case BLE_GAP_EVENT_DISCONNECT:
        ESP_LOGI(TAG, "BLE disconnected.");
        max30102_sleep();
        ESP_LOGI(TAG, "MAX30102 put to sleep due to BLE disconnect.");

        current_conn_handle = 0; // Xóa conn_handle khi mất kết nối
        ble_app_advertise();

        break;

    case BLE_GAP_EVENT_ADV_COMPLETE:
        ESP_LOGI(TAG, "BLE advertising completed.");
        ble_app_advertise();
        break;

    default:
        break;
    }
    return 0;
}

// Device Read
int device_read(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    // Kiểm tra nếu buffer trống
    if (strlen(ble_data_buffer) == 0)
    {
        ESP_LOGW(TAG, "BLE data buffer is empty");
        return BLE_ATT_ERR_INSUFFICIENT_RES;
    }

    // Gửi dữ liệu từ buffer qua BLE
    os_mbuf_append(ctxt->om, ble_data_buffer, strlen(ble_data_buffer));
    ESP_LOGI(TAG, "Sent data: %s", ble_data_buffer);

    return 0;
}
int read_mac_callback(uint16_t conn_handle, uint16_t attr_handle,
                      struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    char mac_str[18];
    uint8_t mac[6];

    // Đọc địa chỉ MAC của ESP32
    esp_read_mac(mac, ESP_MAC_WIFI_STA);
    snprintf(mac_str, sizeof(mac_str), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);

    // Gửi địa chỉ MAC qua BLE
    os_mbuf_append(ctxt->om, mac_str, strlen(mac_str));
    ESP_LOGI(TAG, "Sent MAC Address: %s", mac_str);

    return 0; // Thành công
}

static void (*command_callback)(const char *command) = NULL;

// Device Write
// Device Write
int device_write(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg)
{
    char command[32] = {0};
    memcpy(command, ctxt->om->om_data, ctxt->om->om_len);
    command[ctxt->om->om_len] = '\0';

    ESP_LOGI(TAG, "Received Command: %s", command);

    // Gọi callback nếu được đăng ký
    if (command_callback != NULL)
    {
        command_callback(command); // Chuyển lệnh cho xử lý ngoài
    }
    else
    {
        ESP_LOGW(TAG, "No command callback registered.");
    }

    return 0;
}

void register_command_callback(void (*callback)(const char *command))
{
    command_callback = callback;
}
// Initialize BLE
void connect_ble(void)
{
    // Bảo đảm NVS đã được khởi tạo
    ESP_ERROR_CHECK(nvs_flash_init());

    // Thêm cấu hình BLE Controller
    nimble_port_init();
    ble_svc_gap_device_name_set("Vital-Track"); // Đặt tên BLE
    ble_svc_gap_init();
    ble_svc_gatt_init();

    ESP_LOGI(TAG, "BLE controller initialized and enabled.");

    // Khởi tạo NimBLE stack
    nimble_port_init();
    ble_svc_gap_device_name_set("Vital-Track"); // Đặt tên BLE
    ble_svc_gap_init();
    ble_svc_gatt_init();
    ble_gatts_count_cfg(gatt_svcs);
    ble_gatts_add_svcs(gatt_svcs);
    ble_hs_cfg.sync_cb = ble_app_on_sync;

    // Khởi động NimBLE FreeRTOS task
    nimble_port_freertos_init(host_task);
}

void ble_notify(uint16_t conn_handle, const char *data)
{
    struct os_mbuf *om;

    om = ble_hs_mbuf_from_flat(data, strlen(data));
    if (!om)
    {
        ESP_LOGE(TAG, "Error creating mbuf for notification");
        return;
    }

    // Gửi thông báo từ service đã định nghĩa
    int rc = ble_gattc_notify_custom(conn_handle, 0xDEAD, om);
    if (rc != 0)
    {
        ESP_LOGE(TAG, "Failed to send notification; rc=%d", rc);
    }
    else
    {
        ESP_LOGI(TAG, "Notification sent: %s", data);
    }
}

// Host task for BLE
void host_task(void *param)
{
    nimble_port_run();
}

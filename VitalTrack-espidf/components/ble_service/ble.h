#ifndef BLE_H
#define BLE_H

#include <stdint.h>
#include <stdbool.h>
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "nimble/nimble_port.h"
#include "nimble/nimble_port_freertos.h"
#include "host/ble_hs.h"
#include "services/gap/ble_svc_gap.h"
#include "services/gatt/ble_svc_gatt.h"

// Định nghĩa các giá trị cần thiết
extern uint16_t current_conn_handle;
//static bool max30102_active = false;
// Buffer BLE toàn cục
#define BLE_DATA_BUFFER_SIZE 512
extern char ble_data_buffer[BLE_DATA_BUFFER_SIZE];

#define BATTERY_BLE_BUFFER_SIZE 32
extern  char battery_ble_buffer[BATTERY_BLE_BUFFER_SIZE] ;
extern bool health_data_active;
// Khởi động BLE Advertising
void ble_app_advertise(void);

// Đồng bộ hóa BLE khi hệ thống sẵn sàng
void ble_app_on_sync(void);

// Kết nối BLE
void connect_ble(void);

// Gửi thông báo BLE tới client
void ble_notify(uint16_t conn_handle, const char *data);
void ble_notify_data(uint16_t conn_handle, float heartrate, float spo2, float heading, float pitch, float roll);

// Xử lý yêu cầu ghi từ client
int device_write(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg);

// Xử lý yêu cầu đọc từ client
int device_read(uint16_t conn_handle, uint16_t attr_handle, struct ble_gatt_access_ctxt *ctxt, void *arg);

// Xử lý các sự kiện GAP (kết nối, ngắt kết nối, hoàn thành quảng cáo, ...)
int ble_gap_event(struct ble_gap_event *event, void *arg);

// Cập nhật dữ liệu BLE vào buffer
void ble_set_data(const char *data);
bool ble_connected(void);
extern bool network_connected; 
void handle_command(const char *command);
void register_command_callback(void (*callback)(const char *command));

#endif // BLE_H

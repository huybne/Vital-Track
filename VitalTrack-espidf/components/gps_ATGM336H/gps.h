#ifndef __GPS_H__
#define __GPS_H__

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "esp_log.h"
#include "esp_system.h"
#include "driver/uart.h"
#include "driver/gpio.h"
#include "sdkconfig.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

// GPS module UART configuration
#define UART_GPS UART_NUM_0          // Sử dụng UART số 1
#define UART_GPS_TXD GPIO_NUM_20      // Chân TX của ESP32
#define UART_GPS_RXD GPIO_NUM_21      // Chân RX của ESP32
#define GPS_PPS_PIN GPIO_NUM_2        // Đặt chân PPS của module GPS vào GPIO 2
extern bool gps_active;
// GPS data structure
typedef struct GPS_data_
{
    double latitude;
    double longitude;
    double speed_kmh; // Đơn vị: km/h
    double speed_ms;  // Đơn vị: m/s
    double course;    // Góc phương vị, đơn vị: độ
    double altitude;  // Độ cao, đơn vị: mét
    int hour;
    int minute;
    int second;
    int day;
    int month;
    int year;
    bool valid;       // Biến kiểm tra dữ liệu GPS hợp lệ
} GPS_data;

typedef struct UTC_time
{
    int hour;
    int minute;
    int second;
} UTCtime;

typedef struct UTC_date
{
    int day;
    int month;
    int year;
} UTCdate;

/// @brief Khởi tạo module GPS
esp_err_t GPS_init(void);

/// @brief Đọc dữ liệu từ module GPS
GPS_data gps_get_value(void);

/// @brief Chuyển đổi thời gian UTC sang giờ địa phương (Vietnam time)
UTCtime UTCTime_to_VNTime(double UTC_time);

/// @brief Chuyển đổi ngày UTC sang ngày địa phương (Vietnam date)
UTCdate UTCDate_to_VNDate(double UTC_date);

/// @brief Hàm kiểm tra kết nối GPS và in ra kinh độ, vĩ độ, thời gian nếu đã kết nối
void check_gps_connection(void);
void gps_wake();
void gps_sleep();
#endif // __GPS_H__

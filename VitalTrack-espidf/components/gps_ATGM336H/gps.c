#include "gps.h"

#define GPS_RX_BUF_SIZE 1024

static char GPS_temp_data[GPS_RX_BUF_SIZE]; // Bộ đệm dữ liệu đầu ra từ module GPS
static bool gps_time_synced = false;        // Để theo dõi xem đã đồng bộ thời gian chưa
bool gps_active = false;
// Hàm xử lý ngắt cho tín hiệu PPS
void IRAM_ATTR pps_isr_handler(void *arg)
{
    gps_time_synced = true;
}

// Hàm gửi lệnh đến module GPS qua UART
void send_gps_command(const char *command)
{
    uart_write_bytes(UART_GPS, command, strlen(command));
    uart_write_bytes(UART_GPS, "\r\n", 2); // Kết thúc lệnh bằng CR+LF
}

// Hàm cấu hình module GPS để sử dụng GNSS, bao gồm bật BeiDou
void configure_gps_to_use_gnss()
{
    // Bật tất cả hệ thống GNSS, bao gồm GPS, GLONASS, Galileo, QZSS và BeiDou
    const char *set_gnss_mode = "$PMTK353,1,1,1,1,1,1*2B";
    send_gps_command(set_gnss_mode);
}

// Khởi tạo module GPS và cấu hình chân PPS
esp_err_t GPS_init(void)
{
    uart_config_t uart_config = {
        .baud_rate = 9600,
        .data_bits = UART_DATA_8_BITS,
        .parity = UART_PARITY_DISABLE,
        .stop_bits = UART_STOP_BITS_1,
        .flow_ctrl = UART_HW_FLOWCTRL_DISABLE,
        .source_clk = UART_SCLK_APB};
    ESP_ERROR_CHECK(uart_param_config(UART_GPS, &uart_config));
    ESP_ERROR_CHECK(uart_set_pin(UART_GPS, UART_GPS_TXD, UART_GPS_RXD, UART_PIN_NO_CHANGE, UART_PIN_NO_CHANGE));
    ESP_ERROR_CHECK(uart_driver_install(UART_GPS, GPS_RX_BUF_SIZE * 2, 0, 0, NULL, 0));

    gpio_config_t io_conf;
    io_conf.intr_type = GPIO_INTR_POSEDGE;
    io_conf.pin_bit_mask = (1ULL << GPS_PPS_PIN);
    io_conf.mode = GPIO_MODE_INPUT;
    io_conf.pull_down_en = GPIO_PULLDOWN_DISABLE;
    io_conf.pull_up_en = GPIO_PULLUP_DISABLE;
    ESP_ERROR_CHECK(gpio_config(&io_conf));

    // Kiểm tra và chỉ cài đặt ISR service nếu chưa được cài đặt
    static bool is_isr_service_installed = false;
    if (!is_isr_service_installed)
    {
        esp_err_t err = gpio_install_isr_service(ESP_INTR_FLAG_IRAM);
        if (err == ESP_OK || err == ESP_ERR_INVALID_STATE) // INVALID_STATE: ISR service đã được cài đặt
        {
            is_isr_service_installed = true;
        }
        else
        {
            return err; // Trả về lỗi nếu gặp vấn đề khác
        }
    }

    ESP_ERROR_CHECK(gpio_isr_handler_add(GPS_PPS_PIN, pps_isr_handler, NULL));

    // Cấu hình GPS để bật BeiDou
    configure_gps_to_use_gnss();

    return ESP_OK;
}


// Hàm chuyển đổi thời gian UTC sang giờ địa phương (Vietnam Time)
UTCtime UTCTime_to_VNTime(double UTC_time)
{
    UTCtime VN_time;
    VN_time.hour = (int)(UTC_time / 10000 + 7) % 24;
    VN_time.minute = (int)(UTC_time / 100) % 100;
    VN_time.second = (int)UTC_time % 100;
    return VN_time;
}

// Hàm chuyển đổi ngày UTC sang ngày địa phương (Vietnam date)
UTCdate UTCDate_to_VNDate(double UTC_date)
{
    UTCdate VN_date;
    VN_date.year = (int)(UTC_date / 10000);
    VN_date.month = (int)(UTC_date / 100) % 100;
    VN_date.day = (int)UTC_date % 100;
    return VN_date;
}

// Đọc dữ liệu GPS từ UART và trả về tọa độ, thời gian nếu đã kết nối
GPS_data gps_get_value(void)
{
    GPS_data gps_data = {0};
    const int rxBytes = uart_read_bytes(UART_GPS, (uint8_t *)GPS_temp_data, GPS_RX_BUF_SIZE, 1000 / portTICK_PERIOD_MS);

    if (rxBytes <= 0)
    {
        return gps_data; // Không có dữ liệu nhận được
    }

    GPS_temp_data[rxBytes] = '\0'; // Kết thúc chuỗi
    char *row = strstr(GPS_temp_data, "$GPRMC");
    if (row == NULL)
    {
        row = strstr(GPS_temp_data, "$GNRMC");
    }

    if (row != NULL)
    {
        char *token = strtok(row, ",");

        // Phân tích thời gian UTC
        token = strtok(NULL, ",");
        if (token != NULL)
        {
            double utc_time = atof(token);
            UTCtime vn_time = UTCTime_to_VNTime(utc_time);
            gps_data.hour = vn_time.hour;
            gps_data.minute = vn_time.minute;
            gps_data.second = vn_time.second;
        }

        // Phân tích trạng thái
        token = strtok(NULL, ",");
        gps_data.valid = (token != NULL && token[0] == 'A');

        if (gps_data.valid)
        {
            // Phân tích vĩ độ
            token = strtok(NULL, ",");
            if (token != NULL)
            {
                double raw_latitude = atof(token);
                int degrees = (int)(raw_latitude / 100);
                double minutes = raw_latitude - (degrees * 100);
                gps_data.latitude = degrees + (minutes / 60);
            }

            token = strtok(NULL, ",");
            if (token != NULL && token[0] == 'S')
            {
                gps_data.latitude *= -1;
            }

            // Phân tích kinh độ
            token = strtok(NULL, ",");
            if (token != NULL)
            {
                double raw_longitude = atof(token);
                int degrees = (int)(raw_longitude / 100);
                double minutes = raw_longitude - (degrees * 100);
                gps_data.longitude = degrees + (minutes / 60);
            }

            token = strtok(NULL, ",");
            if (token != NULL && token[0] == 'W')
            {
                gps_data.longitude *= -1;
            }
        }
    }

    return gps_data;
}

// Hàm kiểm tra và hiển thị trạng thái kết nối GPS
void check_gps_connection()
{
    GPS_data gps_data = gps_get_value();

    if (gps_data.valid)
    {
        // In ra thông tin kinh độ, vĩ độ, và thời gian nếu GPS kết nối thành công
        printf("GPS connected. Latitude: %.6f, Longitude: %.6f, Time: %02d:%02d:%02d\n",
               gps_data.latitude, gps_data.longitude,
               gps_data.hour, gps_data.minute, gps_data.second);
    }
    else
    {
        // Nếu chưa kết nối
        printf("GPS not connected yet.\n");
    }
}
void gps_wake()
{
    // Gửi lệnh AT để đánh thức module GPS
    send_gps_command("$PMTK010,002*2D"); // Lệnh đánh thức module GPS
    vTaskDelay(pdMS_TO_TICKS(100));      // Chờ một chút để module sẵn sàng
    gps_active = true;
    ESP_LOGI("GPS", "GPS module woke up.");
}
void gps_sleep()
{
    // Gửi lệnh AT để đưa module GPS vào chế độ ngủ
    send_gps_command("$PMTK161,1*28"); // Lệnh đưa module GPS vào chế độ ngủ
    vTaskDelay(pdMS_TO_TICKS(100));    // Chờ một chút để đảm bảo lệnh được xử lý
    gps_active = false;
    ESP_LOGI("GPS", "GPS module set to sleep.");
}
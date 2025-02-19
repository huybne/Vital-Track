#include "max30102.h"
#include "i2c-easy.h" // Đảm bảo bạn đã thêm i2c-easy.h
#include "esp_log.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
static const char *TAG = "max30102";
static bool max30102_task_created = false;
static bool max30102_active = false;

#define LOG_TAG "MAX30102"
//   #define I2C_MASTER_SCL_IO 7     /*!< gpio number for I2C master clock */
//   #define I2C_MASTER_SDA_IO 6     /*!< gpio number for I2C master data  */
//  #define I2C_MASTER_NUM I2C_NUM_0 /*!< I2C port number for master dev */
// Khai báo các biến toàn cục
float heartrate = 99.2, pctspo2 = 99.2;                 // Lưu giá trị nhịp tim và SpO2
int irpower = 0, rpower = 0, lirpower = 0, lrpower = 0; // Lưu công suất xung LED hồng ngoại và đỏ
float meastime;                                         // Lưu thời gian đo
int countedsamples = 0;
int startstop = 0, raworbp = 0;
char outStr[256]; // Chuỗi lưu dữ liệu thô (giới hạn bộ nhớ sử dụng)
bool max30102_is_active(void)
{
    return max30102_active; // Trả về trạng thái của MAX30102
}
void max30102_init()
{
    ESP_LOGI(TAG, "Initializing MAX30102...");

    uint8_t data;
    // esp_err_t err;

    //     // Kiểm tra xem MAX30102 có phản hồi trên I2C không
    //     err = i2c_read_byte( I2C_ADDR_MAX30102, 0x00, &data);
    //     if (err == ESP_OK) {
    //         ESP_LOGI(LOG_TAG, "MAX30102 connected successfully.");
    //     } else {
    //         ESP_LOGE(LOG_TAG, "Failed to connect to MAX30102. I2C error: %s", esp_err_to_name(err));
    //         return;  // Dừng nếu không kết nối được
    //     }
    // Cấu hình sample averaging
    data = (0x2 << 5); // Set sample averaging 0=1,1=2,2=4,3=8,4=16,5+=32
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x08, data);

    // Cấu hình chế độ hoạt động
    data = 0x03; // Set mode to red and IR samples
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x09, data);

    // Cấu hình dải ADC, tần số mẫu và chiều rộng xung
    data = (0x3 << 5) + (0x3 << 2) + 0x3;
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x0A, data);
    data = 0xD0;
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x0C, data);

    // Cấu hình công suất xung đỏ
    data = 0xA0;
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x0D, data);
}

void max30102_task(void *pvParameters)
{

    int cnt, samp, tcnt = 0;
    uint8_t rptr, wptr;
    uint8_t data;
    uint8_t regdata[256];                                                   // Dữ liệu đọc từ FIFO
    float firxv[5] = {0}, firyv[5] = {0}, fredxv[5] = {0}, fredyv[5] = {0}; // Biến lưu giá trị lọc FIR cho Red và IR
    float lastmeastime = 0;
    float hrarray[5] = {0}, spo2array[5] = {0}; // Lưu các giá trị đo HR và SpO2
    int hrarraycnt = 0;

    while (1)
    {
        // if (!max30102_active)
        // {
        //     ESP_LOGI(TAG, "MAX30102 is in sleep mode. Task will wait.");
        //     vTaskDelay(pdMS_TO_TICKS(500)); // Chờ trong trạng thái sleep
        //     continue;
        // }
        // Kiểm tra và cập nhật công suất LED IR và Red nếu cần
        if (lirpower != irpower)
        {
            data = (uint8_t)irpower;
            if (i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x0C, data) != ESP_OK)
            {
                vTaskDelay(pdMS_TO_TICKS(100)); // Thêm thời gian trễ để thử lại
                continue;
            }
            lirpower = irpower;
        }

        if (lrpower != rpower)
        {
            data = (uint8_t)rpower;
            if (i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x0C, data) != ESP_OK)
            {
                vTaskDelay(pdMS_TO_TICKS(100)); // Thêm thời gian trễ để thử lại
                continue;
            }
            lrpower = rpower;
        }

        // Đọc con trỏ FIFO để lấy dữ liệu
        if (i2c_read_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x04, &wptr) != ESP_OK ||
            i2c_read_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x06, &rptr) != ESP_OK)
        {
            vTaskDelay(pdMS_TO_TICKS(100)); // Thêm thời gian trễ để thử lại
            continue;
        }

        samp = ((32 + wptr) - rptr) % 32; // Số lượng mẫu mới trong FIFO
        if (i2c_read_bytes(I2C_NUM_0, I2C_ADDR_MAX30102, 0x07, regdata, 6 * samp) != ESP_OK)
        {
            vTaskDelay(pdMS_TO_TICKS(100)); // Thêm thời gian trễ để thử lại
            continue;
        }

        for (cnt = 0; cnt < samp; cnt++)
        {
            meastime = 0.01 * tcnt++; // Cập nhật thời gian đo

            // Lọc FIR cho IR
            memmove(&firxv[0], &firxv[1], 4 * sizeof(float)); // Shift giá trị lọc FIR
            firxv[4] = (1 / 3.48311f) * (256 * 256 * (regdata[6 * cnt + 3] % 4) + 256 * regdata[6 * cnt + 4] + regdata[6 * cnt + 5]);
            memmove(&firyv[0], &firyv[1], 4 * sizeof(float)); // Shift giá trị lọc FIR
            firyv[4] = (firxv[0] + firxv[4]) - 2 * firxv[2] + (-0.1718123813f * firyv[0]) + (0.3686645260f * firyv[1]) + (-1.1718123813f * firyv[2]) + (1.9738037992f * firyv[3]);

            // Lọc FIR cho Red
            memmove(&fredxv[0], &fredxv[1], 4 * sizeof(float)); // Shift giá trị lọc Red
            fredxv[4] = (1 / 3.48311f) * (256 * 256 * (regdata[6 * cnt + 0] % 4) + 256 * regdata[6 * cnt + 1] + regdata[6 * cnt + 2]);
            memmove(&fredyv[0], &fredyv[1], 4 * sizeof(float)); // Shift giá trị lọc Red
            fredyv[4] = (fredxv[0] + fredxv[4]) - 2 * fredxv[2] + (-0.1718123813f * fredyv[0]) + (0.3686645260f * fredyv[1]) + (-1.1718123813f * fredyv[2]) + (1.9738037992f * fredyv[3]);

            // Tính toán nhịp tim (HR) và SpO2 từ các đỉnh phát hiện được
            if (-1.0f * firyv[4] >= 100 && -1.0f * firyv[2] > -1.0f * firyv[0] && -1.0f * firyv[2] > -1.0f * firyv[4] && meastime - lastmeastime > 0.5f)
            {
                hrarray[hrarraycnt % 5] = 60 / (meastime - lastmeastime);                                 // Tính nhịp tim (HR)
                spo2array[hrarraycnt % 5] = 110 - 25 * ((fredyv[4] / fredxv[4]) / (firyv[4] / firxv[4])); // Tính SpO2

                // Giới hạn SpO2 tối đa là 100
                if (spo2array[hrarraycnt % 5] > 100)
                    spo2array[hrarraycnt % 5] = 99.9f;

                // Cập nhật thời gian đo cuối cùng
                lastmeastime = meastime;
                hrarraycnt++;

                // Tính trung bình của 5 giá trị gần nhất của HR và SpO
                // Tính trung bình của 5 giá trị gần nhất của HR và SpO2
                heartrate = (hrarray[0] + hrarray[1] + hrarray[2] + hrarray[3] + hrarray[4]) / 5; // Lưu nhịp tim vào biến `heartrate`
                if (heartrate < 40 || heartrate > 150)
                    heartrate = 0;

                pctspo2 = (spo2array[0] + spo2array[1] + spo2array[2] + spo2array[3] + spo2array[4]) / 5; // Lưu SpO2 vào biến `pctspo2`
                if (pctspo2 < 50 || pctspo2 > 101)
                    pctspo2 = 0;
            }
            // ESP_LOGI(LOG_TAG, "HeartRate: %.2f, SpO2: %.2f", heartrate, pctspo2);

            // Lưu các giá trị thô hoặc giá trị sau khi lọc (tùy thuộc vào chế độ)
            if (countedsamples < 100)
            {
                if (raworbp == 0)
                {
                    snprintf(outStr, sizeof(outStr), "%5.1f,%5.1f,", -1.0f * fredyv[4], -1.0f * firyv[4]); // Lưu giá trị sau lọc FIR vào chuỗi
                }
                else
                {
                    snprintf(outStr, sizeof(outStr), "%5.1f,%5.1f,", fredxv[4], firxv[4]); // Lưu giá trị thô vào chuỗi
                }
                // Dừng ghi dữ liệu vào `outStr` sau khi đã ghi đủ số mẫu
                countedsamples++;
            }
        }

        vTaskDelay(pdMS_TO_TICKS(20)); // Thêm độ trễ giữa các lần đọc
    }
}
TaskHandle_t max30102_task_handle = NULL; // Biến toàn cục lưu Task Handle

void max30102_sleep(void)
{
    uint8_t reg_value = 0x01; // SHDN (Shutdown) = 1 để đưa MAX30102 vào chế độ ngủ
    esp_err_t ret = i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x09, reg_value);

    if (ret == ESP_OK)
    {
        ESP_LOGI(LOG_TAG, "MAX30102 is now in sleep mode");
        max30102_active = false;

        if (max30102_task_created && max30102_task_handle != NULL)
        {
            vTaskDelete(max30102_task_handle);
            max30102_task_handle = NULL;
            max30102_task_created = false;
            ESP_LOGI(TAG, "MAX30102 Task Deleted");
        }
    }
    else
    {
        ESP_LOGE(LOG_TAG, "Failed to put MAX30102 in sleep mode. Error: %s", esp_err_to_name(ret));
    }
}



void max30102_wake(void)
{
    uint8_t reg_value;
    // Đặt cảm biến vào chế độ hoạt động
    i2c_write_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x09, 0x03);
    i2c_read_byte(I2C_NUM_0, I2C_ADDR_MAX30102, 0x09, &reg_value);

    ESP_LOGI(TAG, "MODE_CONFIG register value: 0x%02X", reg_value);

    max30102_init();

    if (!max30102_task_created)
    {
        xTaskCreate(max30102_task, "max30102_task", 4096, NULL, 5, &max30102_task_handle);
        max30102_task_created = true;
        ESP_LOGI(TAG, "MAX30102 Task Created");
    }

    max30102_active = true; // Cập nhật trạng thái
    ESP_LOGI(TAG, "MAX30102 is now active");
}

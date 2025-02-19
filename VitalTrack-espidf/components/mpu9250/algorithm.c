#include "algorithm.h"
#include "ahrs.h"
#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "mpu9250.h"
#include "calibrate.h"
#include "common.h"
#include <math.h>

static const char *TAG = "algorithm";
static void (*fall_warning_callback)(void) = NULL;

extern calibration_t cal; // Sử dụng biến cal từ file khác

imu_data_t imu_data;

void transform_accel_gyro(vector_t *v)
{
    float x = v->x;
    float y = v->y;
    float z = v->z;

    v->x = -x;
    v->y = -z;
    v->z = -y;
}

calibration_t cal = {
    .mag_offset = {.x = 25.183594, .y = 57.519531, .z = -62.648438},
    .mag_scale = {.x = 1.513449, .y = 1.557811, .z = 1.434039},
    .accel_offset = {.x = 0.020900, .y = 0.014688, .z = -0.002580},
    .accel_scale_lo = {.x = -0.992052, .y = -0.990010, .z = -1.011147},
    .accel_scale_hi = {.x = 1.013558, .y = 1.011903, .z = 1.019645},
    .gyro_bias_offset = {.x = 0.303956, .y = -1.049768, .z = -0.403782}};

void run_imu(void)
{
    i2c_mpu9250_init(&cal);
    ahrs_init(SAMPLE_FREQ_Hz, 0.8);

    uint64_t i = 0;

    while (true)
    {
        vector_t va, vg;

        esp_err_t ret = get_accel_gyro(&va, &vg);
        if (ret != ESP_OK)
        {
            vTaskDelay(pdMS_TO_TICKS(2000));
            continue;
        }

        transform_accel_gyro(&va);
        transform_accel_gyro(&vg);

        ahrs_update(DEG2RAD(vg.x), DEG2RAD(vg.y), DEG2RAD(vg.z), va.x, va.y, va.z, 0, 0, 0);

        if (i++ % 2 == 0)
        {
            float heading, pitch, roll;
            ahrs_get_euler_in_degrees(&heading, &pitch, &roll);

            imu_data.heading = heading;
            imu_data.pitch = pitch;
            imu_data.roll = roll;

            float resultant_acceleration = calculate_resultant_acceleration(va);
            imu_data.resultant_acceleration = resultant_acceleration;

            float tilt_angle = calculate_tilt_angle(va);
            imu_data.tilt_angle = tilt_angle;

            bool fall_detected = check_fall_detection(resultant_acceleration, tilt_angle);
            imu_data.fall_detected = fall_detected;

            if (fall_detected)
            {
                ESP_LOGW(TAG, "ALERT: Fall detected! Heading: %f, Pitch: %f, Roll: %f", imu_data.heading, imu_data.pitch, imu_data.roll);
            }
        }

        vTaskDelay(pdMS_TO_TICKS(100)); // Delay 100ms cho mỗi lần đọc dữ liệu từ cảm biến
    }
}

float calculate_resultant_acceleration(vector_t accel)
{
    return sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
}

float calculate_tilt_angle(vector_t accel)
{
    float pitch = atan2(accel.y, sqrt(accel.x * accel.x + accel.z * accel.z)) * (180.0 / M_PI);
    float roll = atan2(-accel.x, accel.z) * (180.0 / M_PI);
    return sqrt(pitch * pitch + roll * roll); // Trả về góc tổng hợp của pitch và roll
}
void register_fall_warning_callback(void (*callback)(void))
{
    fall_warning_callback = callback;
}

bool check_fall_detection(float resultant_acceleration, float tilt_angle)
{
    static bool below_threshold = false; // Kiểm tra gia tốc giảm xuống dưới 0.3g
    static TickType_t last_time = 0;     // Để ghi lại thời điểm

    TickType_t now = xTaskGetTickCount(); // Lấy thời gian hiện tại

    if (resultant_acceleration < 0.82)
    {
        below_threshold = true;
        last_time = now; // Ghi lại thời gian
    }

    if (below_threshold && resultant_acceleration > 0.8 && (now - last_time < pdMS_TO_TICKS(1000)))
    {

        below_threshold = false;

        if (tilt_angle > 30.0)
        {

            if (fall_warning_callback != NULL)
            {
                fall_warning_callback();
            }
            return true; // Phát hiện ngã
        }
    }

    return false;
}
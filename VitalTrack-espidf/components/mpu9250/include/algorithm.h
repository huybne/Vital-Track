#ifndef ALGORITHM_H
#define ALGORITHM_H

#include "mpu9250.h"

// Khai báo cấu trúc dữ liệu để lưu trữ kết quả IMU
typedef struct {
    float heading;
    float pitch;
    float roll;
    float resultant_acceleration;
    float tilt_angle;
    bool fall_detected;
} imu_data_t;


// Biến toàn cục để lưu dữ liệu IMU
extern imu_data_t imu_data;

// Hàm chuyển đổi giá trị từ cảm biến gia tốc và con quay hồi chuyển
void transform_accel_gyro(vector_t *v);

// Hàm chạy IMU (được chạy trong task hoặc vòng lặp)
void run_imu(void);

// Hàm tính toán gia tốc tổng hợp
float calculate_resultant_acceleration(vector_t accel);

// Hàm tính toán góc nghiêng
float calculate_tilt_angle(vector_t accel);

// Hàm kiểm tra phát hiện ngã
bool check_fall_detection(float resultant_acceleration, float tilt_angle);
void register_fall_warning_callback(void (*callback)(void));

#endif // ALGORITHM_H

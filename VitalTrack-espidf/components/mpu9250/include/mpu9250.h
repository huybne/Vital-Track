

#ifndef __MPU9250_H
#define __MPU9250_H

#include "freertos/FreeRTOS.h"
#include "i2c-easy.h"

// Thanh ghi INT_ENABLE (Interrupt Enable Register)
#define MPU9250_RA_INT_ENABLE 0x38
#define MPU9250_INT_EN_MOTION_BIT 6

// Thanh ghi MOT_THR (Motion Threshold Register)
#define MPU9250_RA_MOT_THR 0x1F

// Thanh ghi MOT_DUR (Motion Duration Register)
#define MPU9250_RA_MOT_DUR 0x20

// Thanh ghi INT_PIN_CFG (Interrupt Pin Configuration Register)
#define MPU9250_INT_CFG_INT_ANYRD_2CLEAR 0x10


#define MPU9250_I2C_ADDRESS_AD0_LOW (0x68)
#define MPU9250_I2C_ADDR MPU9250_I2C_ADDRESS_AD0_LOW
#define MPU9250_I2C_ADDRESS_AD0_HIGH (0x69)
#define MPU9250_WHO_AM_I (0x75)

#define MPU9250_RA_CONFIG (0x1A)
#define MPU9250_RA_GYRO_CONFIG (0x1B)
#define MPU9250_RA_ACCEL_CONFIG_1 (0x1C)
#define MPU9250_RA_ACCEL_CONFIG_2 (0x1D)

#define MPU9250_RA_INT_PIN_CFG (0x37)

#define MPU9250_INTCFG_ACTL_BIT (7)
#define MPU9250_INTCFG_OPEN_BIT (6)
#define MPU9250_INTCFG_LATCH_INT_EN_BIT (5)
#define MPU9250_INTCFG_INT_ANYRD_2CLEAR_BIT (4)
#define MPU9250_INTCFG_ACTL_FSYNC_BIT (3)
#define MPU9250_INTCFG_FSYNC_INT_MODE_EN_BIT (2)
#define MPU9250_INTCFG_BYPASS_EN_BIT (1)
#define MPU9250_INTCFG_NONE_BIT (0)

#define MPU9250_ACCEL_XOUT_H (0x3B)
#define MPU9250_ACCEL_XOUT_L (0x3C)
#define MPU9250_ACCEL_YOUT_H (0x3D)
#define MPU9250_ACCEL_YOUT_L (0x3E)
#define MPU9250_ACCEL_ZOUT_H (0x3F)
#define MPU9250_ACCEL_ZOUT_L (0x40)
#define MPU9250_TEMP_OUT_H (0x41)
#define MPU9250_TEMP_OUT_L (0x42)
#define MPU9250_GYRO_XOUT_H (0x43)
#define MPU9250_GYRO_XOUT_L (0x44)
#define MPU9250_GYRO_YOUT_H (0x45)
#define MPU9250_GYRO_YOUT_L (0x46)
#define MPU9250_GYRO_ZOUT_H (0x47)
#define MPU9250_GYRO_ZOUT_L (0x48)

#define MPU9250_RA_USER_CTRL (0x6A)
#define MPU9250_RA_PWR_MGMT_1 (0x6B)
#define MPU9250_RA_PWR_MGMT_2 (0x6C)
#define MPU9250_PWR1_DEVICE_RESET_BIT (7)
#define MPU9250_PWR1_SLEEP_BIT (6)
#define MPU9250_PWR1_CYCLE_BIT (5)
#define MPU9250_PWR1_TEMP_DIS_BIT (3)
#define MPU9250_PWR1_CLKSEL_BIT (0)
#define MPU9250_PWR1_CLKSEL_LENGTH (3)

#define MPU9250_GCONFIG_FS_SEL_BIT (3)
#define MPU9250_GCONFIG_FS_SEL_LENGTH (2)
#define MPU9250_GYRO_FS_250 (0x00)
#define MPU9250_GYRO_FS_500 (0x01)
#define MPU9250_GYRO_FS_1000 (0x02)
#define MPU9250_GYRO_FS_2000 (0x03)
#define MPU9250_GYRO_SCALE_FACTOR_0 (131)
#define MPU9250_GYRO_SCALE_FACTOR_1 (65.5)
#define MPU9250_GYRO_SCALE_FACTOR_2 (32.8)
#define MPU9250_GYRO_SCALE_FACTOR_3 (16.4)

#define MPU9250_ACONFIG_FS_SEL_BIT (3)
#define MPU9250_ACONFIG_FS_SEL_LENGTH (2)
#define MPU9250_ACCEL_FS_2 (0x00)
#define MPU9250_ACCEL_FS_4 (0x01)
#define MPU9250_ACCEL_FS_8 (0x02)
#define MPU9250_ACCEL_FS_16 (0x03)
#define MPU9250_ACCEL_SCALE_FACTOR_0 (16384)
#define MPU9250_ACCEL_SCALE_FACTOR_1 (8192)
#define MPU9250_ACCEL_SCALE_FACTOR_2 (4096)
#define MPU9250_ACCEL_SCALE_FACTOR_3 (2048)

#define MPU9250_CLOCK_INTERNAL (0x00)
#define MPU9250_CLOCK_PLL_XGYRO (0x01)
#define MPU9250_CLOCK_PLL_YGYRO (0x02)
#define MPU9250_CLOCK_PLL_ZGYRO (0x03)
#define MPU9250_CLOCK_KEEP_RESET (0x07)
#define MPU9250_CLOCK_PLL_EXT32K (0x04)
#define MPU9250_CLOCK_PLL_EXT19M (0x05)

#define MPU9250_I2C_SLV0_DO (0x63)
#define MPU9250_I2C_SLV1_DO (0x64)
#define MPU9250_I2C_SLV2_DO (0x65)

#define MPU9250_USERCTRL_DMP_EN_BIT (7)
#define MPU9250_USERCTRL_FIFO_EN_BIT (6)
#define MPU9250_USERCTRL_I2C_MST_EN_BIT (5)
#define MPU9250_USERCTRL_I2C_IF_DIS_BIT (4)
#define MPU9250_USERCTRL_DMP_RESET_BIT (3)
#define MPU9250_USERCTRL_FIFO_RESET_BIT (2)
#define MPU9250_USERCTRL_I2C_MST_RESET_BIT (1)
#define MPU9250_USERCTRL_SIG_COND_RESET_BIT (0)

#define BYTE_2_INT_BE(byte, i) ((int16_t)((byte[i] << 8) + (byte[i + 1])))
#define BYTE_2_INT_LE(byte, i) ((int16_t)((byte[i + 1] << 8) + (byte[i])))

typedef struct
{
  float x, y, z;
} vector_t;


typedef struct
{
  // Magnetometer
  vector_t mag_offset;
  vector_t mag_scale;

  // Gryoscope
  vector_t gyro_bias_offset;

  // Accelerometer
  vector_t accel_offset;
  vector_t accel_scale_lo;
  vector_t accel_scale_hi;

} calibration_t;
typedef struct {
    float accel_range;
    float accel_scalar;
    vector_t accel_offset;
    vector_t accel_scale_lo;
    vector_t accel_scale_hi;

    float gyro_range;
    float gyro_scalar;
    vector_t gyro_bias_offset;
} mpu9250_data_t;
extern mpu9250_data_t mpu_data;

esp_err_t i2c_mpu9250_init(calibration_t *cal);
esp_err_t set_clock_source(uint8_t adrs);
esp_err_t set_full_scale_gyro_range(uint8_t adrs);
esp_err_t set_full_scale_accel_range(uint8_t adrs);
esp_err_t set_sleep_enabled(bool state);
esp_err_t get_device_id(uint8_t *val);
esp_err_t get_temperature_raw(uint16_t *val);
esp_err_t get_temperature_celsius(float *val);

esp_err_t get_bypass_enabled(bool *state);
esp_err_t set_bypass_enabled(bool state);
esp_err_t get_i2c_master_mode(bool *state);
esp_err_t set_i2c_master_mode(bool state);

esp_err_t get_accel(vector_t *v);
esp_err_t get_gyro(vector_t *v);
esp_err_t get_mag(vector_t *v);
esp_err_t get_accel_gyro(vector_t *va, vector_t *vg);
esp_err_t get_accel_gyro_mag(vector_t *va, vector_t *vg, vector_t *vm);
esp_err_t get_mag_raw(uint8_t bytes[6]);

void save_settings(void);
void save_gyro_settings(void);
void configure_mpu9250_interrupts();
#endif // __MPU9250_H

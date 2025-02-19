
#ifndef AHRS_H
#define AHRS_H


void ahrs_init(float sampleFreqDef, float betaDef);
void ahrs_update(float gx, float gy, float gz, float ax, float ay, float az, float mx, float my, float mz);
void ahrs_update_imu(float gx, float gy, float gz, float ax, float ay, float az);
void ahrs_get_euler_in_degrees(float *heading, float *pitch, float *roll);

#endif 
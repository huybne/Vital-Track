#ifndef MAX30102_H
#define MAX30102_H

#include <stdint.h>
#include <stdbool.h>

// Định nghĩa địa chỉ I2C của MAX30102
#define I2C_ADDR_MAX30102 0x57
void max30102_sleep(void);
void max30102_wake(void);

// Khai báo các biến toàn cục (sử dụng extern để tránh lỗi multiple definition)
extern float heartrate, pctspo2;   
extern int irpower, rpower, lirpower, lrpower;
extern float meastime;
extern int countedsamples, startstop, raworbp;
extern char outStr[256];

// Khai báo các hàm điều khiển MAX30102
void max30102_init(void); 
 void max30102_task(void *pvParameters);
bool max30102_is_active(void);

#endif // MAX30102_H

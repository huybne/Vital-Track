#ifndef SMARTCONFIG_COMPONENT_H
#define SMARTCONFIG_COMPONENT_H

#include "freertos/FreeRTOS.h"
#include "freertos/event_groups.h"

// Event bits để theo dõi trạng thái kết nối
#define CONNECTED_BIT BIT0
#define ESPTOUCH_DONE_BIT BIT1

// Hàm khởi tạo Smart Config
void smartconfig_init(void);

#endif // SMARTCONFIG_COMPONENT_H

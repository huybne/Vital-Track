// sim_module.h
#ifndef SIM_MODULE_H
#define SIM_MODULE_H

#include "esp_netif.h"
#include "esp_modem.h"
#include "esp_event.h"

void sim_initialize(void);
void sim_connect(void);
void sim_deactivate(void);
void sim_enter_sleep_mode(void); // Hàm tắt nguồn
void sim_wake_from_sleep_mode(void);
//bool sim_is_ready(void);
#endif // SIM_MODULE_H
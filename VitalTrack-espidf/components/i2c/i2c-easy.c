

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#include "freertos/FreeRTOS.h"
#include "freertos/task.h"
#include "freertos/queue.h"

#include "esp_log.h"
#include "esp_system.h"
#include "esp_err.h"

#include "i2c-easy.h"

#define WRITE_BIT I2C_MASTER_WRITE /*!< I2C master write */
#define READ_BIT I2C_MASTER_READ   /*!< I2C master read */
#define ACK_CHECK_EN 0x1           /*!< I2C master will check ack from slave*/
#define ACK_CHECK_DIS 0x0          /*!< I2C master will not check ack from slave */
#define ACK_VAL 0x0                /*!< I2C ack value */
#define NACK_VAL 0x1               /*!< I2C nack value */
#define LAST_NACK_VAL 0x2          /*!< I2C last_nack value */

#define I2C_FREQ_HZ 100000 /* I2C master clock frequency */
#define I2C_TX_BUF_DISABLE 0 /* I2C master do not need buffer */
#define I2C_RX_BUF_DISABLE 0
#define TAG "i2c-easy"

/**
 * @brief i2c master initialization
 */
esp_err_t i2c_master_init(uint8_t i2c_num, uint8_t gpio_sda, uint8_t gpio_scl) {
    int i2c_master_port = i2c_num;
    i2c_config_t conf;
    memset(&conf, 0, sizeof(i2c_config_t));
    conf.mode = I2C_MODE_MASTER;
    conf.sda_io_num = gpio_sda;
    conf.sda_pullup_en = GPIO_PULLUP_ENABLE;  // Bật pull-up
    conf.scl_io_num = gpio_scl;
    conf.scl_pullup_en = GPIO_PULLUP_ENABLE;  // Bật pull-up
    conf.master.clk_speed = I2C_FREQ_HZ;
    
    esp_err_t ret = i2c_param_config(i2c_master_port, &conf);
    if (ret != ESP_OK) {
        ESP_LOGE("I2C", "I2C param config failed: %s", esp_err_to_name(ret));
        return ret;
    }
    
    ret = i2c_driver_install(i2c_master_port, conf.mode, I2C_RX_BUF_DISABLE, I2C_TX_BUF_DISABLE, 0);
    if (ret != ESP_OK) {
        ESP_LOGE("I2C", "I2C driver install failed: %s", esp_err_to_name(ret));
        return ret;
    }

    return ESP_OK;
}
esp_err_t i2c_write_bytes(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t *data, size_t data_len)
{
  int ret;
  i2c_cmd_handle_t cmd = i2c_cmd_link_create();
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, periph_address << 1 | WRITE_BIT, ACK_CHECK_EN);
  i2c_master_write_byte(cmd, reg_address, ACK_CHECK_EN);
  i2c_master_write(cmd, data, data_len, ACK_CHECK_EN);
  i2c_master_stop(cmd);
  ret = i2c_master_cmd_begin(i2c_num, cmd, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(cmd);

  return ret;
}
esp_err_t i2c_easy_set_pin(uint8_t i2c_num, uint8_t gpio_sda, uint8_t gpio_scl)
{
    ESP_LOGI(TAG, "Setting new I2C pins: SDA=%d, SCL=%d", gpio_sda, gpio_scl);

    // Gỡ driver I2C hiện tại
    esp_err_t ret = i2c_driver_delete(i2c_num);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to delete I2C driver: %s", esp_err_to_name(ret));
        return ret;
    }

    // Cấu hình lại I2C với chân mới
    ret = i2c_master_init(i2c_num, gpio_sda, gpio_scl);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to set new I2C pins: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "I2C pins set successfully: SDA=%d, SCL=%d", gpio_sda, gpio_scl);
    return ESP_OK;
}


esp_err_t i2c_write_byte(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t data)
{
  return i2c_write_bytes(i2c_num, periph_address, reg_address, &data, 1);
}

esp_err_t i2c_read_bytes(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t *data, size_t data_len)
{
  int ret;
  i2c_cmd_handle_t cmd = i2c_cmd_link_create();
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, periph_address << 1 | WRITE_BIT, ACK_CHECK_EN);
  i2c_master_write_byte(cmd, reg_address, ACK_CHECK_EN);
  i2c_master_stop(cmd);
  ret = i2c_master_cmd_begin(i2c_num, cmd, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(cmd);

  if (ret != ESP_OK)
  {
    return ret;
  }

  cmd = i2c_cmd_link_create();
  i2c_master_start(cmd);
  i2c_master_write_byte(cmd, periph_address << 1 | READ_BIT, ACK_CHECK_EN);
  i2c_master_read(cmd, data, data_len, LAST_NACK_VAL);
  i2c_master_stop(cmd);
  ret = i2c_master_cmd_begin(i2c_num, cmd, 1000 / portTICK_PERIOD_MS);
  i2c_cmd_link_delete(cmd);

  return ret;
}

esp_err_t i2c_read_byte(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t *data)
{
  return i2c_read_bytes(i2c_num, periph_address, reg_address, data, 1);
}

uint8_t get_bit_mask(uint8_t bit, uint8_t length)
{
  return ((1 << length) - 1) << bit;
};

esp_err_t i2c_write_bits(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t bit, uint8_t length, uint8_t value)
{
  uint8_t data[1];

  int ret = i2c_read_bytes(i2c_num, periph_address, reg_address, data, 1);
  if (ret != ESP_OK)
  {
     ESP_LOGE(TAG, "I2C read failed at address 0x%02X, reg 0x%02X: %s",
             periph_address, reg_address, esp_err_to_name(ret));
    return ret;
  }

  uint8_t mask = get_bit_mask(bit, length);
  data[0] = data[0] ^ ((data[0] ^ (value << bit)) & mask);
  return i2c_write_bytes(i2c_num, periph_address, reg_address, data, 1);
}

esp_err_t i2c_write_bit(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t bit, uint8_t value)
{
  return i2c_write_bits(i2c_num, periph_address, reg_address, bit, 1, value);
}

esp_err_t i2c_read_bit(i2c_port_t i2c_num, uint8_t periph_address, uint8_t reg_address, uint8_t bit, uint8_t *result)
{
  uint8_t data[1];

  int ret = i2c_read_byte(i2c_num, periph_address, reg_address, data);
  if (ret != ESP_OK)
  {
    return ret;
  }
  *result = (data[0] >> bit) & 1;
  return ret;
};
esp_err_t reset_i2c(uint8_t i2c_num, uint8_t gpio_sda, uint8_t gpio_scl)
{
    ESP_LOGI(TAG, "Resetting I2C bus...");

    // Gỡ driver I2C hiện tại
    esp_err_t ret = i2c_driver_delete(i2c_num);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to delete I2C driver: %s", esp_err_to_name(ret));
        return ret;
    }

    // Cấu hình lại I2C
    ret = i2c_master_init(i2c_num, gpio_sda, gpio_scl);
    if (ret != ESP_OK) {
        ESP_LOGE(TAG, "Failed to reinitialize I2C: %s", esp_err_to_name(ret));
        return ret;
    }

    ESP_LOGI(TAG, "I2C bus reset successfully.");
    return ESP_OK;
}

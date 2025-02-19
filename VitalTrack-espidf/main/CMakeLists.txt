idf_component_register(SRCS "main.c"
    INCLUDE_DIRS "."
    REQUIRES
    mpu9250
    i2c
    max30102
    wifi
    nvs_flash
    gps_ATGM336H
    json
    esp_https_server
    esp_wifi
    esp_http_client
    spi_flash
    ble_service
    esp_http_client
    esp_wifi
    esp_event
    modem
    
    EMBED_TXTFILES
    "certificate.pem"
)

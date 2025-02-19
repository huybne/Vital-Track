# file(GLOB_RECURSE srcs "main.c" "src/*.c")

# idf_component_register(SRCS "${srcs}"
#                        INCLUDE_DIRS "./include"
#                        REQUIRES bt nvs_flash)

idf_component_register(SRCS "ble.c"
                    INCLUDE_DIRS "."
                    REQUIRES  bt driver nvs_flash json max30102  )

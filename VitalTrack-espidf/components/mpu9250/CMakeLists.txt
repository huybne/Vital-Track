idf_component_register(SRCS         "ak8963.c"
                                    "calibrate.c"
                                    "common.c"
                                    "mpu9250.c"
                                    "algorithm.c"
                                    "ahrs.c"
                       INCLUDE_DIRS "include"
                       REQUIRES driver  i2c)
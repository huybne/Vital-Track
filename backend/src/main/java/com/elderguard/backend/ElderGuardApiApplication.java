package com.elderguard.backend;

import lombok.Generated;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.openfeign.FeignAutoConfiguration;

@SpringBootApplication

@EnableFeignClients

public class ElderGuardApiApplication {

	public static void main(String[] args) {
		SpringApplication.run(ElderGuardApiApplication.class, args);
	}

}

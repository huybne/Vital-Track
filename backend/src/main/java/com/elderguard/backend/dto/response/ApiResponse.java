package com.elderguard.backend.dto.response;

import lombok.*;
import org.springframework.http.HttpStatus;

import java.util.Date;
@Builder
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private String message;
    private Date date;
    private HttpStatus status;
    private T data;

    public ApiResponse(String message, Date date, HttpStatus status) {
        this.message = message;
        this.date = date;
        this.status = status;
        this.data = null; // Dữ liệu mặc định là null
    }
}

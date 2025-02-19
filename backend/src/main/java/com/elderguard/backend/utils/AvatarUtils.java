package com.elderguard.backend.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.util.Base64;

public class AvatarUtils {

    private static String encodeFileToBase64(File file) {
        try {
            byte[] fileContent = Files.readAllBytes(file.toPath());
            return Base64.getEncoder().encodeToString(fileContent);
        } catch (IOException e) {
            throw new IllegalStateException("could not read file " + file, e);
        }
    }
    // Hàm decode từ chuỗi Base64 về byte[]
    public static byte[] decodeFromBase64( String base64String) {
        return Base64.getDecoder().decode(base64String);
    }
}
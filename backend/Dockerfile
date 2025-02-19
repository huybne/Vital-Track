# Bước 1: Sử dụng Maven để build project
FROM maven:3.8.4-openjdk-17 AS build

# Sao chép file JAR từ image build trước đó vào image hiện tại
COPY target/backend-0.0.1-SNAPSHOT.jar application.jar
COPY src/main/resources/vitaltrack-92b70-firebase-adminsdk-zdri6-345634489c.json /app/resources
# Chạy ứng dụng
ENTRYPOINT ["java", "-jar", "application.jar"]

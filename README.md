# Health Monitoring and Location Tracking System

## Overview
This project is a Health Monitoring and Location Tracking System designed to monitor users' health metrics and provide real-time location tracking. The system is particularly useful for monitoring elderly individuals and tracking the location of young people or children.

## System Architecture
The system consists of three main components:
1. **Hardware Module**
2. **Backend Server**
3. **Mobile Application**

### 1. Hardware Module
The hardware module is built using the ESP-IDF framework and the following components:
- **Microcontroller**: ESP32-C3 Super Mini
- **Sensors**:
  - MAX30102: Heart rate and SpO2 sensor
  - MAX17043: Battery monitoring module
  - MPU6050: Fall detection sensor
  - ATGM336H: GPS module for location tracking
  - A7680C: 4G SIM module for data transmission

The device operates in two modes:
- **BLE Mode**: When connected to the mobile app via Bluetooth Low Energy (BLE), the device sends health data directly to the app.
- **Disconnected Mode**: When BLE is not available, the device uses the SIM and GPS modules to send data to Firebase every 2 minutes.

### 2. Backend Server
The backend server is implemented using:
- **Programming Language**: Java
- **Framework**: Spring Boot
- **Database**: PostgreSQL

The server manages data received from the device and provides APIs for the mobile app to access the data.

### 3. Mobile Application
The mobile app is developed using **React Native** and provides the following features:
- Real-time display of health metrics (Heart rate, SpO2)
- Location tracking on a map
- Notifications for emergency situations (e.g., fall detection)

### 4. Firebase Integration
The system uses **Firebase Realtime Database** for storing and synchronizing data between the device and the app, enabling quick data access and notifications.

## Installation
### Prerequisites
- ESP-IDF development environment
- Node.js and npm (for React Native)
- Java and Spring Boot setup
- PostgreSQL database

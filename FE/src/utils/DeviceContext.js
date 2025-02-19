// utils/DeviceContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import BleManager from 'react-native-ble-manager';
import { Buffer } from 'buffer';
import { getMyInfo } from '../utils/api';

const DeviceContext = createContext();

export const DeviceProvider = ({ children }) => {
  const [connectedDevice, setConnectedDevice] = useState(null);
  const [deviceData, setDeviceData] = useState({
    HeartRate: null,
    SpO2: null,

  });
  const [userRoles, setUserRoles] = useState([]);
  
  const setRoles = (roles) => {
    setUserRoles(roles || []);
  };

  useEffect(() => {
    BleManager.start({ showAlert: false }).then(() => {
      console.log('BleManager initialized');
    });

    const fetchUserInfo = async () => {
      const data = await getMyInfo();
      if (data) {
        setUserRoles(data.roles || []);
      }
    };
    fetchUserInfo();
  }, []);
  const readBatteryLevel = async (serviceUUID, characteristicUUID) => {
    if (connectedDevice) {
      try {
        const readData = await BleManager.read(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID
        );
  
        const buffer = Buffer.from(readData);
        const batteryLevel = parseInt(buffer.toString('utf-8'), 10); 
  
        console.log('Battery Level:', batteryLevel);
  
        return batteryLevel; 
      } catch (error) {
        console.log('Error reading battery level:', error);
        return null; 
      }
    } else {
      console.log('No connected device');
      return null;
    }
  };
  
  const readData = async (serviceUUID, characteristicUUID) => {
    if (connectedDevice) {
      try {
        const readData = await BleManager.read(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID
        );
        const buffer = Buffer.from(readData);
        const dataString = buffer.toString('utf-8');
        const data = JSON.parse(dataString);
  
        console.log('HeartRate:', data.HeartRate);
        console.log('SpO2:', data.SpO2);

        setDeviceData({
          HeartRate: data.HeartRate,
          SpO2: data.SpO2,

        });
      } catch (error) {
        console.log('Error reading data:', error);
      }
    } else {
      console.log('No connected device');
    }
  };
  

  const sendGetHealthData = async (serviceUUID, characteristicUUID) => {
    if (connectedDevice) {
      try {
        const dataToSend = 'GET_HEALTH_DATA'; 
        const buffer = Buffer.from(dataToSend, 'utf-8');
        
        await BleManager.write(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID,
          Array.from(buffer)
        );
        console.log('GET_HEALTH_DATA command sent');
      } catch (error) {
        console.log('Error sending GET_HEALTH_DATA command:', error);
      }
    } else {
      console.log('No connected device');
    }
  };
  
  const sendOffHealthData = async (serviceUUID, characteristicUUID) => {
    if (connectedDevice) {
      try {
        const dataToSend = 'OFF_HEALTH_DATA'; 
        const buffer = Buffer.from(dataToSend, 'utf-8');
        
        await BleManager.write(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID,
          Array.from(buffer)
        );
        console.log('OFF_HEALTH_DATA command sent');
      } catch (error) {
        console.log('Error sending OFF_HEALTH_DATA command:', error);
      }
    } else {
      console.log('No connected device');
    }
  };

  return (
    <DeviceContext.Provider
      value={{
        connectedDevice,
        setConnectedDevice,
        deviceData,
        setDeviceData,
        readData,
        userRoles,
        setRoles,
        sendGetHealthData,
        sendOffHealthData,
        readBatteryLevel 
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = () => {
  return useContext(DeviceContext);
};

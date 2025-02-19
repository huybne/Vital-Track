import React, {useState, useEffect} from 'react';
import {
  Text,
  View,
  FlatList,
  StatusBar,
  SafeAreaView,
  PermissionsAndroid,
  TouchableOpacity,
  NativeModules,
  NativeEventEmitter,
  Platform,
} from 'react-native';
import {styles} from '../styles/styles';
import BleManager from 'react-native-ble-manager';
import {DeviceList} from '../styles/DevicesList';
import {useDeviceContext} from '../utils/DeviceContext'; // Dùng đúng hook
import {Buffer} from 'buffer';
import {setDeviceId} from '../utils/api';
const BleManagerModule = NativeModules.BleManager;
const BleManagerEmitter = new NativeEventEmitter(BleManagerModule);
import {useRoute} from '@react-navigation/native';

const ConnectDeviceScreen = () => {
  const peripherals = new Map();
  const [isScanning, setIsScanning] = useState(false);
  const [discoveredDevices, setDiscoveredDevices] = useState([]);
  const route = useRoute();
  const {userId} = route.params;
  console.log('userId from route.params:', userId);

  // Lấy các giá trị từ DeviceContext
  const {setDeviceData, connectedDevice, setConnectedDevice} =
    useDeviceContext();
  console.log('setDeviceData:', setDeviceData);
  // Yêu cầu quyền Bluetooth và Location
  const requestBluetoothPermissions = async () => {
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      if (
        granted['android.permission.BLUETOOTH_SCAN'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.BLUETOOTH_CONNECT'] ===
          PermissionsAndroid.RESULTS.GRANTED &&
        granted['android.permission.ACCESS_FINE_LOCATION'] ===
          PermissionsAndroid.RESULTS.GRANTED
      ) {
        console.log('Bluetooth và quyền Location đã được cấp');
      } else {
        console.log('Bluetooth hoặc quyền Location bị từ chối');
      }
    }
  };

  // Lấy các thiết bị đã kết nối
  const handleGetConnectedDevices = () => {
    BleManager.getBondedPeripherals([]).then(results => {
      for (let i = 0; i < results.length; i++) {
        let peripheral = results[i];
        peripheral.connected = true;
        peripherals.set(peripheral.id, peripheral);
        console.log('Peripherals:', Array.from(peripherals.values()));
        setConnectedDevice(peripheral); // Lưu thiết bị kết nối vào context
      }
    });
  };

  // useEffect chạy khi component được mount
  useEffect(() => {
    requestBluetoothPermissions();

    BleManager.enableBluetooth().then(() => {
      console.log('Bluetooth đã được bật');
    });

    BleManager.start({showAlert: false}).then(() => {
      console.log('BleManager đã khởi tạo');
      handleGetConnectedDevices();
    });

    // Lắng nghe quá trình quét và kết nối
    let stopDiscoverListener = BleManagerEmitter.addListener(
      'BleManagerDiscoverPeripheral',
      peripheral => {
        peripherals.set(peripheral.id, peripheral);
        setDiscoveredDevices(Array.from(peripherals.values()));
      },
    );

    let stopConnectListener = BleManagerEmitter.addListener(
      'BleManagerConnectPeripheral',
      peripheral => {
        console.log('BleManagerConnectPeripheral:', peripheral);
        setConnectedDevice(peripheral); // Lưu thiết bị đã kết nối vào context
      },
    );

    let stopScanListener = BleManagerEmitter.addListener(
      'BleManagerStopScan',
      () => {
        setIsScanning(false);
        console.log('Scan đã dừng');
      },
    );

    let updateValueListener = BleManagerEmitter.addListener(
      'BleManagerDidUpdateValueForCharacteristic',
      ({value}) => {
        const buffer = Buffer.from(value);
        const dataString = buffer.toString('utf-8');

        try {
          const data = JSON.parse(dataString);
          console.log('Nhận dữ liệu BLE dạng JSON:', data);

          // Cập nhật dữ liệu vào context
          setDeviceData(prevData => ({
            ...prevData,
            HeartRate: data.HeartRate
              ? parseFloat(data.HeartRate)
              : prevData.HeartRate,
            SpO2: data.SpO2 ? parseFloat(data.SpO2) : prevData.SpO2,
          }));
        } catch (error) {
          console.log('Lỗi phân tích dữ liệu BLE:', error);
        }
      },
    );

    return () => {
      stopDiscoverListener.remove();
      stopConnectListener.remove();
      stopScanListener.remove();
      updateValueListener.remove();
    };
  }, []);

  // Hàm quét thiết bị BLE
  const scan = () => {
    if (!isScanning) {
      BleManager.scan([], 5, true)
        .then(() => {
          console.log('Đang quét...');
          setIsScanning(true);
        })
        .catch(error => {
          console.error(error);
        });
    }
  };

  // Hàm kết nối với thiết bị BLE
  const connect = async peripheral => {
    try {
      // Kết nối với thiết bị BLE
      await BleManager.connect(peripheral.id);
      console.log('Đã kết nối với thiết bị:', peripheral.id);
  
      // Đợi dịch vụ và đặc tính sẵn sàng
      console.log('Đang lấy danh sách dịch vụ và đặc tính...');
      await BleManager.retrieveServices(peripheral.id);
  
      // Chờ một khoảng ngắn để đảm bảo đặc tính sẵn sàng
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('Dịch vụ và đặc tính đã sẵn sàng.');
  
      // Gửi "NETWORK_ON" ngay lập tức
      try {
        const serviceUUID = '0180'; // UUID của dịch vụ
        const characteristicUUID = 'dead'; // UUID của đặc tính DEAD
        const message = Buffer.from('NETWORK_ON', 'utf-8');
        
        console.log('Gửi ngay lệnh "NETWORK_ON":', message);
  
        await BleManager.write(
          peripheral.id,
          serviceUUID,
          characteristicUUID,
          Array.from(message) // Chuyển Buffer thành mảng byte
        );
  
        console.log('Đã gửi "NETWORK_ON" thành công.');
      } catch (error) {
        console.error('Lỗi khi gửi "NETWORK_ON":', error);
      }
  
      // Đọc địa chỉ MAC từ ESP32
      let macAddress = '';
      try {
        const macData = await BleManager.read(
          peripheral.id,
          '0180', // UUID của dịch vụ
          'f00d'  // UUID của đặc tính
        );
  
        macAddress = Buffer.from(macData).toString('utf-8');
        console.log('MAC Address từ ESP32:', macAddress);
      } catch (error) {
        console.error('Lỗi đọc MAC Address:', error);
      }
  
      // Cập nhật trạng thái thiết bị đã kết nối
      setConnectedDevice(peripheral);
  
      // Gọi API để lưu thông tin thiết bị
      const userData = {
        userId, // Lấy userId từ route.params
        deviceId: macAddress || peripheral.id, // Ưu tiên dùng MAC Address nếu có
      };
  
      const result = await setDeviceId(userData);
      if (result) {
        console.log('Device ID đã được lưu:', result);
      } else {
        console.log('Lỗi khi lưu Device ID:', userData);
      }
    } catch (error) {
      console.error('Lỗi kết nối hoặc xử lý:', error);
    }
  };
  

  // Hàm đọc dữ liệu BLE
  // Hàm đọc dữ liệu BLE
  const readData = async (serviceUUID, characteristicUUID) => {
    if (connectedDevice) {
      try {
        const readData = await BleManager.read(
          connectedDevice.id,
          serviceUUID,
          characteristicUUID,
        );
        console.log('Dữ liệu BLE thô:', readData);

        const buffer = Buffer.from(readData);
        const dataString = buffer.toString('utf-8');
        const data = JSON.parse(dataString); // Thêm parse JSON
        console.log('Dữ liệu nhận được:', data);

        // Cập nhật deviceData với dữ liệu từ BLE
        setDeviceData(prevData => ({
          ...prevData,
          HeartRate: data.HeartRate
            ? parseFloat(data.HeartRate)
            : prevData.HeartRate,
          SpO2: data.SpO2 ? parseFloat(data.SpO2) : prevData.SpO2,
        }));
      } catch (error) {
        console.log('Lỗi khi đọc dữ liệu:', error);
      }
    } else {
      console.log('Chưa có thiết bị nào kết nối');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <Text style={styles.title}>PLEASE CONNECT YOUR DEVICE</Text>
      <TouchableOpacity
        onPress={scan}
        activeOpacity={0.5}
        style={styles.scanButton}> 
        <Text style={styles.scanButtonText}>
          {isScanning ? 'Scanning...' : 'Scan Bluetooth Device'}
        </Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>Device found:</Text>
      {discoveredDevices.length > 0 ? (
        <FlatList
          data={discoveredDevices}
          renderItem={({item}) => (
            <DeviceList
              peripheral={item}
              connect={connect}
              disconnect={() => {}}
            />
          )}
          keyExtractor={item => item.id}
        />
      ) : (
        <Text style={styles.noDevicesText}>
         No Bluetooth devices found
        </Text>
      )}

      <Text style={styles.subtitle}>Connected devices:</Text>
      {connectedDevice ? (
        <View>
          <Text>{connectedDevice.name || 'Không có tên'}</Text>
          {/* Nút đọc dữ liệu từ thiết bị đã kết nối */}
          <TouchableOpacity
            onPress={() => readData('0180', 'fef4')}
            style={styles.scanButton}>
            <Text style={styles.scanButtonText}>Read Data</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.noDevicesText}>
          No devices are connected
        </Text>
      )}
    </SafeAreaView>
  );
};

export default ConnectDeviceScreen;

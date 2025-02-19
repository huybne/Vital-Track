import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Linking,
} from 'react-native';
import {Avatar, Title} from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import Fontisto from 'react-native-vector-icons/Fontisto';
import Feather from 'react-native-vector-icons/Feather';
import {useDeviceContext} from '../utils/DeviceContext'; // Import DataContext
import {fonts} from '../assets/color_font/fonts';
import {colors} from '../assets/color_font/colors';
import {getById, getMyInfo} from '../utils/api';
import {useFocusEffect} from '@react-navigation/native'; // Thêm dòng này
import React, {useEffect, useState, useCallback} from 'react'; // Thêm React ở đây
import {ScrollView, RefreshControl} from 'react-native';
import {getCurrentLocation} from '../utils/gps';
import messaging from '@react-native-firebase/messaging';
import database from '@react-native-firebase/database';

const HealthData = () => {
  const [avatarUri, setAvatarUri] = useState(null);
  const [userInfo, setUserInfo] = useState({});
  const {
    deviceData,
    readData,
    connectedDevice,
    sendGetHealthData,
    sendOffHealthData,
  } = useDeviceContext();
  const [closeFriendId, setCloseFriend] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const hasRole = (roles, targetRole) => roles.includes(targetRole);
  const [isDeviceActive, setIsDeviceActive] = useState(false);
  const [startRead, setStartRead] = useState(false);
  const sendDataToFirebase = async (userId, heartRate, spO2, long, lat) => {
    try {
      if (!heartRate || !spO2) {
        console.log('Invalid HeartRate or SpO2:', { heartRate, spO2 });
        return; // Không gửi nếu dữ liệu không hợp lệ
      }
  
      const healthData = {
        heartRate,
        spO2,
        long,
        lat,
      };

      // Gửi dữ liệu lên Firebase tại path healthdata/{userId}
      await database().ref(`healthdata/${userId}`).set(healthData);
      console.log('Health data sent to Firebase successfully');
    } catch (error) {
      console.error('Error sending data to Firebase:', error);
    }
  };
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUserInfo(); // Refresh data
    setRefreshing(false);
  }, []);

  const fetchUserInfo = async () => {
    try {
      const data = await getMyInfo();
      if (data) {
        setUserInfo(data);
        const userRoles = data.roles || [];
        setIsDeviceActive(hasRole(userRoles, 'DEVICE_ACTIVE'));
        const userId = data.id;
        if (data.avatar && data.avatar.startsWith('/9j/')) {
          setAvatarUri(`data:image/png;base64,${data.avatar}`);
        } else {
          setAvatarUri(data.avatar);
        }

        if (data.closeFriendId != null) {
          try {
            const closeFriendData = await getById(data.closeFriendId);
            if (closeFriendData) {
              setCloseFriend(closeFriendData);
              console.log('Close Friend Data:', closeFriendData);
            } else {
              console.log('Close friend not found for ID:', data.closeFriendId);
              setCloseFriend(null);
            }
          } catch (error) {
            console.error('Failed to fetch close friend by ID:', error.message);
            setCloseFriend(null);
          }
        } else {
          setCloseFriend(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user information: ', error.message);
    }
  };

  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Lắng nghe thông báo khi ứng dụng đang chạy hoặc ở background

  useEffect(() => {
    const messageListener = messaging().onMessage(async remoteMessage => {
      const requestType = remoteMessage.data.requestType;

      if (requestType === 'READ') {
        console.log('READ command received');
        sendGetHealthData('0180', 'dead'); // Bật cảm biến
        setStartRead(true); // Bắt đầu đọc
      } else if (requestType === 'STOP_READ') {
        console.log('STOP_READ command received');
        sendOffHealthData('0180', 'dead'); // Tắt cảm biến
        setStartRead(false); // Ngừng đọc
      }
    });

    return () => {
      messageListener();
    };
  }, [connectedDevice]);

  // Theo dõi startRead để đọc dữ liệu
  useEffect(() => {
    let intervalId;

    const readAndSendData = async () => {
      if (connectedDevice && startRead) {
        console.log('Reading data...');
        await readData('0180', 'fef4'); // Đọc dữ liệu từ buffer

        const heartRate = deviceData.HeartRate;
        const spO2 = deviceData.SpO2;

        if (heartRate && spO2) {
          const location = await getCurrentLocation();
          const userId = userInfo.id;
          await sendDataToFirebase(userId, heartRate, spO2, location.longitude, location.latitude);
        }
      }
    };

    if (startRead) {
      intervalId = setInterval(readAndSendData, 2000); // Đọc mỗi 2 giây
    } else {
      clearInterval(intervalId);
    }

    return () => clearInterval(intervalId); // Dọn dẹp khi startRead thay đổi
  }, [startRead, connectedDevice, deviceData]);
  

  // Chỉ đọc dữ liệu khi màn hình HealthData được lấy nét
  useFocusEffect(
    React.useCallback(() => {
      let intervalId;

      // Kiểm tra kết nối và gửi lệnh bắt đầu đọc dữ liệu
      if (connectedDevice) {
        sendGetHealthData('0180', 'dead');
        readData('0180', 'fef4'); // Đọc dữ liệu ngay khi vào màn hình

        // Cài đặt interval để gọi readData mỗi 2 giây
        intervalId = setInterval(() => {
          readData('0180', 'fef4');
        }, 2000);
      }

      return () => {
        if (connectedDevice) {
          sendOffHealthData('0180', 'dead'); // Gửi tín hiệu ngừng đọc khi rời khỏi màn hình
          clearInterval(intervalId);
        }
      };
    }, [connectedDevice]), // Lắng nghe sự thay đổi của connectedDevice
  );
  if (!isDeviceActive) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.accessDeniedText}>
          You do not have permission to access these features.
        </Text>
        <Text style={styles.suggestionText}>
          To access this feature, please use a compatible device.{' '}
        </Text>
      </View>
    );
  }

  // Hiển thị dữ liệu BLE trên màn hình
  return (
    <ScrollView
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.container}>
        <View style={styles.userInfoSection}>
          <View style={styles.ava}>
            <View style={styles.avatarContainer}>
              {avatarUri ? (
                <Avatar.Image source={{uri: avatarUri}} size={80} />
              ) : (
                <Avatar.Icon size={80} icon="account" />
              )}
            </View>

            <View>
              <Title style={styles.label}>Hi, {userInfo.username}!</Title>
            </View>
          </View>
        </View>

        <Text style={styles.title}>Health Data</Text>

        <View style={styles.deviceWrapper}>
          <View style={styles.deviceInfo}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons name={'watch-variant'} size={50} />
            </View>
            <Text style={styles.labelInfo}>Your Device: </Text>
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  {backgroundColor: connectedDevice ? 'green' : 'red'},
                ]}
              />
              <Text style={styles.textInfo}>
                {connectedDevice ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>
          <View>
            <Image
              source={require('../assets/picture/watch.jpg')}
              style={styles.bannerImage}
            />
          </View>
        </View>

        {/* Hiển thị dữ liệu BLE */}
        <View style={styles.dataWrapper}>
          <View style={styles.infoCard}>
            <Fontisto name={'heartbeat-alt'} size={50} />
            <Text style={styles.dataText}>Heart Rate:</Text>
            <Text style={styles.infoText}>
              {deviceData.HeartRate
                ? `${deviceData.HeartRate} bpm`
                : 'Đang chờ...'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Image
              source={require('../assets/picture/blood-oxygen-3.png')}
              style={styles.iconImage}
            />
            <Text style={styles.dataText}>SpO2:</Text>
            <Text style={styles.infoText}>
              {deviceData.SpO2 ? `${deviceData.SpO2}%` : 'Đang chờ...'}
            </Text>
          </View>
        </View>

        <View style={styles.callRelative}>
          <Text style={styles.dataText}>
            {closeFriendId?.fullName || 'Your Relative'}
          </Text>
          <TouchableOpacity
            style={styles.iconCall}
            onPress={() => {
              if (closeFriendId?.telephone) {
                Linking.openURL(`tel:${closeFriendId.telephone}`); // Gọi số điện thoại
              } else {
                alert('No phone number available for this contact.');
              }
            }}>
            <Feather name={'phone'} size={25} />
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

export default HealthData;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 300,
    backgroundColor: colors.white,
  },
  iconImage: {
    height: 50,
    width: 42,
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.Bold,
    color: '#000000',
    fontSize: 45, // Thay đổi kích thước nếu cần
    marginBottom: 10, // Thêm khoảng cách dưới tiêu đề
  },
  userInfoSection: {
    marginTop: 20,
  },
  ava: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  label: {
    fontSize: 25,
    fontFamily: fonts.Regular,
    color: colors.primary,
    marginLeft: 10,
  },
  textInfo: {
    fontSize: 18,
    marginVertical: 5,
  },
  iconWrapper: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelInfo: {
    fontSize: 25,
    fontFamily: fonts.SemiBold,
    color: colors.primary,
    marginTop: 10,
  },
  deviceWrapper: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 40,
    backgroundColor: '#87ceeb',
  },
  deviceInfo: {
    marginLeft: 20,
    marginRight: 10,
  },
  bannerImage: {
    height: 200,
    width: 180,
    borderRadius: 20,
    marginVertical: 20,
  },
  statusIndicator: {
    width: 15,
    height: 15,
    borderRadius: 7.5, // Chuyển thành hình tròn
    marginRight: 5, // Thêm khoảng cách giữa nút và văn bản
    alignSelf: 'center', // Đặt ở giữa hàng
  },
  statusContainer: {
    flexDirection: 'row', // Sắp xếp theo hàng
    alignItems: 'center', // Căn giữa theo chiều dọc
  },
  dataWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  infoCard: {
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 30,
    padding: 20,
  },
  dataText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 16,
    color: '#333',
  },
  callRelative: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.6)',
    borderRadius: 30,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
  iconCall: {
    width: 50,
    height: 50,
    borderRadius: 30,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  accessDeniedText: {
    fontSize: 20,
    fontFamily: fonts.Bold,
    color: '#d9534f', // Màu đỏ nổi bật
    textAlign: 'center',
    marginBottom: 10,
  },
  suggestionText: {
    fontSize: 16,
    fontFamily: fonts.Regular,
    color: '#6c757d', // Màu xám nhạt
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

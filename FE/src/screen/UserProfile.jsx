import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import {getMyInfo, logout, getById} from '../utils/api';
import {Avatar, Caption, Title} from 'react-native-paper';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import {getCurrentLocation, getAddressFromCoordinates} from '../utils/gps'; // Import các hàm từ gps.js
import {fonts} from '../assets/color_font/fonts';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../assets/color_font/colors';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import {useNavigation} from '@react-navigation/native';
import { useDeviceContext } from '../utils/DeviceContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const UserProfile = ({setIsAuthenticated}) => {
  const [userInfo, setUserInfo] = useState(null);
  const [userId] = useState(null);
  const [, setLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [avatarUri, setAvatarUri] = useState(null);
  const { userRoles, setRoles } = useDeviceContext(); 
  const navigation = useNavigation();
  const [relativeName, setRelativeName] = useState('');
  const { readBatteryLevel } = useDeviceContext();
  const [batteryLevel, setBatteryLevel] = useState('Loading...');
  const handleYourProfile = () => {
    navigation.navigate('YourProfile');
  };

  const handleConnectDevice =()=>{
    navigation.navigate('ConnectDeviceScreen');
    navigation.navigate('ConnectDeviceScreen', { userId: userInfo.id});
  }
  const handleLogout = async () => {
    const isLoggedOut = await logout();
    if (isLoggedOut) {
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('userId');
      setIsAuthenticated(false);
    } else {
      console.log('Logout failed');
    }
  };
  useEffect(() => {
    const fetchBatteryLevel = async () => {

      const level = await readBatteryLevel('2901', 'BEEF');
      if (level !== null) {
        setBatteryLevel(`${level}%`);
      } else {
        setBatteryLevel('Error');
      }
    };

    fetchBatteryLevel();

    // Gọi lại hàm này mỗi 11 giây
    const interval = setInterval(fetchBatteryLevel, 11000);
    return () => clearInterval(interval); // Cleanup interval khi component bị unmount
  }, [readBatteryLevel]);
  const fetchRelativeName = async (closeFriendId) => {
    try {
      if (closeFriendId) {
        const relative = await getById(closeFriendId); // Gọi API getById
        if (relative && relative.fullName) {
          setRelativeName(relative.fullName); // Gán tên người thân vào state
        } else {
          setRelativeName('Unknown'); // Gán giá trị mặc định nếu không có tên
        }
      } else {
        setRelativeName('No Relative'); // Gán giá trị nếu không có closeFriendId
      }
    } catch (error) {
      console.error('Error fetching relative name:', error);
      setRelativeName('Error'); // Gán giá trị lỗi
    }
  };
  
  // Hàm fetch user info từ API
  const fetchUserInfo = async () => {
    const data = await getMyInfo();
    if (data) {
      setUserInfo(data);
      setRoles(data.roles || []);
      if (data.avatar && data.avatar.startsWith('/9j/')) {
        setAvatarUri(`data:image/png;base64,${data.avatar}`);
      }
      else {
        // This is a URL (like Google avatar URL)
        setAvatarUri(data.avatar);
      }
      if (data.closeFriendId) {
        await fetchRelativeName(data.closeFriendId); // Gọi hàm lấy tên người thân
      }

    }
  };

  // Lắng nghe sự kiện 'focus' để cập nhật thông tin người dùng khi quay lại màn hình
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUserInfo();
    });

    return unsubscribe; // Cleanup listener khi unmount
  }, [navigation]);

  // Fetch location and address
  useEffect(() => {
    const fetchLocationAndAddress = async () => {
      try {
        const {latitude, longitude} = await getCurrentLocation();
        setLocation({latitude, longitude});
        const address = await getAddressFromCoordinates(latitude, longitude);
        setAddress(address);
      } catch (error) {
        console.error('Error fetching location or address:', error);
      }
    };

    fetchLocationAndAddress();
    const interval = setInterval(() => {
      fetchLocationAndAddress();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  if (!userInfo) {
    return (
      <View style={styles.container}>
        <Text>Loading user information...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfoSection}>
        <View style={styles.ava}>
          <View style={styles.avatarContainer}>
            {avatarUri ? (
              <Avatar.Image
                source={{uri: avatarUri}} // Sử dụng ảnh từ API đã lấy
                size={80}
              />
            ) : (
              <Avatar.Icon size={80} icon="account" /> // Hiển thị avatar mặc định
            )}
          </View>

          <View>
            <Title style={styles.label}>Hi, {userInfo.username}</Title>
          </View>
        </View>
      </View>

      {/* Hiển thị vị trí sau khi reverse geocoding */}
      <View style={styles.userInfoSection}>
        <View style={styles.row}>
          <Entypo name="location" color="#777777" size={20} />
          <Text style={styles.textInfo}>
            {address || 'Loading location...'}
          </Text>
        </View>
      </View>
      <View style={styles.row}>
        <FontAwesome name="phone" color="#777777" size={20} />
        <Text style={styles.textInfo}> {userInfo.telephone}</Text>
      </View>
      <View style={styles.row}>
        <MaterialCommunityIcons name="email" color="#777777" size={20} />
        <Text style={styles.textInfo}> {userInfo.email}</Text>
      </View>
      <View style={styles.infoBoxWrapper}>
        <View
          style={[
            styles.infoBox,
            {
              borderRightColor: '#dddddd',
              borderRightWidth: 1,
            },
          ]}>
          <Title style={styles.label}>Battery level</Title>
          <Caption>{batteryLevel}</Caption>
        </View>
        <View style={styles.infoBox}>
          <Title style={styles.label}>Your Relative</Title>
          <Caption>{relativeName || 'Loading...'}</Caption> 
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.profileWrapper}
        onPress={handleYourProfile}>
        <Ionicons name={'person'} size={25} style={styles.icon} />
        <Text style={styles.textProfile}>Your Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.profileWrapper} onPress={handleConnectDevice}>
        <MaterialIcons name={'devices'} size={25} style={styles.icon} />
        <Text style={styles.textProfile}>Connect Device</Text>
      </TouchableOpacity>
      <View style={styles.profileWrapper}>
        <Ionicons name={'settings'} size={25} style={styles.icon} />
        <Text style={styles.textProfile}>Settings</Text>
      </View>

      <TouchableOpacity style={styles.profileWrapper} onPress={handleLogout}>
        <FontAwesome name={'sign-out'} size={25} style={styles.icon} />
        <Text style={styles.textProfile}>Log out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
    fontSize: 18,
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInfo: {
    fontSize: 18,
    marginVertical: 5,
  },
  infoBoxWrapper: {
    borderBottomColor: '#dddddd',
    borderBottomWidth: 1,
    borderTopColor: '#dddddd',
    borderTopWidth: 1,
    flexDirection: 'row',
    height: 100,
  },
  infoBox: {
    width: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileWrapper: {
    marginTop: 20,
    flexDirection: 'row',
    paddingVertical: 10,
  },
  textProfile: {
    fontFamily: fonts.SemiBold,
    fontSize: 17,
    paddingHorizontal: 15,
    color: colors.primary,
  },
  icon: {
    fontSize: 28,
    color: '#87ceeb',
  },
});

export default UserProfile;

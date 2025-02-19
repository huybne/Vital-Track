import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import Feather from 'react-native-vector-icons/Feather';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../assets/color_font/colors';
import {fonts} from '../assets/color_font/fonts';
import {
  getAllFollowers,
  getUserYouFollow,
  addFollowersToFollow,
  setCloseFriend,
  deleteFollow,
  getAllUserRoleDeviceActive,
  sendHealthRequest,
  stopHealthRequest,
} from '../utils/api';
import {useDeviceContext} from '../utils/DeviceContext';
//import database from '@react-native-firebase/database';
// import { getAddressFromCoordinates} from '../utils/gps';
import {getAddressFromCoordinates, getCurrentLocation} from '../utils/gps';
import {useNavigation} from '@react-navigation/native';

const Relatives = () => {
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFollowers, setFilteredFollowers] = useState([]);
  const [users, setAllUsers] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [searchAllUsersQuery, setSearchAllUsersQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const {userRoles} = useDeviceContext();
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);
  const [selectedUserForLocation, setSelectedUserForLocation] = useState(null);
  const [intervalId, setIntervalId] = useState(null);
  const [address, setAddress] = useState(null);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isHealthRequestSent, setIsHealthRequestSent] = useState(false);
  const [locationData, setLocationData] = useState(null); // Dữ liệu lấy từ Firebase
  const [location, setLocation] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    fetchUserData();
    fetchAllUsers();
  }, [userRoles]);

  const fetchHealthData = async (userId, deviceId) => {
    let attempt = 0;
    const maxAttempts = 5;

    // Kiểm tra nếu deviceId không hợp lệ
    if (!deviceId || deviceId === 'undefined') {
      console.error('deviceId is missing or undefined, cannot fetch data');
      alert('Device ID is missing or invalid');
      return; // Nếu không có deviceId, dừng lại
    }

    // URL đầy đủ của Firebase
    const healthDataUrl = `https://vitaltrack-92b70-default-rtdb.asia-southeast1.firebasedatabase.app/healthdata/${userId}.json`;
    const deviceDataUrl = `https://vitaltrack-92b70-default-rtdb.asia-southeast1.firebasedatabase.app/${deviceId}/user.json?orderBy="$key"&limitToLast=1`;

    while (attempt < maxAttempts) {
      try {
        console.log('Fetching data from URL:', healthDataUrl);
        const responseHealth = await fetch(healthDataUrl); // Gửi yêu cầu GET tới URL Firebase
        const healthData = await responseHealth.json(); // Chuyển đổi phản hồi thành JSON

        if (healthData) {
          setLocationData(healthData); // Nếu có dữ liệu từ healthdata, trả về và dừng lại
          return;
        }

        console.log('Fetching data from URL:', deviceDataUrl);
        const responseDevice = await fetch(deviceDataUrl); // Gửi yêu cầu GET tới URL Firebase
        const deviceData = await responseDevice.json(); // Chuyển đổi phản hồi thành JSON

        if (deviceData) {
          // Kiểm tra nếu dữ liệu từ deviceData có tồn tại và trích xuất lat, long
          const firstKey = Object.keys(deviceData)[0]; // Lấy key đầu tiên từ đối tượng
          const location = deviceData[firstKey]; // Lấy lat, long từ khóa động

          if (location && location.lat && location.long) {
            setLocationData(location); // Nếu có lat và long, cập nhật dữ liệu
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching data attempt:', attempt + 1, error);
      }

      attempt += 1;
      if (attempt < maxAttempts) {
        console.log(`Retrying... Attempt ${attempt + 1}`);
      }
    }

    //console.error('Failed to fetch data after multiple attempts');
  };

  const deleteHealthData = async (userId, deviceId) => {
    // URL trực tiếp của Firebase
    const healthDataUrl = `https://vitaltrack-92b70-default-rtdb.asia-southeast1.firebasedatabase.app/healthdata/${userId}.json`;
    const deviceDataUrl = `https://vitaltrack-92b70-default-rtdb.asia-southeast1.firebasedatabase.app/${deviceId}/user.json`;

    try {
      // Gửi yêu cầu DELETE tới Firebase
      await fetch(healthDataUrl, {
        method: 'DELETE',
      });
      console.log('Deleted health data for userId:', userId);

      await fetch(deviceDataUrl, {
        method: 'DELETE',
      });
      console.log('Deleted data for deviceId:', deviceId);
    } catch (error) {
      console.error('Failed to delete data:', error);
    }
  };

  useEffect(() => {
    if (!isLocationModalVisible && selectedUserForLocation) {
      const selectedUser = followers.find(
        user => user.id === selectedUserForLocation,
      );
      if (selectedUser) {
        const {id: userId, deviceId} = selectedUser;
        deleteHealthData(userId, deviceId); // Gửi yêu cầu xóa khi đóng modal
      }
    }
  }, [isLocationModalVisible]);
  // Logic để gọi fetchHealthData khi mở modal
  useEffect(() => {
    if (isLocationModalVisible && selectedUserForLocation) {
      const selectedUser = followers.find(
        user => user.id === selectedUserForLocation,
      );

      // Kiểm tra nếu tìm thấy user và deviceId không phải là null hoặc undefined
      if (selectedUser && selectedUser.deviceId) {
        const {id: userId, deviceId: deviceId} = selectedUser;
        console.log(
          `Fetching data for userId: ${userId}, deviceId: ${deviceId}`,
        ); // Log để kiểm tra
        fetchHealthData(userId, deviceId); // Gọi hàm fetchHealthData với đúng userId và deviceId
      } else {
        console.error('User not found or deviceId is missing');
        alert('Device ID is missing for this user');
      }
    }
  }, [isLocationModalVisible, selectedUserForLocation]);

  const startFetchingHealthData = userId => {
    // Kiểm tra nếu userId không hợp lệ
    const selectedUser = followers.find(user => user.id === userId); // Tìm người dùng từ followers
    if (!selectedUser || !selectedUser.deviceId) {
      console.error('Device ID is missing or user not found');
      return; // Nếu không có deviceId, không tiếp tục fetch
    }

    const {deviceId} = selectedUser; // Lấy deviceId từ đối tượng người dùng

    // Kiểm tra lại nếu deviceId hợp lệ
    if (!deviceId) {
      console.error('Invalid deviceId, cannot fetch data');
      return; // Nếu không có deviceId, dừng lại
    }

    // Kiểm tra và dừng lại nếu có interval đang chạy
    if (intervalId) {
      clearInterval(intervalId);
    }

    // Bắt đầu việc fetch dữ liệu mỗi 3 giây với cả userId và deviceId
    const id = setInterval(() => fetchHealthData(userId, deviceId), 3000);
    setIntervalId(id); // Lưu intervalId để có thể dừng sau này
  };

  const stopFetchingHealthData = () => {
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };
  useEffect(() => {
    const fetchAddress = async () => {
      if (locationData && locationData.lat && locationData.long) {
        setIsFetchingAddress(true);
        try {
          console.log(
            'Fetching address for:',
            locationData.lat,
            locationData.long,
          ); // Log tọa độ
          const fetchedAddress = await getAddressFromCoordinates(
            locationData.lat,
            locationData.long,
          );
          setAddress(fetchedAddress);
          console.log('Fetched Address:', fetchedAddress); // Log địa chỉ
        } catch (error) {
          console.error('Error fetching address:', error.message);
          setAddress('Unable to fetch address');
        } finally {
          setIsFetchingAddress(false);
        }
      }
    };

    if (isLocationModalVisible && selectedUserForLocation) {
      if (!isHealthRequestSent) {
        sendHealthRequest(selectedUserForLocation); // Gửi yêu cầu khi mở modal
        setIsHealthRequestSent(true); // Đánh dấu yêu cầu đã được gửi
      }
      startFetchingHealthData(selectedUserForLocation);
      fetchAddress(); // Gọi fetchAddress ngay lập tức
    } else {
      stopHealthRequest(selectedUserForLocation); // Gửi yêu cầu dừng khi đóng modal
      stopFetchingHealthData();
      setIsHealthRequestSent(false);
    }

    return () => stopFetchingHealthData(); // Cleanup khi unmount hoặc modal đóng
  }, [isLocationModalVisible, selectedUserForLocation, locationData]);

  // Fetch data based on role
  const fetchUserData = async () => {
    try {
      let response;
      if (userRoles.includes('DEVICE_ACTIVE')) {
        response = await getAllFollowers(); // API for people following you
      } else {
        response = await getUserYouFollow(); // API for people you follow
      }
      if (response) {
        setFollowers(response);
        setFilteredFollowers(response);
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    }
  };

  // Fetch all users for "Add Friends" modal
  const fetchAllUsers = async () => {
    try {
      const response = await getAllUserRoleDeviceActive();
      if (response) {
        setAllUsers(response);
        setFilteredUsers(response);
      }
    } catch (error) {
      console.error('Failed to fetch all users:', error);
    }
  };

  const handleSearch = text => {
    setSearchQuery(text);
    if (text) {
      const filteredData = followers.filter(
        item =>
          item.username.toLowerCase().includes(text.toLowerCase()) ||
          (item.fullName &&
            item.fullName.toLowerCase().includes(text.toLowerCase())),
      );
      setFilteredFollowers(filteredData);
    } else {
      setFilteredFollowers(followers);
    }
  };

  const handleSearchAllUsers = text => {
    setSearchAllUsersQuery(text);
    if (text) {
      const filteredData = users.filter(
        item =>
          item.username.toLowerCase().includes(text.toLowerCase()) ||
          (item.fullName &&
            item.fullName.toLowerCase().includes(text.toLowerCase())),
      );
      setFilteredUsers(filteredData);
    } else {
      setFilteredUsers(users);
    }
  };

  const handleAddFollower = async username => {
    try {
      const result = await addFollowersToFollow(username);
      if (result.success) {
        console.log(result.message);
        alert(result.message); // Hiển thị thông báo thành công
        fetchUserData(); // Làm mới dữ liệu sau khi thêm follower
      } else {
        // Thay đổi cách hiển thị khi không phải lỗi nghiêm trọng
        if (result.message === 'You have already sent a follow request.') {
          alert(result.message); // Hiển thị thông báo thân thiện
        } else {
          console.error('Failed to add follower:', result.message); // Lỗi khác
          alert('Error: ${result.message}');
        }
      }
    } catch (error) {
      console.error('Error adding follower:', error); // Xử lý lỗi bất ngờ
      alert('An unexpected error occurred. Please try again later.');
    }
  };

  const renderFollower = ({item}) => (
    <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
      <View style={styles.followerItem}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.username.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.name}>{item.username}</Text>
          <Text style={styles.subText}>{item.email}</Text>
          <Text style={styles.subText}>{item.fullName}</Text>
        </View>
        <TouchableOpacity onPress={() => setSelectedUser(item.username)}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.primary} />
        </TouchableOpacity>
        {selectedUser === item.username && (
          <View style={styles.menu}>
            <TouchableOpacity
              onPress={() => handleMenuSelect(item.username, 'close')}>
              <Text style={styles.menuItem}>Set Close Friend</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleMenuSelect(item.username, 'delete')}>
              <Text style={styles.menuItem}>Delete Friend</Text>
            </TouchableOpacity>
            {userRoles.includes('RELATIVE') && (
              <TouchableOpacity
                onPress={() => handleMenuSelect(item.username, 'location')}>
                <Text style={styles.menuItem}>View Location</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
  useEffect(() => {
    return () => {
      stopFetchingHealthData(); // Cleanup khi component unmount
      stopHealthRequest(selectedUserForLocation); // Dừng yêu cầu khi unmount
    };
  }, []);
  
  useEffect(() => {
    const fetchCurrentLocation = async () => {

        const {latitude, longitude} = await getCurrentLocation();
        setLocation([longitude, latitude]); // Mapbox format: [longitude, latitude]
      
    };

    fetchCurrentLocation();
  }, []);
  const handleMenuSelect = async (username, action) => {
    try {
      if (action === 'close') {
        console.log('Attempting to set ${username} as close friend');
        const success = await setCloseFriend(username);
        if (success) {
          alert('Set close friend successfully!');
          await fetchUserData();
        } else {
          alert('Only users with a compatible device can access this feature.');
        }
      } else if (action === 'delete') {
        console.log('Attempting to delete follow for ${username}');
        const success = await deleteFollow(username);
        if (success) {
          alert('Delete follow successfully!');
          await fetchUserData();
        } else {
          alert('Failed to delete follow. Please try again.');
        }
      } else if (action === 'location') {
        console.log('Viewing location of ${username}');
        const selectedUser = followers.find(user => user.username === username);
        if (selectedUser) {
          setSelectedUserForLocation(selectedUser.id); // Gán đúng userId từ response
          setIsLocationModalVisible(true); // Hiển thị modal
        } else {
          console.error('User not found or userId is missing');
        }
      }
    } catch (error) {
      console.error(
        'Error during ${action} action for ${username}:, error.message',
      );
      alert('An error occurred while processing the request: ${error.message}');
    } finally {
      setSelectedUser(null);
    }
  };

  const renderLocationModal = () => (
    <Modal
      visible={isLocationModalVisible}
      animationType="slide"
      transparent={true}>
      <View style={styles.modalScreen}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            Location & Health Data for User ID: {selectedUserForLocation}
          </Text>
          {locationData ? (
            <View>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>
                  Heart Rate:{' '}
                  {locationData.heartRate
                    ? `${locationData.heartRate.toFixed(2)} bpm`
                    : 'null'}
                </Text>
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>
                  SpO2:{' '}
                  {locationData.spO2
                    ? `${locationData.spO2.toFixed(2)}%`
                    : 'null'}
                </Text>
              </Text>
              <Text style={styles.infoText}>
                <Text style={styles.infoLabel}>Address:</Text>{' '}
                {isFetchingAddress ? 'Fetching address...' : address || 'null'}
              </Text>
              <TouchableOpacity
                style={styles.navigateButton}
                onPress={() => {
                  // Điều hướng sang màn hình TRACKING
                  navigation.navigate('TRACKING', {
                    latitude: locationData.lat,
                    longitude: locationData.long,
                    
                  });
  
                  // Đặt timeout để đóng modal và dừng các tác vụ sau 5 giây
                  setTimeout(() => {
                    setIsLocationModalVisible(false);
                    stopFetchingHealthData(); // Dừng fetch dữ liệu
                    stopHealthRequest(selectedUserForLocation); // Dừng yêu cầu health request
                    setIsHealthRequestSent(false); // Reset trạng thái yêu cầu
                    
                  }, 5000);
                }}>
                <Text style={styles.navigateButtonText}>Go to Tracking</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={styles.infoText}>No data available.</Text>
          )}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setIsLocationModalVisible(false)}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
  

  const renderModal = () => (
    <Modal visible={openModal} animationType="slide" transparent={true}>
      <View style={styles.modalScreen}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Add Friends</Text>
          <View style={styles.searchBar}>
            <Feather name={'search'} size={20} style={styles.searchIcon} />
            <TextInput
              placeholder="Search all users"
              value={searchAllUsersQuery}
              onChangeText={handleSearchAllUsers}
              style={styles.searchInput}
            />
          </View>
          <FlatList
            data={filteredUsers}
            keyExtractor={item => item.id.toString()}
            renderItem={({item}) => (
              <View style={styles.listUsers}>
                <Text style={styles.name}>{item.username}</Text>
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => handleAddFollower(item.username)}>
                  <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity
            onPress={() => setOpenModal(false)}
            style={styles.closeButton}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <TouchableWithoutFeedback onPress={() => setSelectedUser(null)}>
      <View style={styles.container}>
        <View style={styles.header}>
          {isSearchActive ? (
            <View style={styles.searchBar}>
              <TouchableOpacity
                onPress={() => {
                  setIsSearchActive(false);
                  setSearchQuery('');
                  setFilteredFollowers(followers);
                }}
                style={styles.backButton}>
                <Ionicons name={'arrow-back'} size={24} />
              </TouchableOpacity>
              <Feather name={'search'} size={20} style={styles.searchIcon} />
              <TextInput
                placeholder="Search"
                value={searchQuery}
                onChangeText={handleSearch}
                style={styles.searchInput}
                autoFocus={true}
              />
            </View>
          ) : (
            <View style={styles.iconContainer}>
              <TouchableOpacity onPress={() => setIsSearchActive(true)}>
                <Feather name={'search'} size={24} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.icon}
                onPress={() => setOpenModal(true)}>
                <Ionicons name={'person-add'} size={24} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.title}>
          {userRoles.includes('DEVICE_ACTIVE')
            ? 'Friends Following You'
            : 'Friends You Follow'}
        </Text>
        <FlatList
          data={filteredFollowers}
          keyExtractor={item => item.id.toString()}
          renderItem={renderFollower}
          style={styles.flatList}
        />
        {renderModal()}
        {renderLocationModal()}
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Relatives;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 20,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    borderRadius: 30,
    paddingHorizontal: 10,

    borderWidth: 1,
    borderColor: '#000000',
  },
  backButton: {
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 5,
    color: '#A9A9A9',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  icon: {
    marginLeft: 15,
  },
  title: {
    marginTop: 10,
    fontFamily: fonts.Bold,
    color: '#000000',
    fontSize: 30,
    marginBottom: 10,
  },
  title2: {
    fontFamily: fonts.Bold,
    color: colors.gray,
    fontSize: 12,
    marginBottom: 10,
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D3D3D3',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#87ceeb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 20,
    fontFamily: fonts.Bold,
    color: colors.primary,
  },
  subText: {
    fontSize: 12,
    color: colors.primary,
  },
  modalScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 20,
    width: '90%',
    maxHeight: '80%',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
    // overflow: 'hidden', // Xóa dòng này để tránh ẩn nội dung bên trong modal
  },

  mapContainer: {
    width: '100%',
    height: 300, // Chiều cao cố định để đảm bảo map có không gian hiển thị
    marginTop: 20,
    borderRadius: 15,
    borderWidth: 1, // Thêm viền để dễ nhận biết map container
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 22,
    fontFamily: fonts.Bold,
    color: colors.black,
    marginBottom: 20,
    textAlign: 'center',
  },
  listUsers: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray,
  },

  addButton: {
    backgroundColor: colors.primary,
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: fonts.Bold,
  },
  closeButton: {
    backgroundColor: 'red',
    width: '80%',
    alignItems: 'center',
    borderRadius: 30,
    marginTop: 20,
    paddingVertical: 12,
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: fonts.Bold,
  },
  menu: {
    position: 'absolute',
    right: 10,
    top: 30,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 5,
    fontSize: 16,
    color: colors.primary,
  },
  flatList: {
    marginBottom: 80,
  },

  navigateButton: {
    backgroundColor: 'blue',
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
});

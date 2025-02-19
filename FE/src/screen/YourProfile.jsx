import React, {useState, useEffect} from 'react';
import {StyleSheet, Text, View, TouchableOpacity} from 'react-native';
import {Avatar} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import Fontisto from 'react-native-vector-icons/Fontisto';
import {launchImageLibrary} from 'react-native-image-picker';
import {colors} from '../assets/color_font/colors';
import {fonts} from '../assets/color_font/fonts';
import {getMyInfo, uploadAvatarApi} from '../utils/api';
import {useNavigation} from '@react-navigation/native';
import Modal from 'react-native-modal';
import EditProfile from './EditProfile';

const YourProfile = () => {
  const navigation = useNavigation();


  const [userInfo, setUserInfo] = useState({
    id: null,
    username: '',
    fullName: '',
    dob: '',
    gender: '',
    telephone: '',
    email: '',
    status: false,
  });

  const [avatarUri, setAvatarUri] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  const chooseImage = () => {
    const options = {
      mediaType: 'photo',
    };

    launchImageLibrary(options, async response => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorCode) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        if (selectedImage && userInfo.id) {
          const formData = new FormData();
          formData.append('file', {
            uri: selectedImage.uri,
            name: selectedImage.fileName || 'avatar.jpg',
            type: selectedImage.type || 'image/jpeg',
          });

          const result = await uploadAvatarApi(userInfo.id, formData);
          if (result) {
            setAvatarUri(selectedImage.uri);
            console.log('Avatar uploaded:', result);
            navigation.navigate('UserProfile', {
              updatedAvatarUri: selectedImage.uri,
            });
          } else {
            console.log('Avatar upload failed');
          }
        }
      }
    });
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await getMyInfo();
        if (data) {
          setUserInfo(data);
  
          if (data.avatar && data.avatar.startsWith('/9j/')) {
            setAvatarUri(`data:image/png;base64,${data.avatar}`);
          } else {
            setAvatarUri(data.avatar);
          }
        }
      } catch (error) {
        console.error('Error fetching user information: ', error);
      }
    };
  
    fetchUserInfo();
  }, []);
  

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {avatarUri ? (
            <Avatar.Image
              source={{uri: avatarUri}}
              size={180}
              style={styles.avatar}
            />
          ) : (
            <Avatar.Icon size={180} icon="account" style={styles.avatar} />
          )}

          {/* Button to choose an image */}
          <TouchableOpacity style={styles.cameraButton} onPress={chooseImage}>
            <MaterialIcons name="photo-camera" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Information */}
      <View style={styles.infoSection}>
        <View style={styles.profileWrapper}>
          <Ionicons name="person-outline" size={22} />
          <Text style={styles.textProfile}>Username</Text>
          <Text style={styles.textInfo}>{userInfo.username}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Ionicons name="person-outline" size={22} />
          <Text style={styles.textProfile}>Name</Text>
          <Text style={styles.textInfo}>{userInfo.fullName}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Feather name="calendar" color="#777777" size={20} />
          <Text style={styles.textProfile}>Date of birth</Text>
          <Text style={styles.textInfo}>{userInfo.dob}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Ionicons name="male-female-outline" color="#777777" size={20} />
          <Text style={styles.textProfile}>Gender</Text>
          <Text style={styles.textInfo}>{userInfo.gender}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Feather name="phone" color="#777777" size={21} />
          <Text style={styles.textProfile}>Telephone</Text>
          <Text style={styles.textInfo}>{userInfo.telephone}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Feather name="mail" color="#777777" size={23} />
          <Text style={styles.textProfile}>Email</Text>
          <Text style={styles.textInfo}>{userInfo.email}</Text>
        </View>
        <View style={styles.profileWrapper}>
          <Fontisto name="checkbox-active" color="#777777" size={20} />
          <Text style={styles.textProfile}>Status</Text>
          <Text style={styles.textInfo}>
            {userInfo.status ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {/* Edit Button */}
      <TouchableOpacity
        style={styles.editButton}
        onPress={() => setOpenModal(true)}>
        <MaterialIcons name="edit" size={20} color="#fff" />
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
      {openModal && (
        <Modal
          visible={openModal}
          animationType="slide"
          transparent={true}
          backdropOpacity={0}
          onRequestClose={() => setOpenModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.fullScreenModal}>
              <EditProfile setOpenModal={setOpenModal} />
              
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

export default YourProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  fullScreenModal: {
    width: '110%', 
    height: '70%', 
    backgroundColor: '#fff',
    borderRadius: 20, 
    overflow: 'hidden',
    elevation: 0,
  },
  input: {
    width: '20%',
    marginVertical: 10,
    padding: 10,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
  },
  header: {
    backgroundColor: '#87CEEB',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    borderColor: '#fff',
    borderWidth: 3,
    borderRadius: 90, 
    overflow: 'hidden',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 15,
    padding: 5,
  },
  infoSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  profileWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f2f2f2',
  },
  textProfile: {
    fontSize: 16,
    color: colors.secondary,
    fontFamily: fonts.Medium,
    marginLeft: 10,
    flex: 1,
  },
  textInfo: {
    fontSize: 16,
    fontFamily: fonts.SemiBold,
    color: colors.primary,
    textAlign: 'right',
  },
  editButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#87ceeb',
    borderRadius: 10,
    alignSelf: 'center',
    width: '90%',
  },
  editText: {
    marginLeft: 5,
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
});

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import {Picker} from '@react-native-picker/picker';
import {getMyInfo, updateUserApi} from '../utils/api';

const EditProfile = ({ setOpenModal }) => {
  const [userInfo, setUserInfo] = useState({
    fullName: '',
    dob: '',
    email: '',
    telephone: '',
    gender: '',
    status: false,
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmailError] = useState(false);

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || new Date();
    setShowDatePicker(false);

    const formattedDate = moment(currentDate).format('DD-MM-YYYY');
    setUserInfo({...userInfo, dob: formattedDate});
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError(true);
    } else {
      setEmailError(false);
    }
    setUserInfo({...userInfo, email});
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      const data = await getMyInfo();
      if (data) {
        setUserInfo(data);
      }
      
    };

    fetchUserInfo();
  }, []);

  const handleUpdateProfile = async () => {
    const result = await updateUserApi(userInfo.id, userInfo);
    if (result) {
      Alert.alert('Success', 'Profile updated successfully!');
      onProfileUpdated();
      setOpenModal(false); // Close modal after success
    } else {
      Alert.alert('Error', 'Failed to update profile.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={userInfo.fullName}
        onChangeText={text => setUserInfo({...userInfo, fullName: text})}
      />
      <TouchableOpacity onPress={() => setShowDatePicker(true)}>
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={userInfo.dob}
          editable={false}
        />
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Telephone"
        value={userInfo.telephone}
        onChangeText={text => setUserInfo({...userInfo, telephone: text})}
      />
      <TextInput
        style={[styles.input, email && styles.errorInput]}
        placeholder="Email"
        value={userInfo.email}
        onChangeText={validateEmail}
      />
      {email && <Text style={styles.errorText}>Invalid email format</Text>}
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={userInfo.gender}
          style={styles.picker}
          onValueChange={itemValue =>
            setUserInfo({...userInfo, gender: itemValue})
          }>
          <Picker.Item label="Male" value="male" />
          <Picker.Item label="Female" value="female" />
        </Picker>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={handleUpdateProfile}>
        <Text style={styles.saveButtonText}>Update Profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={() => setOpenModal(false)}>
  <Text style={styles.cancelButtonText}>Cancel</Text>
</TouchableOpacity>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f8ff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 25,
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#f8f8f8',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  saveButton: {
    backgroundColor: '#87ceeb',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  cancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 18,
  },
  errorInput: {
    borderColor: 'red',
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
  },
});

export default EditProfile;

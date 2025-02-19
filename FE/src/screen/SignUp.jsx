import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, {useState, useEffect, useRef} from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {colors} from '../assets/color_font/colors';
import {fonts} from '../assets/color_font/fonts';
import {useNavigation} from '@react-navigation/native';
import {otpRequest, verifyOtpApi, verifyTokenApi} from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';
import {ActivityIndicator} from 'react-native';
import {Modal} from 'react-native-paper';

const SignUp = () => {
  const navigation = useNavigation();
  const goBack = () => {
    navigation.navigate('HOME');
  };
  const handleLogin = () => {
    navigation.navigate('LOGIN');
  };
  const [timer, setTimer] = useState(0);
  const inputContainer = hasError => ({
    borderWidth: 1,
    borderColor: hasError ? 'red' : colors.secondary,
    borderRadius: 100,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    marginVertical: 10,
  });

  const [email, setEmail] = useState('');

  const [emailError, setEmailError] = useState('');
  const [openModal, setOpenModal] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '']); // Mảng lưu 5 ký tự OTP

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const [loading, setLoading] = useState(false);

  // Hàm kiểm tra token khi vào trang Login
  const checkTokenAndRedirect = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const isValid = await verifyTokenApi(token);
      if (isValid) {
        // Nếu token hợp lệ, chuyển đến trang Tracking
        navigation.navigate('SIGNUPSECOND');
      }
    }
  };
  useEffect(() => {
    checkTokenAndRedirect();
  }, []);
  const validate = () => {
    let valid = true;

    // Kiểm tra email
    if (!email) {
      setEmailError('Email is required');
      valid = false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Invalid email format');
      valid = false;
    } else {
      setEmailError('');
    }
    return valid;
  };
  const handleSubmit = async () => {
    if (validate()) {
      setOpenModal(true); // Mở modal ngay lập tức khi bấm nút
      setLoading(true); // Hiển thị loading trong khi xử lý OTP request

      const userData = {email};
      try {
        const result = await otpRequest(userData);
        setLoading(false);

        if (!result) {
          Alert.alert('Error', 'Failed to send OTP. Please try again.');
          setOpenModal(false); // Đóng modal nếu có lỗi
        } else {
          setTimer(60); // Bắt đầu đếm ngược 60 giây
        }
      } catch (error) {
        setLoading(false);
        setOpenModal(false); // Đóng modal nếu có lỗi
        Alert.alert('Error', error.message || 'Failed to request OTP.');
      }
    }
  };
  useEffect(() => {
    let interval;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer(prevTimer => prevTimer - 1);
      }, 1000);
    } else if (timer === 0) {
      clearInterval(interval); // Dọn dẹp khi hết thời gian
    }
    return () => clearInterval(interval); // Dọn dẹp khi unmount
  }, [timer]);

  const renderGetOtpButtonContent = () => {
    if (loading) return <ActivityIndicator size="small" color="#fff" />;
    if (timer > 0) return <Text style={styles.loginText}>Wait {timer}s</Text>;
    return <Text style={styles.loginText}>Get OTP By Email</Text>;
  };

  function renderModal() {
    return (
      <Modal visible={openModal} animationType="fade" transparent={true}>
        <View style={styles.modalScreen}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Xác nhận Mã OTP</Text>
            <Text style={{marginBottom: 10, textAlign: 'center', fontSize: 14}}>
              Mã xác thực gồm 5 số đã được gửi đến email của bạn
            </Text>
            <View style={styles.otpContainer}>
              {otp.map((value, index) => (
                <TextInput
                  key={index}
                  style={styles.otpInput}
                  value={value}
                  maxLength={1}
                  keyboardType="number-pad"
                  onChangeText={text => handleOtpChange(text, index)}
                  ref={ref => (otpRefs.current[index] = ref)}
                />
              ))}
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleVerifyOtp}>
              <Text style={styles.submitButtonText}>Xác nhận</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setOpenModal(false)}>
              <Text style={styles.closeModal}>Hủy</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  const otpRefs = useRef([]); // Tham chiếu đến các ô nhập OTP

  const handleOtpChange = (text, index) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Tự động chuyển đến ô tiếp theo nếu có
    if (text && index < otp.length - 1) {
      otpRefs.current[index + 1].focus();
    }

    // Nếu xóa ký tự, quay lại ô trước đó
    if (!text && index > 0) {
      otpRefs.current[index - 1].focus();
    }
  };
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('').trim();
    if (otpCode.length !== 5) {
      Alert.alert('Invalid OTP', 'Please enter all 5 digits of the OTP.');
      return;
    }
  
    try {
      const result = await verifyOtpApi({ email, otpCode });
      if (result) {
        Alert.alert('Success', 'OTP verified successfully!');
        setOtp(['', '', '', '', '']);
        setOpenModal(false);
  
        // Truyền email đã xác minh khi chuyển hướng
        navigation.navigate('SIGNUPSECOND', { email });
      } else {
        Alert.alert('Error', 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to verify OTP.');
    }
  };
  
  
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButtonWrapper} onPress={goBack}>
        <Ionicons
          name={'arrow-back-outline'}
          color={colors.primary}
          size={40}
        />
      </TouchableOpacity>
      <View style={styles.textContainer}>
        <Text style={styles.headingText}>Let's get started</Text>
      </View>
      <View style={styles.formContainer}>
        <View style={inputContainer(emailError)}>
          <Ionicons name={'mail-outline'} size={25} color={colors.secondary} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter your email"
            placeholderTextColor={colors.secondary}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </View>
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TouchableOpacity
          style={styles.loginButtonWrapper}
          onPress={handleSubmit}
          disabled={loading || timer > 0}>
          {renderGetOtpButtonContent()}
        </TouchableOpacity>

        <Text style={styles.continueText}>Or continue with</Text>
        <TouchableOpacity style={styles.googleButtonWrapper}>
          <Image
            source={require('../assets/picture/google.png')}
            style={styles.ggPng}
          />
          <Text style={styles.googleText}> Google</Text>
        </TouchableOpacity>
        <View style={styles.signUpRow}>
          <Text style={styles.textSignUp}>Already have an account! </Text>
          <TouchableOpacity>
            <Text style={styles.touchSignUp} onPress={handleLogin}>
              Login
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Gọi modal tại đây */}
      {openModal && renderModal()}
    </View>
  );
};

export default SignUp;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 20,
  },
  backButtonWrapper: {
    height: 60,
    width: 60,
    backgroundColor: colors.gray,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 30,
  },
  headingText: {
    fontSize: 32,
    color: colors.primary,
    fontFamily: fonts.SemiBold,
  },
  formContainer: {},
  // inputContainer: {
  //   borderWidth: 1,
  //   borderColor: error ? 'red' : colors.secondary,
  //   borderRadius: 100,
  //   paddingHorizontal: 20,
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   padding: 5,
  //   marginVertical: 10,
  // },
  textInput: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 8,
    fontFamily: fonts.Light,
    fontSize: 20,
  },
  forgotPasswordText: {
    textAlign: 'right',
    color: colors.primary,
    fontFamily: fonts.SemiBold,
    marginVertical: 10,
  },
  loginButtonWrapper: {
    backgroundColor: colors.primary,
    borderRadius: 100,
    marginTop: 20,
  },
  loginText: {
    color: colors.white,
    fontSize: 20,
    fontFamily: fonts.SemiBold,
    textAlign: 'center',
    padding: 10,
  },
  continueText: {
    textAlign: 'center',
    paddingVertical: 15,
    fontSize: 14,
    fontFamily: fonts.Regular,
    color: colors.primary,
  },
  ggPng: {
    height: 20,
    width: 20,
  },
  googleButtonWrapper: {
    flexDirection: 'row',
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  googleText: {
    color: colors.primary,
    fontSize: 20,
    fontFamily: fonts.SemiBold,
    textAlign: 'center',
  },
  signUpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  textSignUp: {
    color: colors.primary,
    fontFamily: fonts.Light,
  },
  touchSignUp: {
    color: colors.primary,
    fontFamily: fonts.SemiBold,
  },
  errorText: {
    color: 'red',
    fontSize: 14,
    marginLeft: 10,
    marginTop: -10,
  },
  modalScreen: {
    marginTop: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Nền mờ toàn màn hình
  },
  modalContent: {
    backgroundColor: '#ffffff', // Sử dụng màu nền trắng hoặc màu sáng hơn
    padding: 20,
    width: '100%',
    height: '105%',
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10, // Tăng elevation để bóng đổ nổi bật hơn trên nền
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 18,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  closeModal: {
    marginTop: 20,
    color: colors.primary,
    fontSize: 16,
  },
});

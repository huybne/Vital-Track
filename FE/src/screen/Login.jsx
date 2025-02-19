import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState, useEffect } from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AntDesign from 'react-native-vector-icons/AntDesign';
import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
import { colors } from '../assets/color_font/colors';
import { fonts } from '../assets/color_font/fonts';
import { useNavigation } from '@react-navigation/native';
import { loginApi, verifyTokenApi, googleLoginApi } from '../utils/api'; // Import API functions
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId:
  '530898901715-b47gf4n30lvtg0vsu8jk8q8rb9ssvprd.apps.googleusercontent.com',
  offlineAccess: true, 
  scopes: ['openid', 'profile', 'email'], 
});

const GoogleLogin = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    await GoogleSignin.signOut();
    const userInfo = await GoogleSignin.signIn();

    const serverAuthCode = userInfo.serverAuthCode || userInfo.data?.serverAuthCode;

    if (serverAuthCode) {
      console.log('Server Auth Code:', serverAuthCode);
    } else {
      console.warn('Server Auth Code is undefined. Please check your Google Sign-In configuration.');
    }

    return serverAuthCode;
  } catch (error) {
    console.error('Error during Google Sign-In:', error);
    return null;
  }
};


const Login = ({ setIsAuthenticated }) => {
  const [secureEntry, setSecureEntry] = useState(true);
  const navigation = useNavigation();
  const goBack = () => {
      navigation.navigate("HOME");
  };
  const handleSignUp = () => {
      navigation.navigate("SIGNUP");
  };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [, setLoading] =useState(false);

  const handlLoginWithGoogle = async () => {
    setLoading(true);
    try {
      const serverAuthCode = await GoogleLogin();  
      
      if (serverAuthCode) {
        // Call API to authenticate with the backend
        const response = await googleLoginApi(serverAuthCode);
        if (response) {
          console.log('Google login and token received successfully:');
          setIsAuthenticated(true);
        }
      } else {
        alert('Google login failed. No Auth Code received.');
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      alert('Google login failed.');
    } finally {
      setLoading(false);
    }
  };
  

  
   // Hàm kiểm tra token khi vào trang Login
   const checkTokenAndRedirect = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const isValid = await verifyTokenApi(token);
      if (isValid) {
        navigation.navigate('AppTabs');
      }
    }
  };
//   useEffect(() => {
//   const handleDeepLink = (event) => {
//     const { url } = event;
//     // Xử lý URL và lấy mã xác thực từ URL
//     const authCode = extractAuthCodeFromUrl(url);
//     // Tiếp tục xử lý đăng nhập với authCode
//   };

//   Linking.addEventListener('url', handleDeepLink);

//   return () => {
//     Linking.removeEventListener('url', handleDeepLink);
//   };
// }, []);
  useEffect(() => {
    checkTokenAndRedirect();
  }, []);

  const validate = () => {
    let valid = true;

    if (!username.trim()) {
      setUsernameError('Username is required');
      valid = false;
    } else {
      setUsernameError('');
    }

    if (!password.trim()) {
      setPasswordError('Password is required');
      valid = false;
    } else if (password.length < 3) {
      setPasswordError('Password must be at least 6 characters');
      valid = false;
    } else {
      setPasswordError('');
    }

    return valid;
  };

  const handleLogin = async () => {
    if (validate()) {
      try {
        const result = await loginApi(username, password);
        if (result && result.token) {
          console.log('Login successful:', result);

          await AsyncStorage.setItem('token', result.token);
          setIsAuthenticated(true);
          navigation.navigate('AppTabs');
        } else {
          console.log('Login failed or no token returned');
          alert('Login failed, please check your username and password.');
        }
      } catch (error) {
        console.error('Error during login process:', error);
        alert('An error occurred during login. Please try again later.');
      }
    } else {
      console.log('Form is invalid');
    }
  };
  
  return (
      <View style={styles.container}>
          <TouchableOpacity style={styles.backButtonWrapper} onPress={goBack}>
              <Ionicons name={'arrow-back-outline'} color={colors.primary} size={40} />
          </TouchableOpacity>
          <View style={styles.textContainer}>
              <Text style={styles.headingText}>Hey,</Text>
              <Text style={styles.headingText}>Welcome back</Text>
          </View>
          <View style={styles.formContainer}>
              <View style={styles.inputContainer}>
                  <AntDesign name={'user'} size={25} color={colors.secondary} />
                  <TextInput
                      style={styles.textInput}
                      placeholder="Enter your username"
                      placeholderTextColor={colors.secondary}
                      value={username}
                      onChangeText={setUsername}
                  />
              </View>
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}

              <View style={styles.inputContainer}>
                  <SimpleLineIcons name={'lock'} size={25} color={colors.secondary} />
                  <TextInput
                      style={styles.textInput}
                      placeholder="Enter your password"
                      placeholderTextColor={colors.secondary}
                      secureTextEntry={secureEntry}
                      value={password}
                      onChangeText={setPassword}
                  />
                  <TouchableOpacity
                      onPress={() => {
                          setSecureEntry((prev) => !prev);
                      }}>
                      <Ionicons name={'eye-outline'} size={25} color={colors.secondary} />
                  </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

              <TouchableOpacity>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.loginButtonWrapper} onPress={handleLogin}>
                  <Text style={styles.loginText}>Login</Text>
              </TouchableOpacity>
              <Text style={styles.continueText}>Or continue with</Text>
              <TouchableOpacity style={styles.googleButtonWrapper} onPress={handlLoginWithGoogle}>
                  <Image source={require('../assets/picture/google.png')} style={styles.ggPng}  />
                  <Text style={styles.googleText}>Google</Text>
              </TouchableOpacity>
              <View style={styles.signUpRow}>
                  <Text style={styles.textSignUp}>Don’t have an account? </Text>
                  <TouchableOpacity>
                      <Text style={styles.touchSignUp} onPress={handleSignUp}>
                          Sign up
                      </Text>
                  </TouchableOpacity>
              </View>
          </View>
      </View>
  );
};

export default Login;

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
      marginVertical: 30,
  },
  headingText: {
      fontSize: 32,
      color: colors.primary,
      fontFamily: fonts.SemiBold,
  },
  formContainer: {
      marginTop: 20,
  },
  inputContainer: {
      borderWidth: 1,
      borderColor: colors.secondary,
      borderRadius: 100,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      marginVertical: 10,
  },
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
});

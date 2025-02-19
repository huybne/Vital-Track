import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
  } from 'react-native';
  import React, {useState, useEffect} from 'react';
  import Ionicons from 'react-native-vector-icons/Ionicons';
  import AntDesign from 'react-native-vector-icons/AntDesign';
  import SimpleLineIcons from 'react-native-vector-icons/SimpleLineIcons';
  import {colors} from '../assets/color_font/colors';
  import {fonts} from '../assets/color_font/fonts';
  import {useNavigation} from '@react-navigation/native';
  import {signUpApi, verifyTokenApi} from '../utils/api';
  import AsyncStorage from '@react-native-async-storage/async-storage';
  import {Alert} from 'react-native';
  import { ActivityIndicator } from 'react-native';
  import { useRoute } from '@react-navigation/native';

  const SignUpSecond = () => {
    const [secureEntry, setSecureEntry] = useState(true);
    const navigation = useNavigation();
    const goBack = () => {
      navigation.navigate('HOME');
    };
    const handleLogin = () => {
      navigation.navigate('LOGIN');
    };
    const inputContainer = (hasError) => ({
      borderWidth: 1,
      borderColor: hasError ? 'red' : colors.secondary,
      borderRadius: 100,
      paddingHorizontal: 20,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 5,
      marginVertical: 10, 
    });
    const route = useRoute();
    const email = route.params?.email || ''; 
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
  
    const [fullNameError, setFullNameError] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');
    const [loading, setLoading] = useState(false);
    useEffect(() => {
      console.log('Email received in SignUpSecond:', route.params?.email);
    }, [route.params]);
    const checkTokenAndRedirect = async () => {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const isValid = await verifyTokenApi(token);
        if (isValid) {
          navigation.navigate('USERPROFILE');
        }
      }
    };
    useEffect(() => {
      checkTokenAndRedirect();
    }, []);
    const validate = () => {
      let valid = true;
  
  
      if (!username) {
        setUsernameError('Username is required');
        valid = false;
      } else {
        setUsernameError('');
      }
  
      if (!password) {
        setPasswordError('Password is required');
        valid = false;
      } else if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
        valid = false;
      } else {
        setPasswordError('');
      }
  
      if (!confirmPassword) {
        setConfirmPasswordError('Please confirm your password');
        valid = false;
      } else if (confirmPassword !== password) {
        setConfirmPasswordError('Passwords do not match');
        valid = false;
      } else {
        setConfirmPasswordError('');
      }
  
      return valid;
    };
    const handleSubmit = async () => {
      if (validate()) {
        setLoading(true); 
        const userData = {
          fullName,
          username,
          password,
          email,
        };
        console.log('Payload for Sign Up:', userData);

        try {
          const result = await signUpApi(userData);
          setLoading(false);
          if (result) {
            Alert.alert(
              'Registration Successful',
              'You have successfully registered! Please log in to continue.',
              [
                {
                  text: 'OK',
                  onPress: () => navigation.navigate('LOGIN'),
                },
              ],
            );
          } else {
            console.log('Sign up failed');
          }
        } catch (error) {
          setLoading(false);
          console.log('Error during sign up:', error);
        }
      } else {
        console.log('Form is invalid');
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
          <View style={inputContainer(fullNameError)}>
            <Ionicons name={'mail-outline'} size={25} color={colors.secondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your full name"
              placeholderTextColor={colors.secondary}
              value={fullName}
              onChangeText={setFullName}
            />
          </View>
          {fullNameError ? <Text style={styles.errorText}>{fullNameError}</Text> : null}
  
          <View style={inputContainer(usernameError)}>
            <AntDesign name={'user'} size={25} color={colors.secondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Enter your username"
              placeholderTextColor={colors.secondary}
              value={username}
              onChangeText={setUsername}
            />
          </View>
          {usernameError ? (
            <Text style={styles.errorText}>{usernameError}</Text>
          ) : null}
          <View style={inputContainer(passwordError)}>
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
                setSecureEntry(prev => !prev);
              }}>
              <Ionicons name={'eye-outline'} size={25} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          {passwordError ? (
            <Text style={styles.errorText}>{passwordError}</Text>
          ) : null}
  
          <View style={inputContainer(confirmPasswordError)}>
            <SimpleLineIcons name={'lock'} size={25} color={colors.secondary} />
            <TextInput
              style={styles.textInput}
              placeholder="Retype your password"
              placeholderTextColor={colors.secondary}
              secureTextEntry={secureEntry}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              onPress={() => {
                setSecureEntry(prev => !prev);
              }}>
              <Ionicons name={'eye-outline'} size={25} color={colors.secondary} />
            </TouchableOpacity>
          </View>
          {confirmPasswordError ? (
            <Text style={styles.errorText}>{confirmPasswordError}</Text>
          ) : null}
  
          <TouchableOpacity
            style={styles.loginButtonWrapper}
            onPress={handleSubmit}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.loginText}>Sign up</Text>
            )}
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
      </View>
    );
  };
  
  export default SignUpSecond;
  
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
  });
  
import React, {useEffect, useState} from 'react';
import {View, Text, ActivityIndicator} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {NavigationContainer} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {verifyTokenApi, refreshTokenApi, registerFCMToken} from './src/utils/api';
import HomeScreen from './src/screen/HomeScreen';
import Login from './src/screen/Login';
import SignUp from './src/screen/SignUp';
import BottomTab from './src/screen/BottomTab';
import {GoogleSignin} from '@react-native-google-signin/google-signin';
import {DeviceProvider} from './src/utils/DeviceContext';
import SignUpSecond from './src/screen/SignUpSecond';
import messaging from '@react-native-firebase/messaging';
import {listenForNotifications} from './src/utils/notification';
import {firebase} from '@react-native-firebase/app';

const Stack = createNativeStackNavigator();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  let intervalId;

  const handleLogout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
  };

  const startTokenRefresh = async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      console.error('No refresh token found');
      handleLogout();
      return;
    }

    intervalId = setInterval(async () => {
      console.log('Attempting to refresh token ...');
      const result = await refreshTokenApi(refreshToken);

      if (!result) {
        console.log('Token refresh failed, logging out...');
        handleLogout();
      }
    }, 59 * 60 * 1000);
  };

  const checkLoginStatus = async () => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      const isValid = await verifyTokenApi(token);
      if (isValid) {
        setIsAuthenticated(true);
        startTokenRefresh();

        const userId = await AsyncStorage.getItem('userId');
        if (userId) {
          console.log('Registering or updating FCM Token...');
          await registerFCMToken(userId);
        }
      } else {
        console.log('Token is invalid, logging out...');
        handleLogout();
      }
    } else {
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const listenForFCMTokenChanges = async () => {
    messaging().onTokenRefresh(async (newToken) => {
      console.log('FCM Token refreshed:', newToken);
      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        console.log('Updating FCM Token after refresh...');
        await registerFCMToken(userId); 
      }
    });
  };

  useEffect(() => {
    if (!firebase.apps.length) {
      firebase.initializeApp();
    } else {
      console.log('Firebase App already initialized');
    }

    listenForNotifications();

    listenForFCMTokenChanges();

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, []);

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (isLoading) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <DeviceProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {isAuthenticated ? (
            <Stack.Screen name="AppTabs">
              {() => <BottomTab setIsAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>
          ) : (
            <Stack.Screen name="AuthStack">
              {() => <AuthStack setIsAuthenticated={setIsAuthenticated} />}
            </Stack.Screen>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </DeviceProvider>
  );
};

const AuthStack = ({setIsAuthenticated}) => {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="HOME" component={HomeScreen} />
      <Stack.Screen name="LOGIN">
        {() => <Login setIsAuthenticated={setIsAuthenticated} />}
      </Stack.Screen>
      <Stack.Screen name="SIGNUP" component={SignUp} />
      <Stack.Screen name="SIGNUPSECOND" component={SignUpSecond} />
    </Stack.Navigator>
  );
};

export default App;

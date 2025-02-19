import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import UserProfile from './UserProfile';
import Tracking from './Tracking';
import HealthData from './HealthData';
import Relatives from './Relatives';
import YourProfile from './YourProfile';
import EditProfileScreen from './EditProfile';
import ConnectDeviceScreen from './ConnectDeviceScreen';
import PropTypes from 'prop-types';
import RequestScreen from './RequestScreen';
const Tab = createBottomTabNavigator();
const ProfileStack = createNativeStackNavigator();
const ProfileStackScreen = ({setIsAuthenticated}) => {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="UserProfile" options={{headerShown: false}}>
        {props => (
          <UserProfile {...props} setIsAuthenticated={setIsAuthenticated} />
        )}
      </ProfileStack.Screen>
      <ProfileStack.Screen
        name="YourProfile"
        component={YourProfile}
        options={{headerShown: false}}
      />
      <ProfileStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{headerShown: false}}
      />
      <ProfileStack.Screen
        name="ConnectDeviceScreen"
        component={ConnectDeviceScreen}
        options={{headerShown: false}}
      />
    </ProfileStack.Navigator>
  );
};

export default function BottomTab({setIsAuthenticated}) {
  return (
    <Tab.Navigator
      initialRouteName="PROFILESTACK"
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarIcon: ({color, size}) => {
          let iconName;
          if (route.name === 'PROFILESTACK') {
            iconName = 'person';
          } else if (route.name === 'TRACKING') {
            iconName = 'map';
          } else if (route.name === 'HEALTHDATA') {
            iconName = 'heart';
          } else if (route.name === 'RELATIVES') {
            iconName = 'people';
          } else if (route.name === 'REQUEST') {
            iconName = 'person-add';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: {
          backgroundColor: '#f8f8ff',
          height: 65,
          width:370,
          borderTopWidth: 0,
          elevation: 10,
          borderRadius: 35,
          marginHorizontal: 20,
          marginBottom: 20,
          position: 'absolute',
        },
        tabBarActiveTintColor: '#87ceeb',
        tabBarInactiveTintColor: '#bdc3c7',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: 'bold',
          paddingBottom: 5,
          
        },
      })}>
      <Tab.Screen
        name="REQUEST"
        component={RequestScreen}
        options={{tabBarLabel: 'Request'}}
      />
      <Tab.Screen
        name="TRACKING"
        component={Tracking}
        options={{tabBarLabel: 'Tracking'}}
      />
      <Tab.Screen
        name="HEALTHDATA"
        component={HealthData}
        options={{tabBarLabel: 'Health'}}
      />
      <Tab.Screen
        name="RELATIVES"
        component={Relatives}
        options={{tabBarLabel: 'Relatives'}}
      />
      <Tab.Screen name="PROFILESTACK" options={{tabBarLabel: 'Profile'}}>
        {() => <ProfileStackScreen setIsAuthenticated={setIsAuthenticated} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
ProfileStackScreen.propTypes = {
  setIsAuthenticated: PropTypes.func.isRequired,
};
BottomTab.propTypes = {
  setIsAuthenticated: PropTypes.func.isRequired,
};

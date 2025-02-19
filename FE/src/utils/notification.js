import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';

export const listenForNotifications = () => {
  const requestNotificationPermission = async () => {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (enabled) {
      console.log('Notification permission granted.');
    } else {
      console.log('Notification permission denied.');
    }
  };

  requestNotificationPermission();

  messaging().onMessage(async (remoteMessage) => {
    console.log('Received a new notification:', remoteMessage);

    Alert.alert(
      'New Notification',
      remoteMessage.notification?.body || 'You have a new message',
      [{ text: 'OK' }]
    );
  });

  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Notification caused app to open from background:', remoteMessage);
  });
};

// Updated by Claude Sonnet 4.6
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Only set the notification handler in real builds — importing expo-notifications
// in Expo Go triggers a push-token auto-registration that throws since SDK 53.
if (!IS_EXPO_GO) {
  const Notifications = require('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (IS_EXPO_GO) return null;
  if (!Device.isDevice) return null;

  const Notifications = require('expo-notifications');

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      (Constants as any).easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return tokenData.data;
  } catch {
    return null;
  }
}

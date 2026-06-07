import { useEffect } from 'react';
import { Platform } from 'react-native';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { TamaguiProvider, Theme } from 'tamagui';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { API_URL } from '../lib/constants';
import tamaguiConfig from '../tamagui.config';

SplashScreen.preventAutoHideAsync();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function PushTokenRegistrar() {
  const { token, user } = useAuth();

  useEffect(() => {
    if (!token || !user) return;
    if (Platform.OS === 'web') return;

    (async () => {
      if (!Device.isDevice) return;

      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;
      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      const pushToken = (await Notifications.getExpoPushTokenAsync()).data;

      await fetch(`${API_URL}/users/push-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expoPushToken: pushToken }),
      }).catch(() => {});
    })();
  }, [token, user]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter: Inter_400Regular,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    InterExtraBold: Inter_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme="nature">
      <Theme name="nature">
        <SafeAreaProvider>
          <AuthProvider>
            <PushTokenRegistrar />
            <Slot />
            <StatusBar style="dark" />
          </AuthProvider>
        </SafeAreaProvider>
      </Theme>
    </TamaguiProvider>
  );
}

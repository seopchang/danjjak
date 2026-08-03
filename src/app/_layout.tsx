import * as Notifications from 'expo-notifications';
import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { configureNotificationHandler } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth-store';

// 앱이 떠 있는 동안에도 알림 배너를 띄운다. 모듈 로드 시점에 한 번만 걸면 된다.
configureNotificationHandler();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const initAuth = useAuthStore((s) => s.init);

  // Firebase 로그인 상태 복원은 앱 시작 시 한 번만 구독한다.
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 복습 알림을 눌러서 들어오면 바로 복습 화면을 연다.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = response.notification.request.content.data?.screen;
      if (target === 'review') router.push('/review');
    });
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

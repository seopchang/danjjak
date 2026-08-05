import {
  JetBrainsMono_500Medium,
  JetBrainsMono_600SemiBold,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';
import { NanumPenScript_400Regular } from '@expo-google-fonts/nanum-pen-script';
import { NotoSansKR_900Black } from '@expo-google-fonts/noto-sans-kr';
import {
  SpaceGrotesk_500Medium,
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SplashOverlay } from '@/components/splash-overlay';
import { configureNotificationHandler } from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useSplashStore } from '@/stores/splash-store';

// 앱이 떠 있는 동안에도 알림 배너를 띄운다. 모듈 로드 시점에 한 번만 걸면 된다.
configureNotificationHandler();

// 폰트가 준비되기 전에 화면이 보이면 글자가 한 번 튀므로 스플래시를 붙잡아둔다.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const initAuth = useAuthStore((s) => s.init);
  const showSplash = useSplashStore((s) => s.show);

  // Space Grotesk / JetBrains Mono 는 라틴 전용이라 한글은 Pretendard 가 받는다.
  const [fontsLoaded, fontError] = useFonts({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
    JetBrainsMono_500Medium,
    JetBrainsMono_600SemiBold,
    JetBrainsMono_700Bold,
    NanumPenScript_400Regular,
    NotoSansKR_900Black,
    'Pretendard-Regular': require('../../assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Bold': require('../../assets/fonts/Pretendard-Bold.ttf'),
  });

  // Firebase 로그인 상태 복원은 앱 시작 시 한 번만 구독한다.
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  // 앱을 열면 스플래시를 2초 띄운다 (HANDOFF §5.6).
  useEffect(() => {
    showSplash('불러오는 중');
  }, [showSplash]);

  // 복습 알림을 눌러서 들어오면 바로 복습 화면을 연다.
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const target = response.notification.request.content.data?.screen;
      if (target === 'review') router.push('/review');
    });
    return () => subscription.remove();
  }, []);

  // 폰트 로드가 끝났거나 실패했으면 스플래시를 내린다.
  // 실패해도 앱은 시스템 폰트로 그대로 뜨게 둔다.
  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      {/* 라이트 고정 — 시스템이 다크여도 흑백 팔레트를 그대로 쓴다. */}
      <ThemeProvider value={DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }} />
        <SplashOverlay />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * 매일 정해진 시각에 "복습할 단어가 있다"고 알려주는 로컬 알림.
 *
 * 서버 없이 기기 안에서만 도는 스케줄이라 인터넷이나 푸시 토큰이 필요 없다.
 * 다만 Expo Go에서는 동작이 제한되므로 실제 확인은 APK로 해야 한다.
 */

/** 알림이 울릴 시각 — 밤 12시(자정) */
export const REVIEW_HOUR = 0;
export const REVIEW_MINUTE = 0;

/** 예약을 갈아끼울 때 기존 것을 찾기 위한 표식 */
const DAILY_REVIEW_ID = 'daily-review';
const ANDROID_CHANNEL_ID = 'daily-review';

/** 앱이 떠 있는 동안 알림이 와도 배너를 띄운다. */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 알림 권한을 확인하고, 아직 답한 적이 없으면 물어본다.
 * 이미 거절한 사용자에게 다시 묻지는 않는다(시스템이 무시한다).
 */
export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;

  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** 안드로이드는 채널이 있어야 알림이 표시된다. */
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: '매일 복습 알림',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });
}

/**
 * 매일 복습 알림을 예약한다. 이미 예약돼 있으면 지우고 다시 건다
 * (같은 알림이 여러 개 쌓이는 것을 막기 위함).
 *
 * @returns 예약에 성공했으면 true. 권한이 없으면 false.
 */
export async function scheduleDailyReviewReminder(): Promise<boolean> {
  const allowed = await ensureNotificationPermission();
  if (!allowed) return false;

  await ensureAndroidChannel();
  await cancelDailyReviewReminder();

  await Notifications.scheduleNotificationAsync({
    identifier: DAILY_REVIEW_ID,
    content: {
      title: '오늘의 복습',
      body: '외운 단어를 복습할 시간입니다. 눌러서 바로 시작하세요.',
      data: { screen: 'review' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: REVIEW_HOUR,
      minute: REVIEW_MINUTE,
      channelId: ANDROID_CHANNEL_ID,
    },
  });

  return true;
}

export async function cancelDailyReviewReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(DAILY_REVIEW_ID).catch(() => {
    // 예약된 적이 없으면 그냥 넘어간다.
  });
}

/** 설정 화면에서 현재 예약 상태를 보여주기 위해 쓴다. */
export async function isDailyReviewScheduled(): Promise<boolean> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  return scheduled.some((n) => n.identifier === DAILY_REVIEW_ID);
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * 기기별 앱 설정. 동기화 대상이 아니다.
 * (알림은 기기마다 따로 켜고 끄는 게 자연스럽다)
 */
interface SettingsState {
  /** 매일 복습 알림을 켰는지 */
  reviewReminderEnabled: boolean;
  setReviewReminderEnabled: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      reviewReminderEnabled: false,
      setReviewReminderEnabled: (enabled) => set({ reviewReminderEnabled: enabled }),
    }),
    {
      name: 'vocadeck-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

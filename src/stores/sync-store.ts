import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { syncNow } from '@/lib/sync';

interface SyncState {
  /** 마지막으로 동기화에 성공한 시각(ISO). null이면 아직 한 번도 안 함. */
  lastSyncedAt: string | null;
  syncing: boolean;
  lastError: string | null;
  lastSummary: string | null;
  run: (uid: string) => Promise<void>;
  /** 계정이 바뀌면 동기화 기준점을 초기화해 전체를 다시 받아온다. */
  reset: () => void;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      lastSyncedAt: null,
      syncing: false,
      lastError: null,
      lastSummary: null,

      run: async (uid) => {
        if (get().syncing) return;
        set({ syncing: true, lastError: null });
        try {
          const result = await syncNow(uid, get().lastSyncedAt);
          set({
            syncing: false,
            lastSyncedAt: result.syncedAt,
            lastSummary: `받음 ${result.pulled} · 보냄 ${result.pushed}`,
          });
        } catch (e) {
          const message = e instanceof Error ? e.message : String(e);
          set({ syncing: false, lastError: message });
        }
      },

      reset: () => set({ lastSyncedAt: null, lastSummary: null, lastError: null }),
    }),
    {
      name: 'vocadeck-sync',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ lastSyncedAt: state.lastSyncedAt }),
    }
  )
);

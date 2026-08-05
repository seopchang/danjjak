import { create } from 'zustand';

/**
 * 스플래시 오버레이 상태 (HANDOFF §5.6).
 *
 * 앱을 열 때와 동기화 바를 탭할 때 2초간 전체 화면을 덮는다.
 * 저장할 값이 아니라 화면 상태라 persist 하지 않는다.
 */
interface SplashState {
  /** null 이면 떠 있지 않다 */
  label: string | null;
  show: (label: string) => void;
  hide: () => void;
}

export const useSplashStore = create<SplashState>((set) => ({
  label: null,
  show: (label) => set({ label }),
  hide: () => set({ label: null }),
}));

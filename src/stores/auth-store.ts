// firebase.ts와 같은 모듈 인스턴스를 쓰기 위해 여기서도 '@firebase/auth'에서 가져온다.
// (한쪽만 'firebase/auth'를 쓰면 Auth 인스턴스가 서로 달라질 수 있다)
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@firebase/auth';
import { create } from 'zustand';

import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebase';

interface AuthState {
  /** Firebase가 아직 로그인 상태를 복원 중이면 true */
  initializing: boolean;
  uid: string | null;
  email: string | null;
  error: string | null;
  busy: boolean;
  init: () => void;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  logOut: () => Promise<void>;
  clearError: () => void;
}

/** Firebase 오류 코드를 사용자에게 보여줄 한국어 문구로 바꾼다. */
function toKoreanMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.';
    case 'auth/missing-password':
      return '비밀번호를 입력해주세요.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다. 로그인해주세요.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/network-request-failed':
      return '네트워크에 연결할 수 없습니다. 인터넷을 확인해주세요.';
    case 'auth/too-many-requests':
      return '시도가 너무 많습니다. 잠시 후 다시 시도해주세요.';
    default:
      return `로그인에 실패했습니다. (${code})`;
  }
}

function errorCodeOf(e: unknown): string {
  if (typeof e === 'object' && e !== null && 'code' in e) {
    return String((e as { code: unknown }).code);
  }
  return 'unknown';
}

let unsubscribe: (() => void) | null = null;

export const useAuthStore = create<AuthState>()((set) => ({
  initializing: true,
  uid: null,
  email: null,
  error: null,
  busy: false,

  init: () => {
    if (!isFirebaseConfigured()) {
      // 로컬 전용 모드: 로그인 없이 단어장만 사용한다.
      set({ initializing: false });
      return;
    }
    if (unsubscribe) return;
    unsubscribe = onAuthStateChanged(getFirebaseAuth(), (user) => {
      set({
        uid: user?.uid ?? null,
        email: user?.email ?? null,
        initializing: false,
      });
    });
  },

  signIn: async (email, password) => {
    set({ busy: true, error: null });
    try {
      await signInWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      set({ busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: toKoreanMessage(errorCodeOf(e)) });
      return false;
    }
  },

  signUp: async (email, password) => {
    set({ busy: true, error: null });
    try {
      await createUserWithEmailAndPassword(getFirebaseAuth(), email.trim(), password);
      set({ busy: false });
      return true;
    } catch (e) {
      set({ busy: false, error: toKoreanMessage(errorCodeOf(e)) });
      return false;
    }
  },

  logOut: async () => {
    if (!isFirebaseConfigured()) return;
    await signOut(getFirebaseAuth());
  },

  clearError: () => set({ error: null }),
}));

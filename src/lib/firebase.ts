import AsyncStorage from '@react-native-async-storage/async-storage';
// 주의: 'firebase/auth'(우산 패키지)가 아니라 '@firebase/auth'에서 직접 가져온다.
// 우산 패키지의 export map에는 "react-native" 조건이 없어서 Metro가 웹 빌드를
// 골라버리고, 그러면 React Native 전용인 getReactNativePersistence가 없어
// 앱 시작과 동시에 "is not a function"으로 죽는다.
// '@firebase/auth'는 "react-native" 조건과 레거시 필드를 모두 갖고 있어
// dist/rn 빌드로 정확히 해석된다. (자세한 경위는 AGENTS.md 참고)
import {
  Auth,
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from '@firebase/auth';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';

/**
 * Firebase 설정은 .env의 EXPO_PUBLIC_* 값에서 읽는다.
 * (웹 SDK config는 비밀값이 아니라 클라이언트 번들에 어차피 포함된다.
 *  실제 보호는 Firestore 보안 규칙이 담당한다 — firestore.rules 참고)
 *
 * 설정이 비어 있으면 앱은 "로컬 전용 모드"로 동작한다. 단어장은 정상적으로
 * 쓸 수 있고 동기화 버튼만 비활성화된다.
 */
/** .env 에서 읽은 원본. 진단 화면이 CI 오염을 눈으로 확인하는 데 쓴다. */
const rawConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

/**
 * 값 끝의 줄바꿈 하나가 로그인을 통째로 막는다.
 *
 * CI 가 GitHub Secrets 로 .env 를 만들 때 시크릿에 딸려 있던 줄바꿈이 그대로 들어온다.
 * 그 상태의 `appId` 는 로그인 요청에 `X-Firebase-gmpid` 헤더로 실려 나가는데,
 * 헤더 값에 CR/LF 가 있으면 안드로이드 네트워크 계층이 예외를 던진다.
 * Firebase 는 fetch 가 던진 예외를 종류 불문 `auth/network-request-failed` 하나로
 * 뭉뚱그리기 때문에, 겉으로는 "인터넷이 안 된다"처럼 보인다.
 *
 * 웹은 손으로 만든 .env 를 써서 멀쩡했고 APK 만 막혔던 실제 원인이다 (PROGRESS 4-2).
 * 시크릿을 다시 넣어 고쳤지만, 같은 실수가 또 나와도 앱이 버티도록 여기서 한 번 더 다듬는다.
 */
const firebaseConfig = {
  apiKey: rawConfig.apiKey.trim(),
  authDomain: rawConfig.authDomain.trim(),
  projectId: rawConfig.projectId.trim(),
  storageBucket: rawConfig.storageBucket.trim(),
  messagingSenderId: rawConfig.messagingSenderId.trim(),
  appId: rawConfig.appId.trim(),
};

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

/**
 * APK는 CI가 GitHub Secrets로 .env를 만들어 넣기 때문에, 값에 공백이나 줄바꿈이
 * 섞여 들어와도 빌드는 성공하고 앱만 조용히 실패한다. 그 경우를 폰 화면에서
 * 눈으로 확인하려고 노출한다. (웹 SDK config는 비밀값이 아니다 — 위 주석 참고)
 *
 * 다듬기 전 원본을 돌려준다. 앱은 다듬은 값으로 동작하므로 오염이 있어도 이제
 * 로그인은 되지만, 시크릿이 더러워졌다는 사실 자체는 계속 보여야 고칠 수 있다.
 */
export function getFirebaseConfigSnapshot(): Readonly<Record<string, string>> {
  return { ...rawConfig };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

/**
 * React Native에서는 getAuth() 대신 initializeAuth()로 AsyncStorage 퍼시스턴스를
 * 명시해야 앱을 껐다 켜도 로그인이 유지된다.
 *
 * 다만 번들러가 Firebase의 웹 빌드를 골라버리면 getReactNativePersistence 자체가
 * 존재하지 않는다(metro.config.js에서 막고 있지만 환경에 따라 또 어긋날 수 있다).
 * 그 경우에도 앱이 죽지 않도록 기본 인스턴스로 물러난다.
 * 물러난 경우 로그인 상태가 앱 재시작 시 유지되지 않을 뿐, 나머지는 정상 동작한다.
 */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;

  const app = getFirebaseApp();
  if (typeof getReactNativePersistence === 'function') {
    try {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
      return auth;
    } catch {
      // 이미 initializeAuth가 호출된 경우 등 — 아래 기본 인스턴스로 처리한다.
    }
  } else if (__DEV__) {
    console.warn(
      '[firebase] getReactNativePersistence를 찾지 못했습니다. ' +
        '로그인 상태가 앱 재시작 시 유지되지 않습니다.'
    );
  }

  auth = getAuth(app);
  return auth;
}

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
  }
  return db;
}

/**
 * Firebase 설정용 환경변수 타입 선언.
 *
 * Expo가 만들어주는 expo-env.d.ts에도 process.env 타입이 들어있지만,
 * 그 파일은 expo-cli가 .gitignore에 넣기 때문에 새로 clone한 직후에는 없다.
 * (= `npm install` 후 개발 서버를 켜기 전에 `npx tsc --noEmit`을 돌리면 깨진다)
 *
 * 그래서 이 프로젝트가 실제로 읽는 값들은 여기에 직접 선언해 커밋한다.
 */
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_FIREBASE_API_KEY?: string;
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
      EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
      EXPO_PUBLIC_FIREBASE_APP_ID?: string;
    }
  }
}

export {};

/**
 * Firebase JS SDK는 React Native 전용 `getReactNativePersistence`를
 * `@firebase/auth`의 "react-native" export 조건에서만 내보낸다.
 * 그런데 export map의 "types" 조건이 먼저 매칭되는 탓에 TypeScript는
 * 웹용 타입(auth-public.d.ts)만 보게 되어 이 함수를 찾지 못한다.
 * (런타임에는 Metro가 "react-native" 조건으로 해석하므로 정상 동작한다.)
 *
 * 그래서 타입만 여기서 보강한다.
 */
import 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

/**
 * `getReactNativePersistence`는 `@firebase/auth`의 "react-native" export 조건에만
 * 들어있는데, export map에서 "types" 조건이 먼저 매칭되는 탓에 TypeScript는
 * 웹용 타입(auth-public.d.ts)만 보게 되어 이 함수를 찾지 못한다.
 * 런타임에는 Metro가 dist/rn 빌드로 올바르게 해석하므로, 타입만 여기서 보강한다.
 */
import '@firebase/auth';

declare module '@firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}

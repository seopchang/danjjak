# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

특히 인증 관련해서 이미 확인된 사실:

- `expo-auth-session`에 **`providers/google` 모듈은 SDK 57에 없다.**
- 공식 권장 구글 로그인 라이브러리(`@react-native-google-signin/google-signin`,
  `react-native-nitro-google-signin`)는 **Expo Go에서 동작하지 않는다** (네이티브 코드 필요).
- 예전 우회로였던 Expo 인증 프록시(`auth.expo.io`)는 폐지됐다.

그래서 이 프로젝트는 **Firebase JS SDK + 이메일/비밀번호 인증**을 쓴다. Expo Go 미리보기를
유지하기 위한 의도적인 선택이므로, 구글 로그인으로 바꾸려면 개발 빌드 전환을 먼저 논의할 것.

## TypeScript 주의사항

`getReactNativePersistence`는 `@firebase/auth`의 `react-native` export 조건에만 있는데,
export map의 `types` 조건이 먼저 매칭되는 탓에 TypeScript가 찾지 못한다. 런타임에는 Metro가
올바르게 해석하므로 `src/types/firebase-auth.d.ts`에서 타입만 보강해두었다. 이 파일을 지우면
`npx tsc --noEmit`이 깨진다.

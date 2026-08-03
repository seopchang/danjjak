const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

/**
 * Firebase JS SDK를 React Native 빌드로 해석하도록 조건을 명시한다.
 *
 * @firebase/auth의 package.json exports는 조건을 이 순서로 나열한다:
 *   types → node → react-native → cordova → webworker → browser → default
 * 여기서 "react-native"가 활성 조건에 없으면 "browser"나 "default"가 먼저 걸려
 * 웹 빌드(dist/esm)가 선택되고, 그러면 React Native 전용인
 * getReactNativePersistence가 존재하지 않아 앱이 시작하자마자 죽는다.
 */
config.resolver.unstable_enablePackageExports = true;
config.resolver.unstable_conditionNames = ['react-native', 'require', 'import', 'default'];

module.exports = config;

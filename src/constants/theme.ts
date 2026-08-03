/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// 블랙&화이트 기반 미니멀 팔레트. 유채색은 즐겨찾기 별(노랑) 하나만 사용한다.
export const Colors = {
  light: {
    text: '#111111',
    background: '#FFFFFF',
    backgroundElement: '#F4F4F4',
    backgroundSelected: '#E7E7E7',
    textSecondary: '#6B6B6B',
    border: '#E2E2E2',
    card: '#FFFFFF',
    primary: '#111111',
    primaryText: '#FFFFFF',
    danger: '#3D3D3D',
    success: '#111111',
    favorite: '#F5B301',
    placeholder: '#A3A3A3',
  },
  dark: {
    text: '#F4F4F4',
    background: '#0B0B0B',
    backgroundElement: '#1C1C1C',
    backgroundSelected: '#2A2A2A',
    textSecondary: '#A0A0A0',
    border: '#2E2E2E',
    card: '#141414',
    primary: '#F4F4F4',
    primaryText: '#0B0B0B',
    danger: '#C9C9C9',
    success: '#F4F4F4',
    favorite: '#F7C334',
    placeholder: '#6E6E6E',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

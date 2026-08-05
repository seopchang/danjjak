import { StyleSheet, Text, type TextProps } from 'react-native';

import { Type, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/**
 * 디자인 스펙 1.3 타이포 스케일의 역할 이름을 그대로 쓴다.
 * 한글이 섞일 수 있는 역할은 Pretendard, 라틴/숫자 전용 역할만
 * Space Grotesk / JetBrains Mono 로 간다.
 */
export type TextRole =
  | 'appTitle'
  | 'screenTitle'
  | 'sectionHeading'
  | 'rowTitle'
  | 'term'
  | 'question'
  | 'bigNumber'
  | 'statValue'
  | 'labelLatin'
  | 'labelKo'
  | 'meta'
  | 'metaSemi'
  | 'button'
  | 'body'
  | 'bodyBold'
  | 'caption'
  | 'noteNumber'
  | 'noteTerm'
  | 'noteMeaning'
  | 'logoLarge'
  | 'logoSmall';

export type ThemedTextProps = TextProps & {
  type?: TextRole;
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'body', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? 'text'] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  appTitle: Type.appTitle,
  screenTitle: Type.screenTitle,
  sectionHeading: Type.sectionHeading,
  rowTitle: Type.rowTitle,
  term: Type.term,
  question: { ...Type.question, lineHeight: 30 },
  bigNumber: Type.bigNumber,
  statValue: Type.statValue,
  labelLatin: Type.labelLatin,
  labelKo: Type.labelKo,
  meta: Type.meta,
  metaSemi: Type.metaSemi,
  button: Type.button,
  body: { ...Type.body, lineHeight: 20 },
  bodyBold: { ...Type.bodyBold, lineHeight: 20 },
  caption: { ...Type.caption, lineHeight: 19 },
  noteNumber: Type.noteNumber,
  noteTerm: Type.noteTerm,
  noteMeaning: Type.noteMeaning,
  logoLarge: Type.logoLarge,
  logoSmall: Type.logoSmall,
});

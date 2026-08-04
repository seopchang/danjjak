import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { Border, FontFamily } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TextFieldProps extends TextInputProps {
  /**
   * 주요 입력(단어, 뜻)은 2px 밑줄, 보조 입력(검색, 태그)은 1px 밑줄.
   * 스펙 2.4.
   */
  emphasis?: 'primary' | 'secondary';
}

/** 박스형 입력을 밑줄형으로 바꾼 것. 배경과 테두리는 없다. */
export function TextField({ emphasis = 'primary', style, ...props }: TextFieldProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.textTertiary}
      style={[
        styles.base,
        {
          color: theme.ink,
          borderBottomColor: theme.ink,
          borderBottomWidth: emphasis === 'primary' ? Border.strong : Border.hair,
        },
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily.korean,
    fontSize: 15,
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 10,
    backgroundColor: 'transparent',
  },
});

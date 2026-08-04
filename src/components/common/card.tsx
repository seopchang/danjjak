import { PropsWithChildren } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

import { Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type CardVariant = 'framed' | 'row';

/**
 * 카드형(둥근 모서리 + 배경 + 그림자)을 없애고 선 기반으로 바꾼 것.
 * - framed: 2px 잉크 테두리로 감싼 강조 블록
 * - row: 배경/테두리 없이 아래쪽 1px 구분선만 있는 목록 행 (기본)
 */
export function Card({
  children,
  variant = 'row',
  style,
}: PropsWithChildren<{ variant?: CardVariant; style?: ViewStyle }>) {
  const theme = useTheme();

  return (
    <View
      style={[
        variant === 'framed'
          ? [styles.framed, { borderColor: theme.ink }]
          : [styles.row, { borderBottomColor: theme.line }],
        style,
      ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  framed: {
    borderWidth: Border.strong,
    borderRadius: 0,
    padding: 20,
    gap: 12,
  },
  row: {
    paddingVertical: 16,
    borderBottomWidth: Border.hair,
    borderRadius: 0,
    gap: 8,
  },
});

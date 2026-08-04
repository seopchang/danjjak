import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** 라틴 라벨이면 대문자로 변환한다. 한글 라벨에는 의미가 없어 기본은 false. */
  latin?: boolean;
}

export function Chip({ label, selected, onPress, latin }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        {
          backgroundColor: selected ? theme.ink : theme.surface,
          borderColor: theme.ink,
        },
      ]}>
      <ThemedText
        type={latin ? 'labelLatin' : 'labelKo'}
        style={[styles.label, { color: selected ? theme.onInk : theme.ink }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: Border.hair,
    borderRadius: 0,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

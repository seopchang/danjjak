import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** `secondary` 는 리뉴얼 이전 이름 — `outline` 과 같다. */
type Variant = 'primary' | 'outline' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  style?: ViewStyle;
}

export function Button({ label, onPress, variant = 'primary', icon, disabled, style }: ButtonProps) {
  const theme = useTheme();
  const isOutline = variant === 'outline' || variant === 'secondary';

  const background =
    variant === 'primary' ? theme.ink : variant === 'danger' ? theme.inkMuted : 'transparent';
  const borderColor =
    variant === 'primary' ? theme.ink : variant === 'danger' ? theme.inkMuted : theme.ink;
  const textColor =
    variant === 'primary' || variant === 'danger'
      ? theme.onInk
      : variant === 'ghost'
        ? theme.textSecondary
        : theme.ink;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'ghost' ? styles.ghost : { backgroundColor: background, borderColor },
        // 비활성은 색을 바꾸지 않고 투명도만 낮춘다 (스펙 2.1)
        { opacity: disabled ? 0.35 : pressed ? 0.7 : 1 },
        style,
      ]}>
      {icon ? <Ionicons name={icon} size={16} color={textColor} /> : null}
      <ThemedText
        type={variant === 'ghost' ? 'caption' : 'button'}
        style={[{ color: textColor }, variant === 'ghost' && styles.ghostLabel]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderWidth: Border.strong,
    borderRadius: 0,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    paddingVertical: 8,
  },
  ghostLabel: {
    textDecorationLine: 'underline',
  },
});

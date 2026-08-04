import { Pressable, StyleSheet, View } from 'react-native';

import { Border, Colors } from '@/constants/theme';

const theme = Colors.light;

interface SquareSwitchProps {
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
}

/**
 * 기본 Switch 는 알약 모양이라 선 기반 디자인과 맞지 않는다.
 * 트랙과 손잡이를 모두 사각형으로 직접 그린 토글 (스펙 2.7).
 */
export function SquareSwitch({ value, onValueChange, disabled }: SquareSwitchProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      style={[
        styles.track,
        { backgroundColor: value ? theme.ink : theme.background },
        disabled && styles.disabled,
      ]}>
      <View style={[styles.knob, { left: value ? 20 : 2 }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 44,
    height: 24,
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
  },
  knob: {
    position: 'absolute',
    top: 2,
    width: 16,
    height: 16,
    backgroundColor: theme.background,
    borderWidth: Border.hair,
    borderColor: theme.ink,
    borderRadius: 0,
  },
  disabled: {
    opacity: 0.35,
  },
});

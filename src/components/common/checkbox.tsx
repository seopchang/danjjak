import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Border } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

/** 18x18 정사각. 둥근 모서리 없이 2px 잉크 테두리, 체크 시 잉크로 채운다. */
export function Checkbox({ checked, onPress, size = 18 }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={10}>
      <View
        style={[
          styles.box,
          {
            width: size,
            height: size,
            borderColor: theme.ink,
            backgroundColor: checked ? theme.ink : 'transparent',
          },
        ]}>
        {checked ? (
          <Ionicons name="checkmark" size={size - 6} color={theme.onInk} />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    borderWidth: Border.strong,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

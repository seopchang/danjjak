import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

interface CheckboxProps {
  checked: boolean;
  onPress: () => void;
  size?: number;
}

export function Checkbox({ checked, onPress, size = 22 }: CheckboxProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={8} style={styles.base}>
      <Ionicons
        name={checked ? 'checkbox' : 'square-outline'}
        size={size}
        color={checked ? theme.primary : theme.textSecondary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

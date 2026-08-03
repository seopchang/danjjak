import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemeColor } from '@/constants/theme';

interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  color?: ThemeColor;
  hitSlop?: number;
}

export function IconButton({ name, onPress, size = 22, color = 'text', hitSlop = 8 }: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      hitSlop={hitSlop}
      style={({ pressed }) => [styles.base, { opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={name} size={size} color={theme[color]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
});

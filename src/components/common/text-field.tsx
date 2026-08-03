import { StyleSheet, TextInput, TextInputProps } from 'react-native';

import { useTheme } from '@/hooks/use-theme';

export function TextField(props: TextInputProps) {
  const theme = useTheme();

  return (
    <TextInput
      placeholderTextColor={theme.placeholder}
      style={[
        styles.base,
        { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
        props.style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
});

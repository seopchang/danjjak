import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Layout, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// 패드처럼 넓은 화면에서는 콘텐츠를 MaxContentWidth로 제한해 가운데 정렬한다.
export function Screen({ children }: PropsWithChildren) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAwareScrollView
      style={[styles.flex, { backgroundColor: theme.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + Layout.screenPaddingTop,
          paddingBottom: insets.bottom + Layout.screenPaddingBottom,
        },
      ]}
      enableOnAndroid
      extraScrollHeight={24}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>
      <View style={styles.inner}>{children}</View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Layout.screenPaddingH,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
});

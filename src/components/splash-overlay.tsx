import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { WALKING_DOG } from '@/stores/character-store';
import { useSplashStore } from '@/stores/splash-store';

const theme = Colors.light;

/** 전체 표시 시간 */
const TOTAL_MS = 2000;
/** 마지막 30% 구간에서 사라진다 */
const FADE_MS = TOTAL_MS * 0.3;
/** 한쪽 끝에서 반대쪽 끝까지 */
const WALK_MS = 1100;
const WALK_X = 110;

/**
 * 앱 시작 / 동기화 중 스플래시 (HANDOFF §5.6).
 * 바닥선 위를 강아지가 좌우로 걸어다니고, 방향 전환은 즉시 뒤집힌다.
 */
export function SplashOverlay() {
  const label = useSplashStore((s) => s.label);
  const hide = useSplashStore((s) => s.hide);

  const opacity = useSharedValue(1);
  const walk = useSharedValue(-WALK_X);
  const facing = useSharedValue(1);

  useEffect(() => {
    if (!label) return;

    opacity.value = 1;
    walk.value = -WALK_X;
    facing.value = 1;

    walk.value = withRepeat(
      withTiming(WALK_X, { duration: WALK_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    // 끝에 닿는 순간 즉시 뒤집는다 (step-end).
    const flip = setInterval(() => {
      facing.value = facing.value * -1;
    }, WALK_MS);

    const fade = setTimeout(() => {
      opacity.value = withTiming(0, { duration: FADE_MS, easing: Easing.out(Easing.ease) });
    }, TOTAL_MS - FADE_MS);
    const done = setTimeout(hide, TOTAL_MS);

    return () => {
      clearInterval(flip);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [label, hide, opacity, walk, facing]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const dogStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: walk.value }, { scaleX: facing.value }],
  }));

  if (!label) return null;

  return (
    <Animated.View style={[styles.overlay, overlayStyle]} pointerEvents="auto">
      <View style={styles.logo}>
        <ThemedText type="logoLarge">단</ThemedText>
        <ThemedText type="logoSmall">어</ThemedText>
        <ThemedText type="logoLarge">짝</ThemedText>
        <ThemedText type="logoSmall">꿍</ThemedText>
      </View>

      <View style={styles.stage}>
        <Animated.Image
          source={WALKING_DOG}
          style={[styles.dog, dogStyle]}
          resizeMode="contain"
        />
        <View style={styles.ground} />
      </View>

      <ThemedText type="labelKo" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    zIndex: 10,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  stage: {
    width: 260,
    height: 96,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dog: {
    width: 84,
    height: 84,
  },
  ground: {
    width: '100%',
    borderBottomWidth: Border.strong,
    borderBottomColor: theme.ink,
  },
  label: {
    fontSize: 12,
    letterSpacing: 0.8,
  },
});

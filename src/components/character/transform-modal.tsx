import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { STAGES } from '@/stores/character-store';
import { withSubject } from '@/utils/particle';

const theme = Colors.light;

/** 1단계(회전)를 얼마나 보여줄지 */
const SPIN_MS = 1450;
/** 등장 튀어오르기 */
const BURST_MS = 760;

interface TransformModalProps {
  visible: boolean;
  /** 자라기 전 단계 인덱스 */
  fromStage: number;
  /** 자란 뒤 단계 인덱스 */
  toStage: number;
  name: string;
  onClose: () => void;
}

/**
 * 변신(레벨업) 연출 (HANDOFF-character-update §3).
 *
 * 1단계: 이전 단계 강아지가 뱅글뱅글 돌고 모달이 들썩인다.
 * 2단계: 다음 단계 강아지가 폭죽과 함께 튀어나온다.
 */
export function TransformModal({
  visible,
  fromStage,
  toStage,
  name,
  onClose,
}: TransformModalProps) {
  const [phase, setPhase] = useState<'spin' | 'reveal'>('spin');

  const spin = useSharedValue(0);
  const wobble = useSharedValue(0);
  const rise = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;

    setPhase('spin');
    spin.value = 0;
    rise.value = 0;
    spin.value = withRepeat(withTiming(1, { duration: SPIN_MS, easing: Easing.linear }), -1, false);
    wobble.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    const toReveal = setTimeout(() => {
      setPhase('reveal');
      rise.value = withTiming(1, { duration: BURST_MS, easing: Easing.out(Easing.cubic) });
    }, SPIN_MS);

    return () => clearTimeout(toReveal);
  }, [visible, spin, wobble, rise]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${interpolate(spin.value, [0, 0.5, 1], [0, 720, 1440])}deg` },
      { scale: interpolate(spin.value, [0, 0.5, 1], [1, 0.62, 1]) },
    ],
  }));

  const wobbleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(wobble.value, [0, 1], [0, -8]) },
      { rotate: `${interpolate(wobble.value, [0, 1], [-3, 3])}deg` },
    ],
  }));

  const riseStyle = useAnimatedStyle(() => ({
    opacity: interpolate(rise.value, [0, 0.45, 1], [0, 1, 1], 'clamp'),
    transform: [
      { scale: interpolate(rise.value, [0, 0.45, 0.7, 0.85, 1], [0.4, 1.35, 0.92, 1.08, 1]) },
      {
        rotate: `${interpolate(rise.value, [0, 0.45, 0.7, 0.85, 1], [-180, 20, -8, 4, 0])}deg`,
      },
    ],
  }));

  const spinning = phase === 'spin';
  const stage = STAGES[toStage];
  const isLast = toStage >= STAGES.length - 1;

  return (
    <Modal visible={visible} transparent={false} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.box, spinning ? wobbleStyle : undefined]}>
          <ThemedText type="labelKo" themeColor="textSecondary" style={styles.label}>
            {spinning ? '변신 중' : '변신 완료'}
          </ThemedText>

          <View style={styles.stage}>
            {spinning ? (
              <Animated.Image
                source={STAGES[fromStage]?.image}
                style={[styles.dogSmall, spinStyle]}
                resizeMode="contain"
              />
            ) : (
              <>
                <Fireworks />
                <Animated.Image
                  source={stage?.image}
                  style={[styles.dogLarge, riseStyle]}
                  resizeMode="contain"
                />
              </>
            )}
          </View>

          {/* 이름이 들어가 길어지므로 어절 단위로 끊는다 (§5) */}
          <ThemedText type="sectionHeading" style={styles.title}>
            {spinning
              ? `${withSubject(name || '단짝이')} 뱅글뱅글`
              : `${withSubject(name || '단짝이')} ${stage?.name}가 됐어요`}
          </ThemedText>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.subtitle}>
            {spinning
              ? '어지러울 것 같지만 괜찮대요.'
              : isLast
                ? '마지막 단계까지 함께 왔어요.'
                : '더 자라려면 단어를 더 모아주세요.'}
          </ThemedText>

          <Pressable
            onPress={onClose}
            disabled={spinning}
            style={[styles.button, spinning && styles.buttonDisabled]}>
            <ThemedText type="button" style={{ color: theme.onInk }}>
              {spinning ? '도는 중…' : '보러 가기'}
            </ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** 12개 방사형 선의 지연 순환값 (초) */
const RAY_DELAYS = [60, 95, 130, 165];

/**
 * 폭죽. 원 3개 + 방사형 선 12개 + 떠오르는 점 3개.
 *
 * 등장 단계에서만 마운트되므로 각 조각이 자기 useEffect 로 한 번씩만 재생된다.
 * 여기 원들은 앱에서 borderRadius 를 쓰는 예외다 (스펙이 border-radius:50% 로 지정).
 */
function Fireworks() {
  return (
    <View style={styles.fireworks} pointerEvents="none">
      <Ring delay={0} duration={800} width={2} />
      <Ring delay={140} duration={800} width={1} />
      <Ring delay={60} duration={1000} width={1} dashed />

      {Array.from({ length: 12 }, (_, i) => (
        <Ray key={i} angle={i * 30} delay={RAY_DELAYS[i % RAY_DELAYS.length]} long={i % 2 === 0} />
      ))}

      <Dust left="32%" top="50%" size={5} hollow duration={1100} delay={180} />
      <Dust left="68%" top="56%" size={4} hollow duration={1200} delay={320} />
      <Dust left="50%" top="42%" size={3} duration={1000} delay={450} />
    </View>
  );
}

function Ring({
  delay,
  duration,
  width,
  dashed,
}: {
  delay: number;
  duration: number;
  width: number;
  dashed?: boolean;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.bezier(0.25, 0.8, 0.4, 1) }));
  }, [p, delay, duration]);

  const style = useAnimatedStyle(() =>
    dashed
      ? {
          opacity: interpolate(p.value, [0, 0.3, 1], [0, 0.5, 0]),
          transform: [
            { scale: interpolate(p.value, [0, 1], [0.5, 1.95]) },
            { rotate: `${interpolate(p.value, [0, 1], [0, 26])}deg` },
          ],
        }
      : {
          opacity: interpolate(p.value, [0, 0.25, 1], [0, 0.9, 0]),
          transform: [{ scale: interpolate(p.value, [0, 1], [0.35, 1.55]) }],
        }
  );

  return (
    <Animated.View
      style={[
        styles.ring,
        { borderWidth: width, borderStyle: dashed ? 'dashed' : 'solid' },
        style,
      ]}
    />
  );
}

function Ray({ angle, delay, long }: { angle: number; delay: number; long: boolean }) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(
      delay,
      withTiming(1, { duration: 720, easing: Easing.bezier(0.2, 0.7, 0.3, 1) })
    );
  }, [p, delay]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.22, 1], [0, 1, 0]),
    // rotate 를 먼저 걸어야 translateY 가 그 방향으로 뻗어나간다.
    transform: [
      { rotate: `${angle}deg` },
      { translateY: interpolate(p.value, [0, 1], [-14, -78]) },
      { scale: interpolate(p.value, [0, 1], [0.4, 1]) },
    ],
  }));

  return <Animated.View style={[styles.ray, long ? styles.rayLong : styles.rayShort, style]} />;
}

function Dust({
  left,
  top,
  size,
  hollow,
  duration,
  delay,
}: {
  left: string;
  top: string;
  size: number;
  hollow?: boolean;
  duration: number;
  delay: number;
}) {
  const p = useSharedValue(0);

  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing: Easing.out(Easing.ease) }));
  }, [p, delay, duration]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.3, 1], [0, 0.85, 0]),
    transform: [
      { translateY: interpolate(p.value, [0, 1], [0, -44]) },
      { scale: interpolate(p.value, [0, 1], [0.5, 1]) },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.dust,
        {
          left: left as unknown as number,
          top: top as unknown as number,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: hollow ? 1.5 : 0,
          backgroundColor: hollow ? 'transparent' : theme.ink,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  box: {
    width: '100%',
    maxWidth: 340,
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    backgroundColor: theme.background,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 14,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1,
  },
  stage: {
    width: 190,
    height: 190,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dogSmall: {
    width: 130,
    height: 130,
  },
  dogLarge: {
    width: 170,
    height: 170,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    alignSelf: 'stretch',
    marginTop: 4,
    backgroundColor: theme.ink,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.35,
  },

  fireworks: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderColor: theme.ink,
    // 폭죽 원은 스펙이 명시한 borderRadius 예외다.
    borderRadius: 95,
  },
  ray: {
    position: 'absolute',
    width: 2,
    marginLeft: -1,
    backgroundColor: theme.ink,
  },
  rayLong: {
    height: 18,
    marginTop: -9,
  },
  rayShort: {
    height: 10,
    marginTop: -5,
  },
  dust: {
    position: 'absolute',
    borderColor: theme.ink,
  },
});

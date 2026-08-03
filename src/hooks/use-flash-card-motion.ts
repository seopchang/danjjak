import { useEffect } from 'react';
import { useWindowDimensions } from 'react-native';
import { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
// Reanimated 4에서 runOnJS는 worklets 패키지의 scheduleOnRN으로 옮겨졌다.
import { scheduleOnRN } from 'react-native-worklets';

/** 카드가 화면 밖으로 빠지는 시간 / 다음 카드가 들어오는 시간 (ms) */
const EXIT_MS = 170;
const ENTER_MS = 260;

/** 아는 단어는 왼쪽으로, 모르는 단어는 오른쪽으로 밀려난다. */
export type SlideDirection = -1 | 1;

/**
 * 단어 카드의 전환 모션을 담당한다.
 *
 * - `slideOut`: 현재 카드를 옆으로 밀어내고, 다 빠진 뒤 콜백을 부른다.
 *   콜백 안에서 채점·인덱스 증가 같은 상태 변경을 하면 된다.
 * - `slideIn`: 다음 카드를 반대쪽에서 끌어온다. 보통 `slideOut` 콜백 끝에서 부른다.
 * - `settle`: 마지막 카드처럼 다음 카드가 없을 때 자리만 되돌린다.
 *
 * 학습 화면과 매일 복습 화면이 같은 모션을 쓰도록 훅으로 분리했다.
 */
export function useFlashCardMotion(revealed: boolean) {
  const { width } = useWindowDimensions();

  const cardX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const revealProgress = useSharedValue(0);

  // 뜻이 드러날 때마다 아래에서 살짝 올라오며 나타난다.
  useEffect(() => {
    if (!revealed) return;
    revealProgress.value = 0;
    revealProgress.value = withTiming(1, {
      duration: 240,
      easing: Easing.out(Easing.cubic),
    });
  }, [revealed, revealProgress]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateX: cardX.value }],
  }));

  const meaningStyle = useAnimatedStyle(() => ({
    opacity: revealProgress.value,
    transform: [{ translateY: (1 - revealProgress.value) * 10 }],
  }));

  const slideOut = (direction: SlideDirection, onDone: () => void) => {
    cardOpacity.value = withTiming(0, { duration: EXIT_MS });
    cardX.value = withTiming(
      direction * width * 0.9,
      { duration: EXIT_MS, easing: Easing.in(Easing.cubic) },
      (finished) => {
        if (finished) scheduleOnRN(onDone);
      }
    );
  };

  const slideIn = (direction: SlideDirection) => {
    cardX.value = -direction * width * 0.45;
    cardX.value = withTiming(0, { duration: ENTER_MS, easing: Easing.out(Easing.cubic) });
    cardOpacity.value = withTiming(1, { duration: ENTER_MS });
  };

  const settle = () => {
    cardX.value = 0;
    cardOpacity.value = withTiming(1, { duration: ENTER_MS });
  };

  return { cardStyle, meaningStyle, slideOut, slideIn, settle };
}

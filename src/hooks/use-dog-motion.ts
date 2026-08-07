import { useEffect, useState } from 'react';
import {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ACTION_FRAMES, ANIMATED_FROM_STAGE, DanceRequest } from '@/stores/character-store';

/** 트랜스폼 한 바퀴 (HANDOFF §5.5) */
const BOUNCE_MS = 900;
/** 프레임 교체 간격 */
const FRAME_MS = 240;

// §5.5 키프레임을 그대로 옮긴 것. 0%와 100%가 같아야 반복이 이어져 보인다.
const AT = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1];
const ROTATE = [0, -12, 6, -6, 12, -4, 0];
const TRANSLATE_Y = [0, -6, -10, -2, -8, -3, 0];
const SCALE = [1, 1.04, 1.06, 1, 1.05, 1.02, 1];

/**
 * 강아지 동작 애니메이션.
 *
 * 5단계(청소년 리트리버)부터는 네 장의 프레임을 갈아끼우고, 그 아래 단계는
 * 자기 단계 이미지에 튀는 트랜스폼만 준다.
 */
export function useDogMotion(dance: DanceRequest, stageIndex: number, stageImage: number) {
  const progress = useSharedValue(0);
  const [frame, setFrame] = useState<number | null>(null);

  const usesFrames = stageIndex >= ANIMATED_FROM_STAGE;

  useEffect(() => {
    if (dance.times <= 0) return;

    progress.value = 0;
    progress.value = withRepeat(
      withTiming(1, { duration: BOUNCE_MS, easing: Easing.linear }),
      dance.times,
      false
    );

    if (!usesFrames) return;

    let index = 0;
    setFrame(0);
    const cycle = setInterval(() => {
      index = (index + 1) % ACTION_FRAMES.length;
      setFrame(index);
    }, FRAME_MS);
    const stop = setTimeout(() => {
      clearInterval(cycle);
      setFrame(null);
    }, BOUNCE_MS * dance.times);

    return () => {
      clearInterval(cycle);
      clearTimeout(stop);
    };
    // seq 가 바뀔 때마다 다시 재생한다. times 는 그 시점 값을 쓰면 된다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dance.seq]);

  const motionStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, AT, TRANSLATE_Y) },
      { rotate: `${interpolate(progress.value, AT, ROTATE)}deg` },
      { scale: interpolate(progress.value, AT, SCALE) },
    ],
  }));

  const source = usesFrames && frame !== null ? ACTION_FRAMES[frame] : stageImage;

  return { motionStyle, source };
}

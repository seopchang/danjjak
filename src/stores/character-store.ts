import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Character } from '@/types';

/**
 * 성장 캐릭터(강아지).
 *
 * 학습을 하루 한 번이라도 하면 포인트와 코인이 쌓이고, 며칠 쉬면 배고픔·갈증이 줄어든다.
 * 덱·단어와 달리 계정당 하나뿐이라 목록 병합이 아니라 `updatedAt` 하나로 최신 승 판정을 한다.
 */

export interface Stage {
  name: string;
  /** 이 단계가 되기 위해 필요한 누적 포인트 */
  min: number;
  image: number;
}

/** 매일 학습(+10P) 기준으로 마지막 단계까지 약 110일 */
export const STAGES: Stage[] = [
  { name: '새끼 강아지', min: 0, image: require('../../assets/illustrations/dog-stage-1.png') },
  { name: '아기 강아지', min: 20, image: require('../../assets/illustrations/dog-stage-2.png') },
  { name: '걸음마 강아지', min: 60, image: require('../../assets/illustrations/dog-stage-3.png') },
  { name: '어린 강아지', min: 150, image: require('../../assets/illustrations/dog-stage-4.png') },
  { name: '청소년 리트리버', min: 300, image: require('../../assets/illustrations/dog-stage-5.png') },
  { name: '청년 리트리버', min: 500, image: require('../../assets/illustrations/dog-stage-6.png') },
  { name: '성숙한 리트리버', min: 750, image: require('../../assets/illustrations/dog-stage-7.png') },
  { name: '든든한 리트리버', min: 1100, image: require('../../assets/illustrations/dog-stage-8.png') },
];

/** 이 단계부터는 동작 애니메이션에서 프레임을 갈아끼운다 (그 아래는 트랜스폼만) */
export const ANIMATED_FROM_STAGE = 5;

/** 동작 애니메이션 프레임 (240ms 간격 순환) */
export const ACTION_FRAMES: number[] = [
  require('../../assets/illustrations/dog-action-bow.png'),
  require('../../assets/illustrations/dog-action-sit.png'),
  require('../../assets/illustrations/dog-action-bow-2.png'),
  require('../../assets/illustrations/dog-action-stand.png'),
];

/** 스플래시에서 걸어다니는 강아지 */
export const WALKING_DOG = require('../../assets/illustrations/dog-action-stand.png');

export interface Toy {
  id: string;
  cost: number;
  image: number;
}

export const TOYS: Toy[] = [
  { id: 'ball', cost: 8, image: require('../../assets/illustrations/toy-ball.png') },
  { id: 'bone', cost: 10, image: require('../../assets/illustrations/toy-bone.png') },
  { id: 'rope', cost: 12, image: require('../../assets/illustrations/toy-rope.png') },
  { id: 'frisbee', cost: 14, image: require('../../assets/illustrations/toy-frisbee.png') },
  { id: 'duck', cost: 16, image: require('../../assets/illustrations/toy-duck.png') },
  { id: 'plush', cost: 18, image: require('../../assets/illustrations/toy-plush.png') },
];

const FEED_AMOUNT = 40;
const FEED_COST = 1;
/** 하루 쉴 때마다 배고픔·갈증이 줄어드는 양 */
const DECAY_PER_DAY = 15;
const POINTS_PER_DAY = 10;
const COINS_PER_DAY = 5;

export function initialCharacter(): Character {
  return {
    name: '',
    points: 0,
    coins: 0,
    hunger: 100,
    thirst: 100,
    lastActiveDate: null,
    stageIndex: 0,
    toys: [],
    puppies: 0,
    updatedAt: new Date().toISOString(),
  };
}

export function stageIndexFor(points: number): number {
  let index = 0;
  for (let i = 0; i < STAGES.length; i++) {
    if (points >= STAGES[i].min) index = i;
  }
  return index;
}

/** 로컬 기준 오늘 날짜. toISOString()은 UTC라 자정 근처에서 하루가 어긋난다. */
export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(from: string, to: string): number {
  const diff = new Date(`${to}T00:00:00`).getTime() - new Date(`${from}T00:00:00`).getTime();
  return Math.max(1, Math.round(diff / 86400000));
}

/** 애니메이션을 몇 번 반복할지. 0이면 재생하지 않는다. */
export type DanceRequest = { times: number; seq: number };

interface CharacterState {
  character: Character;
  /** 화면이 구독하는 애니메이션 트리거. seq가 바뀔 때마다 다시 재생한다. */
  dance: DanceRequest;
  requestDance: (times?: number) => void;
  setName: (name: string) => void;
  /** 암기·복습·매치 세션이 완료되면 호출. 같은 날 두 번째부터는 아무 일도 하지 않는다. */
  awardDaily: () => void;
  feed: () => void;
  water: () => void;
  buyToy: (toyId: string) => void;
  mergeRemote: (remote: Character | null) => void;
}

export const useCharacterStore = create<CharacterState>()(
  persist(
    (set, get) => ({
      character: initialCharacter(),
      dance: { times: 0, seq: 0 },

      requestDance: (times = 2) => {
        set((state) => ({ dance: { times, seq: state.dance.seq + 1 } }));
      },

      setName: (name) => {
        set((state) => ({
          character: { ...state.character, name: name.trim(), updatedAt: new Date().toISOString() },
        }));
      },

      awardDaily: () => {
        const c = get().character;
        const today = todayKey();
        if (c.lastActiveDate === today) return;

        const daysSince = c.lastActiveDate ? daysBetween(c.lastActiveDate, today) : 1;
        const decay = Math.min(100, daysSince * DECAY_PER_DAY);
        const points = c.points + POINTS_PER_DAY;
        const newStage = stageIndexFor(points);
        const leveledUp = newStage > c.stageIndex;

        set({
          character: {
            ...c,
            points,
            coins: c.coins + COINS_PER_DAY,
            hunger: Math.max(0, c.hunger - decay),
            thirst: Math.max(0, c.thirst - decay),
            stageIndex: newStage,
            // 4단계부터는 단계가 오를 때마다 강아지가 한 마리씩 늘어난다.
            puppies: c.puppies + (leveledUp && newStage >= 3 ? newStage - c.stageIndex : 0),
            lastActiveDate: today,
            updatedAt: new Date().toISOString(),
          },
        });
        get().requestDance(leveledUp ? 4 : 2);
      },

      feed: () => {
        const c = get().character;
        if (c.coins < FEED_COST || c.hunger >= 100) return;
        set({
          character: {
            ...c,
            coins: c.coins - FEED_COST,
            hunger: Math.min(100, c.hunger + FEED_AMOUNT),
            updatedAt: new Date().toISOString(),
          },
        });
        get().requestDance(2);
      },

      water: () => {
        const c = get().character;
        if (c.coins < FEED_COST || c.thirst >= 100) return;
        set({
          character: {
            ...c,
            coins: c.coins - FEED_COST,
            thirst: Math.min(100, c.thirst + FEED_AMOUNT),
            updatedAt: new Date().toISOString(),
          },
        });
        get().requestDance(2);
      },

      buyToy: (toyId) => {
        const c = get().character;
        const toy = TOYS.find((t) => t.id === toyId);
        if (!toy || c.toys.includes(toyId) || c.coins < toy.cost) return;
        set({
          character: {
            ...c,
            coins: c.coins - toy.cost,
            toys: [...c.toys, toyId],
            updatedAt: new Date().toISOString(),
          },
        });
        get().requestDance(3);
      },

      mergeRemote: (remote) => {
        if (!remote) return;
        set((state) =>
          remote.updatedAt > state.character.updatedAt ? { character: remote } : state
        );
      },
    }),
    {
      name: 'vocadeck-character',
      storage: createJSONStorage(() => AsyncStorage),
      // 옛 저장본에 필드가 없을 수 있으므로 기본값 위에 덮어쓴다.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        character: { ...initialCharacter(), ...((persisted as CharacterState)?.character ?? {}) },
      }),
    }
  )
);

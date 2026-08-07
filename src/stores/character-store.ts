import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Character } from '@/types';

/**
 * 성장 캐릭터(강아지).
 *
 * 재화는 코인 하나뿐이다. 단어를 하나 공부할 때마다 1개씩 즉시 쌓이고, 하루 상한은 없다.
 * 승급은 자동이 아니라 사용자가 `키우기` 버튼을 눌러야 진행되며 그때 코인을 낸다.
 * (handoff/HANDOFF-character-update.md §0, §1)
 *
 * 덱·단어와 달리 계정당 하나뿐이라 목록 병합이 아니라 `updatedAt` 하나로 최신 승 판정을 한다.
 */

/**
 * 단계 그림. 배열 인덱스가 스펙의 `img` 값이다.
 *
 * 스펙은 0-based(`img: 0` ~ `img: 7`)로 쓰여 있는데 이 저장소의 파일명은
 * 1-based(`dog-stage-1.png` ~ `dog-stage-8.png`)라, 여기서 한 번만 맞춰둔다.
 * 6·7번째 그림(dog-stage-6/7)은 단계 축소로 더 이상 쓰이지 않지만 파일은 남겨둔다.
 */
const DOG_IMAGES: number[] = [
  require('../../assets/illustrations/dog-stage-1.png'), // img 0
  require('../../assets/illustrations/dog-stage-2.png'), // img 1
  require('../../assets/illustrations/dog-stage-3.png'), // img 2
  require('../../assets/illustrations/dog-stage-4.png'), // img 3
  require('../../assets/illustrations/dog-stage-5.png'), // img 4
  require('../../assets/illustrations/dog-stage-6.png'), // img 5 (미사용)
  require('../../assets/illustrations/dog-stage-7.png'), // img 6 (미사용)
  require('../../assets/illustrations/dog-stage-8.png'), // img 7
];

export interface Stage {
  name: string;
  /** 이 단계에 이르기까지 필요한 누적 코인. 승급 비용은 다음 단계와의 차액이다. */
  min: number;
  image: number;
}

/**
 * 6단계. 중간 두 단계(청년·성숙한 리트리버)는 그림 차이가 거의 없어 뺐다.
 * 승급 비용은 차액이라 20 / 40 / 90 / 150 / 300 이 되고, 다 키우면 600코인 = 단어 600개다.
 */
export const STAGES: Stage[] = [
  { name: '새끼 강아지', min: 0, image: DOG_IMAGES[0] },
  { name: '아기 강아지', min: 20, image: DOG_IMAGES[1] },
  { name: '걸음마 강아지', min: 60, image: DOG_IMAGES[2] },
  { name: '어린 강아지', min: 150, image: DOG_IMAGES[3] },
  { name: '청소년 리트리버', min: 300, image: DOG_IMAGES[4] },
  { name: '든든한 리트리버', min: 600, image: DOG_IMAGES[7] },
];

/** 이 단계부터는 동작 애니메이션에서 프레임을 갈아끼운다 (5단계 청소년 리트리버 = 인덱스 4) */
export const ANIMATED_FROM_STAGE = 4;

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

/** 보유 개념이 없다. 누를 때마다 코인을 쓰고 강아지가 한 번 반응하고 끝이다. */
export const TOYS: Toy[] = [
  { id: 'ball', cost: 8, image: require('../../assets/illustrations/toy-ball.png') },
  { id: 'bone', cost: 10, image: require('../../assets/illustrations/toy-bone.png') },
  { id: 'rope', cost: 12, image: require('../../assets/illustrations/toy-rope.png') },
  { id: 'frisbee', cost: 14, image: require('../../assets/illustrations/toy-frisbee.png') },
  { id: 'duck', cost: 16, image: require('../../assets/illustrations/toy-duck.png') },
  { id: 'plush', cost: 18, image: require('../../assets/illustrations/toy-plush.png') },
];

/** 이 단계부터 자랄 때마다 강아지가 한 마리씩 늘어난다 (1-based 4단계 = 인덱스 3) */
const PUPPY_FROM_STAGE = 3;

export function initialCharacter(): Character {
  return {
    name: '',
    coins: 0,
    stageIndex: 0,
    puppies: 0,
    updatedAt: new Date().toISOString(),
  };
}

/** 다음 단계로 올리는 데 드는 코인. 최고 단계면 null. */
export function upgradeCost(stageIndex: number): number | null {
  const current = STAGES[stageIndex];
  const next = STAGES[stageIndex + 1];
  if (!current || !next) return null;
  return next.min - current.min;
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * 저장본·원격본을 현재 모델로 맞춘다.
 *
 * 옛 레코드에는 points/hunger/thirst/lastActiveDate/toys 가 남아 있는데 그냥 버린다.
 * 단계 축소(8 → 6) 때문에 옛 stageIndex 가 6, 7이면 배열 밖이라 반드시 클램프해야 한다.
 */
function sanitize(raw: Partial<Character> | null | undefined): Character {
  const base = initialCharacter();
  if (!raw) return base;
  return {
    name: typeof raw.name === 'string' ? raw.name : base.name,
    coins: toCount(raw.coins),
    stageIndex: Math.min(toCount(raw.stageIndex), STAGES.length - 1),
    puppies: toCount(raw.puppies),
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : base.updatedAt,
  };
}

/** 애니메이션을 몇 번 반복할지. 0이면 재생하지 않는다. */
export type DanceRequest = { times: number; seq: number };

interface CharacterState {
  character: Character;
  /** 화면이 구독하는 애니메이션 트리거. seq가 바뀔 때마다 다시 재생한다. */
  dance: DanceRequest;
  requestDance: (times?: number) => void;
  setName: (name: string) => void;
  /** 단어 하나를 공부할 때마다 호출. 하루 상한 없이 즉시 쌓인다. */
  addCoin: (count?: number) => void;
  /** 키우기 버튼. 코인이 모자라거나 최고 단계면 아무 일도 하지 않고 false. */
  growUp: () => boolean;
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

      addCoin: (count = 1) => {
        if (count <= 0) return;
        set((state) => ({
          character: {
            ...state.character,
            coins: state.character.coins + count,
            updatedAt: new Date().toISOString(),
          },
        }));
      },

      growUp: () => {
        const c = get().character;
        const cost = upgradeCost(c.stageIndex);
        if (cost == null || c.coins < cost) return false;

        const newStage = c.stageIndex + 1;
        set({
          character: {
            ...c,
            coins: c.coins - cost,
            stageIndex: newStage,
            puppies: c.puppies + (newStage >= PUPPY_FROM_STAGE ? 1 : 0),
            updatedAt: new Date().toISOString(),
          },
        });
        // 축하 동작은 변신 모달이 직접 연출한다. 여기서 requestDance 하지 않는다.
        return true;
      },

      buyToy: (toyId) => {
        const c = get().character;
        const toy = TOYS.find((t) => t.id === toyId);
        if (!toy || c.coins < toy.cost) return;
        set({
          character: {
            ...c,
            coins: c.coins - toy.cost,
            updatedAt: new Date().toISOString(),
          },
        });
        get().requestDance(3);
      },

      mergeRemote: (remote) => {
        if (!remote) return;
        const clean = sanitize(remote);
        set((state) =>
          clean.updatedAt > state.character.updatedAt ? { character: clean } : state
        );
      },
    }),
    {
      name: 'vocadeck-character',
      storage: createJSONStorage(() => AsyncStorage),
      // 옛 저장본은 필드 구성이 다르므로 항상 현재 모델로 정리해서 올린다.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as object),
        character: sanitize((persisted as CharacterState)?.character),
      }),
    }
  )
);

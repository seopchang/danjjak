/**
 * 동기화(Firestore) 전제로 설계된 데이터 모델.
 *
 * - 모든 레코드는 `updatedAt`(ISO 문자열)을 가진다. 수동 동기화 시 이 값으로
 *   마지막 동기화 이후 변경분만 골라내고, 충돌 시 더 최신인 쪽이 이긴다.
 * - 삭제는 즉시 지우지 않고 `deletedAt`을 채우는 tombstone 방식이다.
 *   그래야 다른 기기에서도 "삭제됐다"는 사실이 전파된다.
 * - 태그는 별도 스토어의 id 참조가 아니라 문자열 배열로 덱 안에 둔다.
 *   기기 간 id를 맞출 필요가 없어 동기화가 단순해진다.
 */

export interface Syncable {
  updatedAt: string;
  deletedAt: string | null;
}

/**
 * 단어장의 언어. 생성할 때 고르고 이후에는 바꾸지 않는다.
 * 암기·복습·매치는 항상 한 덱 안에서만 돌기 때문에 이 값 하나로 언어가 고정된다.
 */
export type DeckLang = 'en' | 'ko';

export interface Deck extends Syncable {
  id: string;
  name: string;
  createdAt: string;
  /** 이전 버전 덱에는 없다. 읽을 때 'en'으로 본다 (deckLang 헬퍼). */
  lang?: DeckLang;
}

export type WordStatus = '미암기' | '암기완료';

export interface Word extends Syncable {
  id: string;
  deckId: string;
  term: string;
  meaning: string;
  tags: string[];
  status: WordStatus;
  isFavorite: boolean;
  registeredAt: string;
  lastReviewedAt: string | null;
  /** 덱의 언어를 그대로 상속한다. 개별 선택 UI는 없다. */
  lang?: DeckLang;
}

/**
 * '리콜'은 옛 이름이다. 이미 Firestore에 저장된 기록이 있어서 타입에서 지우지 못한다.
 * 화면에는 항상 `sessionTypeLabel()`을 거쳐 '매치'로 보여준다.
 */
export type StudySessionType = '암기' | '복습' | '매치' | '리콜';

export interface StudySession extends Syncable {
  id: string;
  deckId: string;
  type: StudySessionType;
  date: string;
  testedWordIds: string[];
  correctCount: number;
  incorrectCount: number;
  accuracy: number;
  durationSeconds: number;
  scopeLabel: string;
}

/** 단어 매치 출제 방향 */
export type RecallDirection = 'meaningToTerm' | 'termToMeaning';

/** 덱 언어를 읽는다. 구버전 덱(lang 없음)은 영어로 본다. */
export function deckLang(deck: Pick<Deck, 'lang'> | undefined): DeckLang {
  return deck?.lang === 'ko' ? 'ko' : 'en';
}

/** 저장된 옛 이름('리콜')을 화면 표기('매치')로 바꾼다. */
export function sessionTypeLabel(type: StudySessionType): string {
  return type === '리콜' ? '매치' : type;
}

/**
 * 성장 캐릭터(강아지).
 *
 * 덱·단어와 달리 계정당 하나뿐이라 tombstone이 필요 없다. 대신 `updatedAt`은
 * 그대로 두어 동기화 시 최신 승 판정을 같은 방식으로 쓴다.
 */
export interface Character {
  /** 사용자가 정한 이름. 정하기 전에는 빈 문자열 */
  name: string;
  points: number;
  coins: number;
  /** 0~100 */
  hunger: number;
  /** 0~100 */
  thirst: number;
  /** 'YYYY-MM-DD'. 하루 1회 지급을 판정하는 기준 */
  lastActiveDate: string | null;
  /** 0~7 */
  stageIndex: number;
  /** 보유 장난감 id */
  toys: string[];
  /** 단계가 오르며 태어난 강아지 수 */
  puppies: number;
  updatedAt: string;
}

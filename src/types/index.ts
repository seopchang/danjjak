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

export interface Deck extends Syncable {
  id: string;
  name: string;
  createdAt: string;
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
}

export type StudySessionType = '암기' | '복습' | '리콜';

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

/** 리콜 테스트 출제 방향 */
export type RecallDirection = 'meaningToTerm' | 'termToMeaning';

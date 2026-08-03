import { Word } from '@/types';

/** 하루 복습에 넣을 단어 수 상한. 단어가 이보다 적으면 있는 만큼만 넣는다. */
export const DAILY_REVIEW_LIMIT = 50;

/**
 * 매일 복습에 내보낼 단어를 고른다.
 *
 * 순서 규칙:
 *  1. 미암기 단어가 먼저 온다.
 *  2. 같은 상태 안에서는 본 지 오래된 순서다.
 *     한 번도 복습한 적 없는 단어(`lastReviewedAt`이 null)를 가장 오래된 것으로 본다.
 *  3. 그래도 같으면 먼저 등록한 단어가 앞에 온다.
 *
 * 덱을 가리지 않고 전체 단어를 대상으로 한다. 삭제된 단어(tombstone)는 제외한다.
 */
export function buildDailyReviewQueue(words: Word[], limit = DAILY_REVIEW_LIMIT): Word[] {
  const alive = words.filter((w) => w.deletedAt == null);

  const ordered = [...alive].sort((a, b) => {
    if (a.status !== b.status) return a.status === '미암기' ? -1 : 1;

    // ISO 문자열이라 사전순 비교가 곧 시간순 비교다.
    // 빈 문자열('')은 어떤 ISO 날짜보다 작으므로 미복습 단어가 자연히 앞에 온다.
    const aSeen = a.lastReviewedAt ?? '';
    const bSeen = b.lastReviewedAt ?? '';
    if (aSeen !== bSeen) return aSeen.localeCompare(bSeen);

    return a.registeredAt.localeCompare(b.registeredAt);
  });

  return ordered.slice(0, limit);
}

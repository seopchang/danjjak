import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore';

import { getDb } from '@/lib/firebase';
import { useCharacterStore } from '@/stores/character-store';
import { useDecksStore } from '@/stores/decks-store';
import { useSessionsStore } from '@/stores/sessions-store';
import { useWordsStore } from '@/stores/words-store';
import { Character, Deck, StudySession, Word } from '@/types';

/** Firestore 배치 쓰기 1회 한도 */
const BATCH_LIMIT = 450;

export interface SyncResult {
  pulled: number;
  pushed: number;
  syncedAt: string;
}

type Syncable = { id: string; updatedAt: string };

function collectionPath(uid: string, name: string): string {
  return `users/${uid}/${name}`;
}

/** 마지막 동기화 이후 원격에서 바뀐 문서만 가져온다. */
async function pullCollection<T extends Syncable>(
  uid: string,
  name: string,
  since: string | null
): Promise<T[]> {
  const ref = collection(getDb(), collectionPath(uid, name));
  // updatedAt은 ISO 문자열이라 사전순 비교가 곧 시간순 비교다.
  const q = since ? query(ref, where('updatedAt', '>', since)) : query(ref);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => d.data() as T);
}

/** 로컬에서 바뀐 문서만 올린다. */
async function pushRecords<T extends Syncable>(
  uid: string,
  name: string,
  records: T[]
): Promise<void> {
  const db = getDb();
  for (let i = 0; i < records.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    for (const record of records.slice(i, i + BATCH_LIMIT)) {
      batch.set(doc(db, collectionPath(uid, name), record.id), record);
    }
    await batch.commit();
  }
}

/**
 * 캐릭터는 계정당 하나뿐이라 목록 병합이 아니라 단일 문서로 주고받는다.
 * 경로: users/{uid}/state/character
 */
async function pullCharacter(uid: string): Promise<Character | null> {
  const snapshot = await getDoc(doc(getDb(), collectionPath(uid, 'state'), 'character'));
  return snapshot.exists() ? (snapshot.data() as Character) : null;
}

async function pushCharacter(uid: string, character: Character): Promise<void> {
  await setDoc(doc(getDb(), collectionPath(uid, 'state'), 'character'), character);
}

function dirtyIdsOf<T extends Syncable>(records: T[], since: string | null): Set<string> {
  if (!since) return new Set(records.map((r) => r.id));
  return new Set(records.filter((r) => r.updatedAt > since).map((r) => r.id));
}

/**
 * 수동 동기화 1회.
 *
 * 순서가 중요하다:
 *  1. 먼저 "로컬에서 바뀐 항목의 id"를 기록해둔다.
 *  2. 원격 변경분을 받아 병합한다(같은 항목이면 updatedAt이 최신인 쪽이 이긴다).
 *  3. 1에서 기록해둔 id들의 *병합 후* 값을 올린다.
 *     병합 후 값은 이미 최신 승자이므로, 더 새로운 원격 데이터를
 *     오래된 로컬 값으로 덮어쓰는 일이 생기지 않는다.
 *
 * 주의: 두 기기의 시계가 크게 어긋나 있으면 최신 판정이 틀릴 수 있다.
 * 개인용 2기기 수준에서는 충분하다고 보고 단순한 방식을 택했다.
 */
export async function syncNow(uid: string, since: string | null): Promise<SyncResult> {
  const decksStore = useDecksStore.getState();
  const wordsStore = useWordsStore.getState();
  const sessionsStore = useSessionsStore.getState();

  // 1. 로컬 변경분 표시
  const dirtyDecks = dirtyIdsOf(decksStore.decks, since);
  const dirtyWords = dirtyIdsOf(wordsStore.words, since);
  const dirtySessions = dirtyIdsOf(sessionsStore.sessions, since);

  // 캐릭터는 하나뿐이라 since 로 거르지 않고 항상 받아 updatedAt 으로 비교한다.
  const localCharacter = useCharacterStore.getState().character;

  // 2. 원격 변경분 받아서 병합
  const [remoteDecks, remoteWords, remoteSessions, remoteCharacter] = await Promise.all([
    pullCollection<Deck>(uid, 'decks', since),
    pullCollection<Word>(uid, 'words', since),
    pullCollection<StudySession>(uid, 'sessions', since),
    pullCharacter(uid),
  ]);

  decksStore.mergeRemote(remoteDecks);
  wordsStore.mergeRemote(remoteWords);
  sessionsStore.mergeRemote(remoteSessions);
  useCharacterStore.getState().mergeRemote(remoteCharacter);

  // 3. 병합 후 값으로 로컬 변경분 업로드
  const mergedDecks = useDecksStore.getState().decks.filter((d) => dirtyDecks.has(d.id));
  const mergedWords = useWordsStore.getState().words.filter((w) => dirtyWords.has(w.id));
  const mergedSessions = useSessionsStore
    .getState()
    .sessions.filter((s) => dirtySessions.has(s.id));

  // 병합 결과가 로컬 값 그대로면(= 우리 쪽이 최신이거나 원격에 아직 없으면) 올린다.
  const mergedCharacter = useCharacterStore.getState().character;
  const characterNeedsPush = !remoteCharacter || mergedCharacter.updatedAt > remoteCharacter.updatedAt;

  await Promise.all([
    pushRecords(uid, 'decks', mergedDecks),
    pushRecords(uid, 'words', mergedWords),
    pushRecords(uid, 'sessions', mergedSessions),
    characterNeedsPush ? pushCharacter(uid, mergedCharacter) : Promise.resolve(),
  ]);

  const characterPulled =
    remoteCharacter && remoteCharacter.updatedAt > localCharacter.updatedAt ? 1 : 0;

  return {
    pulled: remoteDecks.length + remoteWords.length + remoteSessions.length + characterPulled,
    pushed:
      mergedDecks.length + mergedWords.length + mergedSessions.length + (characterNeedsPush ? 1 : 0),
    syncedAt: new Date().toISOString(),
  };
}

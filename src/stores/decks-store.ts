import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { Deck, DeckLang } from '@/types';
import { generateId } from '@/utils/id';

interface DecksState {
  decks: Deck[];
  addDeck: (name: string, lang?: DeckLang) => Deck;
  renameDeck: (id: string, name: string) => void;
  removeDeck: (id: string) => void;
  /** 동기화로 받아온 원격 덱을 로컬에 병합한다. */
  mergeRemote: (remote: Deck[]) => void;
}

/** 삭제되지 않은 덱만 (화면에서는 항상 이걸 쓴다) */
export function visibleDecks(decks: Deck[]): Deck[] {
  return decks.filter((d) => d.deletedAt == null);
}

export const useDecksStore = create<DecksState>()(
  persist(
    (set) => ({
      decks: [],
      addDeck: (name, lang = 'en') => {
        const now = new Date().toISOString();
        const deck: Deck = {
          id: generateId(),
          name: name.trim(),
          lang,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        };
        set((state) => ({ decks: [...state.decks, deck] }));
        return deck;
      },
      renameDeck: (id, name) => {
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id ? { ...d, name: name.trim(), updatedAt: new Date().toISOString() } : d
          ),
        }));
      },
      removeDeck: (id) => {
        // tombstone: 실제로 지우지 않고 삭제 표시만 남겨 다른 기기에 전파한다.
        const now = new Date().toISOString();
        set((state) => ({
          decks: state.decks.map((d) =>
            d.id === id ? { ...d, deletedAt: now, updatedAt: now } : d
          ),
        }));
      },
      mergeRemote: (remote) => {
        set((state) => ({ decks: mergeById(state.decks, remote) }));
      },
    }),
    {
      name: 'vocadeck-decks',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/** updatedAt이 더 최신인 쪽을 채택하며 두 목록을 합친다. */
export function mergeById<T extends { id: string; updatedAt: string }>(
  local: T[],
  remote: T[]
): T[] {
  const byId = new Map(local.map((item) => [item.id, item]));
  for (const item of remote) {
    const existing = byId.get(item.id);
    if (!existing || item.updatedAt > existing.updatedAt) {
      byId.set(item.id, item);
    }
  }
  return [...byId.values()];
}

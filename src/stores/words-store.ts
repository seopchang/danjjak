import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mergeById } from '@/stores/decks-store';
import { Word, WordStatus } from '@/types';
import { generateId } from '@/utils/id';

interface AddWordInput {
  deckId: string;
  term: string;
  meaning: string;
  tags: string[];
}

interface WordsState {
  words: Word[];
  addWord: (input: AddWordInput) => Word;
  updateWord: (id: string, patch: Partial<Omit<Word, 'id' | 'deckId'>>) => void;
  removeWord: (id: string) => void;
  removeWords: (ids: string[]) => void;
  removeWordsOfDeck: (deckId: string) => void;
  markStatus: (id: string, status: WordStatus) => void;
  toggleFavorite: (id: string) => void;
  mergeRemote: (remote: Word[]) => void;
}

/** 특정 덱의 살아있는 단어만 */
export function deckWords(words: Word[], deckId: string): Word[] {
  return words.filter((w) => w.deckId === deckId && w.deletedAt == null);
}

export const useWordsStore = create<WordsState>()(
  persist(
    (set) => ({
      words: [],
      addWord: (input) => {
        const now = new Date().toISOString();
        const word: Word = {
          id: generateId(),
          deckId: input.deckId,
          term: input.term.trim(),
          meaning: input.meaning.trim(),
          tags: input.tags,
          status: '미암기',
          isFavorite: false,
          registeredAt: now,
          lastReviewedAt: null,
          updatedAt: now,
          deletedAt: null,
        };
        set((state) => ({ words: [...state.words, word] }));
        return word;
      },
      updateWord: (id, patch) => {
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id ? { ...w, ...patch, updatedAt: new Date().toISOString() } : w
          ),
        }));
      },
      removeWord: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id ? { ...w, deletedAt: now, updatedAt: now } : w
          ),
        }));
      },
      removeWords: (ids) => {
        const now = new Date().toISOString();
        const target = new Set(ids);
        set((state) => ({
          words: state.words.map((w) =>
            target.has(w.id) ? { ...w, deletedAt: now, updatedAt: now } : w
          ),
        }));
      },
      removeWordsOfDeck: (deckId) => {
        const now = new Date().toISOString();
        set((state) => ({
          words: state.words.map((w) =>
            w.deckId === deckId && w.deletedAt == null
              ? { ...w, deletedAt: now, updatedAt: now }
              : w
          ),
        }));
      },
      markStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id ? { ...w, status, lastReviewedAt: now, updatedAt: now } : w
          ),
        }));
      },
      toggleFavorite: (id) => {
        set((state) => ({
          words: state.words.map((w) =>
            w.id === id
              ? { ...w, isFavorite: !w.isFavorite, updatedAt: new Date().toISOString() }
              : w
          ),
        }));
      },
      mergeRemote: (remote) => {
        set((state) => ({ words: mergeById(state.words, remote) }));
      },
    }),
    {
      name: 'vocadeck-words',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

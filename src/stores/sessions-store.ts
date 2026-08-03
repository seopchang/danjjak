import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mergeById } from '@/stores/decks-store';
import { StudySession } from '@/types';
import { generateId } from '@/utils/id';

type AddSessionInput = Omit<StudySession, 'id' | 'updatedAt' | 'deletedAt'>;

interface SessionsState {
  sessions: StudySession[];
  addSession: (input: AddSessionInput) => void;
  removeSessionsOfDeck: (deckId: string) => void;
  mergeRemote: (remote: StudySession[]) => void;
}

export function deckSessions(sessions: StudySession[], deckId: string): StudySession[] {
  return sessions
    .filter((s) => s.deckId === deckId && s.deletedAt == null)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export const useSessionsStore = create<SessionsState>()(
  persist(
    (set) => ({
      sessions: [],
      addSession: (input) => {
        const session: StudySession = {
          ...input,
          id: generateId(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
        };
        set((state) => ({ sessions: [...state.sessions, session] }));
      },
      removeSessionsOfDeck: (deckId) => {
        const now = new Date().toISOString();
        set((state) => ({
          sessions: state.sessions.map((s) =>
            s.deckId === deckId && s.deletedAt == null
              ? { ...s, deletedAt: now, updatedAt: now }
              : s
          ),
        }));
      },
      mergeRemote: (remote) => {
        set((state) => ({ sessions: mergeById(state.sessions, remote) }));
      },
    }),
    {
      name: 'vocadeck-sessions',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

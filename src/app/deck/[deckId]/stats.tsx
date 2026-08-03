import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/common/card';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useDecksStore } from '@/stores/decks-store';
import { deckSessions, useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}

export default function StatsScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const theme = useTheme();
  const decks = useDecksStore((s) => s.decks);
  const allWords = useWordsStore((s) => s.words);
  const allSessions = useSessionsStore((s) => s.sessions);

  const deck = decks.find((d) => d.id === deckId);
  const words = useMemo(() => deckWords(allWords, deckId), [allWords, deckId]);
  const sessions = useMemo(() => deckSessions(allSessions, deckId), [allSessions, deckId]);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const total = words.length;
  const done = words.filter((w) => w.status === '암기완료').length;
  const favorite = words.filter((w) => w.isFavorite).length;

  const badges = [
    { label: '전체', value: total },
    { label: '암기완료', value: done },
    { label: '미암기', value: total - done },
    { label: '즐겨찾기', value: favorite },
  ];

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {deck?.name ?? '단어장'} 통계
        </ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <Card>
        <View style={styles.badgeRow}>
          {badges.map((b) => (
            <View
              key={b.label}
              style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {b.label}
              </ThemedText>
              <ThemedText type="smallBold" style={styles.badgeValue}>
                {b.value}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

      <ThemedText type="smallBold">학습 기록</ThemedText>

      {sessions.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          아직 학습 기록이 없습니다. 암기·복습·리콜을 한 번 진행하면 여기에 쌓입니다.
        </ThemedText>
      ) : (
        sessions.map((session) => {
          const expanded = expandedId === session.id;
          const tested = words.filter((w) => session.testedWordIds.includes(w.id));
          return (
            <Card key={session.id}>
              <View style={styles.sessionHead}>
                <View style={[styles.typeBadge, { backgroundColor: theme.primary }]}>
                  <ThemedText type="small" style={{ color: theme.primaryText }}>
                    {session.type}
                  </ThemedText>
                </View>
                <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
                  {dayjs(session.date).format('YYYY.MM.DD HH:mm')}
                </ThemedText>
                <IconButton
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  onPress={() => setExpandedId(expanded ? null : session.id)}
                  size={18}
                  color="textSecondary"
                />
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {session.testedWordIds.length}개 테스트 · 정답 {session.correctCount} · 오답{' '}
                {session.incorrectCount} · 정답률 {session.accuracy}% ·{' '}
                {formatDuration(session.durationSeconds)}
              </ThemedText>

              {expanded ? (
                tested.length > 0 ? (
                  <View style={styles.testedList}>
                    {tested.map((w) => (
                      <ThemedText key={w.id} type="small" themeColor="textSecondary">
                        · {w.term} — {w.meaning}
                      </ThemedText>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="small" themeColor="placeholder">
                    테스트한 단어가 삭제되었습니다.
                  </ThemedText>
                )
              ) : null}
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexGrow: 1,
    flexBasis: '22%',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 2,
  },
  badgeValue: {
    fontSize: 18,
    lineHeight: 24,
  },
  sessionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  grow: {
    flex: 1,
  },
  typeBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  testedList: {
    gap: 2,
  },
});

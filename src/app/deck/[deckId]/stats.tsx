import dayjs from 'dayjs';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { useDecksStore } from '@/stores/decks-store';
import { deckSessions, useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';

const theme = Colors.light;

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}초`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m}분` : `${m}분 ${s}초`;
}

export default function StatsScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ThemedText type="screenTitle">←</ThemedText>
        </Pressable>
        <ThemedText type="screenTitle" style={styles.title} numberOfLines={1}>
          {deck?.name ?? '단어장'} 통계
        </ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {/* 요약 4분할 — 카드 없이 세로선으로만 나눈다 */}
      <View style={styles.badgeRow}>
        {badges.map((b, i) => (
          <View key={b.label} style={[styles.badge, i > 0 && styles.badgeDivider]}>
            <ThemedText type="statValue">{b.value}</ThemedText>
            <ThemedText type="labelKo" themeColor="textSecondary" style={styles.badgeLabel}>
              {b.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <ThemedText type="sectionHeading" style={styles.sectionHeading}>
        학습 기록
      </ThemedText>

      {sessions.length === 0 ? (
        <ThemedText type="body" themeColor="textSecondary">
          아직 학습 기록이 없습니다. 암기·복습·리콜을 한 번 진행하면 여기에 쌓입니다.
        </ThemedText>
      ) : (
        sessions.map((session) => {
          const expanded = expandedId === session.id;
          const tested = words.filter((w) => session.testedWordIds.includes(w.id));
          return (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.sessionHead}>
                <View style={styles.typeBadge}>
                  <ThemedText type="labelKo" style={styles.typeBadgeText}>
                    {session.type}
                  </ThemedText>
                </View>
                <ThemedText type="meta" themeColor="textSecondary" style={styles.grow}>
                  {dayjs(session.date).format('YYYY.MM.DD HH:mm')}
                </ThemedText>
                <Pressable
                  onPress={() => setExpandedId(expanded ? null : session.id)}
                  hitSlop={10}>
                  <ThemedText type="meta" themeColor="textSecondary">
                    {expanded ? '▲' : '▼'}
                  </ThemedText>
                </Pressable>
              </View>

              <ThemedText type="caption" themeColor="textSecondary" style={styles.sessionMeta}>
                {session.testedWordIds.length}개 테스트 · 정답 {session.correctCount} · 오답{' '}
                {session.incorrectCount} · 정답률 {session.accuracy}% ·{' '}
                {formatDuration(session.durationSeconds)}
              </ThemedText>

              {expanded ? (
                tested.length > 0 ? (
                  <View style={styles.testedList}>
                    {tested.map((w) => (
                      <ThemedText key={w.id} type="caption" themeColor="textSecondary">
                        · {w.term} — {w.meaning}
                      </ThemedText>
                    ))}
                  </View>
                ) : (
                  <ThemedText type="caption" themeColor="textTertiary">
                    테스트한 단어가 삭제되었습니다.
                  </ThemedText>
                )
              ) : null}
            </View>
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
    gap: 12,
    borderBottomWidth: Border.strong,
    borderBottomColor: theme.ink,
    paddingBottom: 24,
    marginBottom: 24,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
  },

  badgeRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
  },
  badge: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  badgeDivider: {
    borderLeftWidth: Border.hair,
    borderLeftColor: theme.line,
  },
  badgeLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },

  sectionHeading: {
    paddingTop: 24,
    paddingBottom: 4,
  },

  sessionRow: {
    paddingVertical: 16,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
    gap: 8,
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
    backgroundColor: theme.ink,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  typeBadgeText: {
    color: theme.onInk,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  sessionMeta: {
    fontSize: 12,
  },
  testedList: {
    gap: 2,
  },
});

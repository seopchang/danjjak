import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { TextField } from '@/components/common/text-field';
import { SyncBar } from '@/components/sync-bar';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useDecksStore, visibleDecks } from '@/stores/decks-store';
import { useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { buildDailyReviewQueue } from '@/utils/review-queue';

export default function DeckListScreen() {
  const theme = useTheme();
  const decks = useDecksStore((s) => s.decks);
  const addDeck = useDecksStore((s) => s.addDeck);
  const removeDeck = useDecksStore((s) => s.removeDeck);
  const words = useWordsStore((s) => s.words);
  const removeWordsOfDeck = useWordsStore((s) => s.removeWordsOfDeck);
  const removeSessionsOfDeck = useSessionsStore((s) => s.removeSessionsOfDeck);

  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const list = useMemo(() => {
    return visibleDecks(decks)
      .map((deck) => {
        const items = deckWords(words, deck.id);
        return {
          deck,
          total: items.length,
          done: items.filter((w) => w.status === '암기완료').length,
        };
      })
      .sort((a, b) => b.deck.createdAt.localeCompare(a.deck.createdAt));
  }, [decks, words]);

  const summary = useMemo(() => {
    const alive = words.filter((w) => w.deletedAt == null);
    const done = alive.filter((w) => w.status === '암기완료').length;
    return {
      total: alive.length,
      done,
      todo: alive.length - done,
      reviewCount: buildDailyReviewQueue(words).length,
    };
  }, [words]);

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addDeck(name);
    setNewName('');
    setAdding(false);
  };

  const handleDelete = (deckId: string, name: string) => {
    Alert.alert('단어장 삭제', `"${name}" 단어장과 그 안의 단어를 모두 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          removeWordsOfDeck(deckId);
          removeSessionsOfDeck(deckId);
          removeDeck(deckId);
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <ThemedText type="subtitle">보카덱</ThemedText>
        <IconButton name="settings-outline" onPress={() => router.push('/settings')} size={24} />
      </View>

      <SyncBar />

      {/* 오늘 복습할 거리를 가장 먼저 보여준다 — 앱을 여는 주된 이유이기 때문. */}
      <Pressable onPress={() => router.push('/review')} disabled={summary.reviewCount === 0}>
        <Card
          style={{
            backgroundColor: summary.reviewCount > 0 ? theme.primary : theme.card,
            borderColor: summary.reviewCount > 0 ? theme.primary : theme.border,
          }}>
          <View style={styles.reviewHead}>
            <ThemedText
              type="smallBold"
              style={summary.reviewCount > 0 ? { color: theme.primaryText } : undefined}>
              오늘의 복습
            </ThemedText>
            {summary.reviewCount > 0 ? (
              <Ionicons name="arrow-forward" size={18} color={theme.primaryText} />
            ) : null}
          </View>
          {summary.reviewCount > 0 ? (
            <ThemedText type="title" style={[styles.reviewCount, { color: theme.primaryText }]}>
              {summary.reviewCount}개
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              단어를 등록하면 복습할 목록이 만들어집니다.
            </ThemedText>
          )}
          {summary.reviewCount > 0 ? (
            <ThemedText type="small" style={{ color: theme.primaryText, opacity: 0.75 }}>
              미암기 단어부터 순서대로 모았습니다. 눌러서 시작하세요.
            </ThemedText>
          ) : null}
        </Card>
      </Pressable>

      {/* 전체 진행 상황 요약 */}
      <View style={styles.statRow}>
        <StatTile label="전체 단어" value={summary.total} />
        <StatTile label="암기완료" value={summary.done} />
        <StatTile label="미암기" value={summary.todo} />
      </View>

      <View style={styles.listHead}>
        <ThemedText type="smallBold">내 단어장 {list.length > 0 ? `(${list.length})` : ''}</ThemedText>
        <IconButton
          name={adding ? 'close' : 'add'}
          onPress={() => {
            setAdding((v) => !v);
            setNewName('');
          }}
          size={22}
        />
      </View>

      {adding ? (
        <Card>
          <View style={styles.addRow}>
            <TextField
              placeholder="예: 토익 필수, 수능 영단어"
              value={newName}
              onChangeText={setNewName}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              autoFocus
              style={styles.addInput}
            />
            <Button label="추가" onPress={handleAdd} disabled={!newName.trim()} />
          </View>
        </Card>
      ) : null}

      {list.length === 0 ? (
        <Card>
          <ThemedText type="smallBold">아직 단어장이 없습니다.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            오른쪽 위 + 버튼으로 단어장을 하나 만들어 시작해보세요.
          </ThemedText>
        </Card>
      ) : null}

      {list.map(({ deck, total, done }) => (
        <Pressable key={deck.id} onPress={() => router.push(`/deck/${deck.id}`)}>
          <Card style={styles.deckCard}>
            <View style={styles.deckHead}>
              <ThemedText type="smallBold" style={styles.deckName} numberOfLines={1}>
                {deck.name}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {total > 0 ? `${Math.round((done / total) * 100)}%` : '0%'}
              </ThemedText>
              <IconButton
                name="trash-outline"
                onPress={() => handleDelete(deck.id, deck.name)}
                size={18}
                color="textSecondary"
              />
            </View>
            <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: theme.primary,
                    width: total > 0 ? `${Math.round((done / total) * 100)}%` : '0%',
                  },
                ]}
              />
            </View>
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                단어 {total} · 완료 {done} · 미암기 {total - done}
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

/** 숫자 하나를 크게 보여주는 작은 타일 */
function StatTile({ label, value }: { label: string; value: number }) {
  const theme = useTheme();
  return (
    <View style={[styles.statTile, { backgroundColor: theme.backgroundElement }]}>
      <ThemedText type="smallBold" style={styles.statValue}>
        {value}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewCount: {
    fontSize: 30,
    lineHeight: 36,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statTile: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    gap: 2,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    lineHeight: 26,
  },
  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addInput: {
    flex: 1,
  },
  deckCard: {
    gap: 8,
  },
  deckHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deckName: {
    flex: 1,
    fontSize: 17,
    lineHeight: 23,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
});

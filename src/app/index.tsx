import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, View } from 'react-native';

import { CharacterCard } from '@/components/character/character-card';
import { Chip } from '@/components/common/chip';
import { Screen } from '@/components/common/screen';
import { TextField } from '@/components/common/text-field';
import { SyncBar } from '@/components/sync-bar';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { useDecksStore, visibleDecks } from '@/stores/decks-store';
import { useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { DeckLang } from '@/types';
import { buildDailyReviewQueue } from '@/utils/review-queue';

const theme = Colors.light;

export default function DeckListScreen() {
  const decks = useDecksStore((s) => s.decks);
  const addDeck = useDecksStore((s) => s.addDeck);
  const removeDeck = useDecksStore((s) => s.removeDeck);
  const words = useWordsStore((s) => s.words);
  const removeWordsOfDeck = useWordsStore((s) => s.removeWordsOfDeck);
  const removeSessionsOfDeck = useSessionsStore((s) => s.removeSessionsOfDeck);

  const [newName, setNewName] = useState('');
  const [newLang, setNewLang] = useState<DeckLang>('en');
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
    addDeck(name, newLang);
    setNewName('');
    setNewLang('en');
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

  const hasReview = summary.reviewCount > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark} />
          <ThemedText type="appTitle">단짝</ThemedText>
        </View>
        <Pressable style={styles.headerAction} onPress={() => router.push('/settings')}>
          <Image
            source={require('../../assets/illustrations/icon-settings.png')}
            style={styles.headerIcon}
            resizeMode="contain"
          />
          <ThemedText type="labelKo" themeColor="textSecondary" style={styles.headerActionLabel}>
            설정
          </ThemedText>
        </Pressable>
      </View>

      <SyncBar />

      <CharacterCard />

      {/* 오늘 복습할 거리를 가장 먼저 보여준다 — 앱을 여는 주된 이유이기 때문. */}
      <Pressable onPress={() => router.push('/review')} disabled={!hasReview}>
        <View style={[styles.reviewCard, hasReview && { backgroundColor: theme.ink }]}>
          <View style={styles.reviewHead}>
            <ThemedText
              type="labelKo"
              style={{ color: hasReview ? theme.onInk : theme.ink }}>
              오늘의 복습
            </ThemedText>
            {hasReview ? (
              <ThemedText type="labelKo" style={{ color: theme.onInk }}>
                →
              </ThemedText>
            ) : null}
          </View>

          {hasReview ? (
            <View style={styles.reviewCountRow}>
              <ThemedText type="bigNumber" style={{ color: theme.onInk }}>
                {summary.reviewCount}
              </ThemedText>
              <ThemedText type="sectionHeading" style={[styles.reviewUnit, { color: theme.onInk }]}>
                개
              </ThemedText>
            </View>
          ) : null}

          <ThemedText
            type="caption"
            style={
              hasReview ? { color: theme.onInk, opacity: 0.75 } : { color: theme.textSecondary }
            }>
            {hasReview
              ? '미암기 단어부터 순서대로 모았어요.'
              : '단어를 등록하면 목록이 채워집니다.'}
          </ThemedText>
        </View>
      </Pressable>

      {/* 전체 진행 상황 요약 */}
      <View style={styles.statRow}>
        <StatTile label="전체" value={summary.total} first />
        <StatTile label="암기완료" value={summary.done} />
        <StatTile label="미암기" value={summary.todo} />
      </View>

      <View style={styles.listHead}>
        <ThemedText type="sectionHeading" style={styles.listHeadTitle}>
          내 단어장 {list.length > 0 ? `(${list.length})` : ''}
        </ThemedText>
        <Pressable
          style={styles.addToggle}
          onPress={() => {
            setAdding((v) => !v);
            setNewName('');
          }}>
          <ThemedText style={styles.addToggleGlyph}>{adding ? '×' : '+'}</ThemedText>
        </Pressable>
      </View>

      {adding ? (
        <View style={styles.addBox}>
          <TextField
            placeholder="예: 토익 필수, 수능 영단어"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            autoFocus
          />
          {/* 생성 후에는 언어를 바꾸는 UI가 없다 (HANDOFF §6). */}
          <View style={styles.langRow}>
            <Chip label="영어" selected={newLang === 'en'} onPress={() => setNewLang('en')} />
            <Chip label="한국어" selected={newLang === 'ko'} onPress={() => setNewLang('ko')} />
          </View>
          <View style={styles.addSubmitRow}>
            <Pressable
              onPress={handleAdd}
              disabled={!newName.trim()}
              style={[styles.addSubmit, !newName.trim() && styles.disabled]}>
              <ThemedText type="button" style={{ color: theme.onInk }}>
                추가
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {list.length === 0 ? (
        <View style={styles.empty}>
          <Image
            source={require('../../assets/illustrations/empty-notebook.png')}
            style={styles.emptyArt}
            resizeMode="contain"
          />
          <ThemedText type="bodyBold">아직 단어장이 없습니다.</ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.emptyHint}>
            오른쪽 위 + 버튼으로 단어장을 하나 만들어 시작해보세요.
          </ThemedText>
        </View>
      ) : null}

      {list.map(({ deck, total, done }) => {
        const percent = total > 0 ? Math.round((done / total) * 100) : 0;
        return (
          <Pressable
            key={deck.id}
            style={styles.deckRow}
            onPress={() => router.push(`/deck/${deck.id}`)}>
            <View style={styles.deckHead}>
              <ThemedText type="rowTitle" style={styles.deckName} numberOfLines={1}>
                {deck.name}
              </ThemedText>
              <ThemedText type="metaSemi" themeColor="textSecondary">
                {percent}%
              </ThemedText>
              <Pressable onPress={() => handleDelete(deck.id, deck.name)} hitSlop={8}>
                <ThemedText type="caption" themeColor="textSecondary" style={styles.deleteLink}>
                  삭제
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.metaRow}>
              <ThemedText type="caption" themeColor="textSecondary" style={styles.deckMeta}>
                단어 {total} · 완료 {done} · 미암기 {total - done}
              </ThemedText>
              <ThemedText type="meta" themeColor="textSecondary">
                ›
              </ThemedText>
            </View>
          </Pressable>
        );
      })}
    </Screen>
  );
}

/** 한 줄을 3등분하는 요약 칸. 카드가 아니라 세로선으로만 나눈다. */
function StatTile({ label, value, first }: { label: string; value: number; first?: boolean }) {
  return (
    <View style={[styles.statTile, !first && styles.statTileDivider]}>
      <ThemedText type="statValue">{value}</ThemedText>
      <ThemedText type="labelKo" themeColor="textSecondary" style={styles.statLabel}>
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
    borderBottomWidth: Border.strong,
    borderBottomColor: theme.ink,
    paddingBottom: 24,
    marginBottom: 24,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 10,
    height: 10,
    backgroundColor: theme.ink,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerIcon: {
    width: 14,
    height: 14,
  },
  headerActionLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
  },

  reviewCard: {
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    padding: 20,
    gap: 10,
  },
  reviewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  reviewUnit: {
    fontSize: 16,
  },

  statRow: {
    flexDirection: 'row',
    paddingVertical: 20,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
  },
  statTile: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statTileDivider: {
    borderLeftWidth: Border.hair,
    borderLeftColor: theme.line,
  },
  statLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },

  listHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 12,
  },
  listHeadTitle: {
    fontSize: 18,
  },
  addToggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.ink,
    borderRadius: 0,
  },
  addToggleGlyph: {
    color: theme.onInk,
    fontSize: 18,
    lineHeight: 22,
  },

  addBox: {
    borderWidth: Border.hair,
    borderColor: theme.line,
    borderRadius: 0,
    padding: 16,
    gap: 14,
    marginBottom: 12,
  },
  langRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addSubmitRow: {
    alignItems: 'flex-end',
  },
  addSubmit: {
    backgroundColor: theme.ink,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.35,
  },

  empty: {
    alignItems: 'center',
    gap: 14,
    borderTopWidth: Border.hair,
    borderTopColor: theme.line,
    paddingTop: 32,
    paddingBottom: 24,
  },
  emptyArt: {
    width: 140,
    height: 140,
    opacity: 0.85,
  },
  emptyHint: {
    textAlign: 'center',
  },

  deckRow: {
    paddingVertical: 18,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
    gap: 10,
  },
  deckHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deckName: {
    flex: 1,
  },
  deleteLink: {
    textDecorationLine: 'underline',
  },
  progressTrack: {
    height: 4,
    backgroundColor: theme.line,
    borderRadius: 0,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.ink,
    borderRadius: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deckMeta: {
    fontSize: 11,
  },
});

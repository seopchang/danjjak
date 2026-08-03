import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { Chip } from '@/components/common/chip';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { WordListRow } from '@/components/vocab/word-list-row';
import { WordRegisterForm } from '@/components/vocab/word-register-form';
import { useTheme } from '@/hooks/use-theme';
import { useDecksStore } from '@/stores/decks-store';
import { deckWords, useWordsStore } from '@/stores/words-store';

const PAGE_SIZE = 20;

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const decks = useDecksStore((s) => s.decks);
  const allWords = useWordsStore((s) => s.words);
  const removeWord = useWordsStore((s) => s.removeWord);
  const removeWords = useWordsStore((s) => s.removeWords);
  const updateWord = useWordsStore((s) => s.updateWord);
  const toggleFavorite = useWordsStore((s) => s.toggleFavorite);

  const deck = decks.find((d) => d.id === deckId && d.deletedAt == null);
  const words = useMemo(() => deckWords(allWords, deckId), [allWords, deckId]);

  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [revealAll, setRevealAll] = useState(false);

  // 학습 옵션
  const [shuffle, setShuffle] = useState(true);
  const [studyFavoritesOnly, setStudyFavoritesOnly] = useState(false);

  const knownTags = useMemo(() => {
    return [...new Set(words.flatMap((w) => w.tags))].sort();
  }, [words]);

  const studyPool = useMemo(
    () => (studyFavoritesOnly ? words.filter((w) => w.isFavorite) : words),
    [words, studyFavoritesOnly]
  );
  const memorizeCount = studyPool.filter((w) => w.status === '미암기').length;
  const reviewCount = studyPool.filter((w) => w.status === '암기완료').length;
  const recallCount = studyPool.length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = favoritesOnly ? words.filter((w) => w.isFavorite) : words;
    if (activeTag) base = base.filter((w) => w.tags.includes(activeTag));
    if (q) {
      base = base.filter(
        (w) => w.term.toLowerCase().includes(q) || w.meaning.toLowerCase().includes(q)
      );
    }
    return [...base].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt));
  }, [words, query, favoritesOnly, activeTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages - 1);
  const pageItems = filtered.slice(currentPage * PAGE_SIZE, currentPage * PAGE_SIZE + PAGE_SIZE);

  if (!deck) {
    return (
      <Screen>
        <View style={styles.header}>
          <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
          <ThemedText type="smallBold">단어장</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <Card>
          <ThemedText type="smallBold">단어장을 찾을 수 없습니다.</ThemedText>
          <Button label="목록으로" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  const toggleSelected = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const deleteSelected = () => {
    Alert.alert('단어 삭제', `선택한 ${selectedIds.length}개 단어를 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          removeWords(selectedIds);
          setSelectedIds([]);
        },
      },
    ]);
  };

  const studyParams = `shuffle=${shuffle ? 1 : 0}&favorites=${studyFavoritesOnly ? 1 : 0}`;

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
        <ThemedText type="smallBold" style={styles.title} numberOfLines={1}>
          {deck.name}
        </ThemedText>
        <IconButton
          name="stats-chart-outline"
          onPress={() => router.push(`/deck/${deckId}/stats`)}
          size={22}
        />
      </View>

      <Card>
        <ThemedText type="smallBold">학습 시작</ThemedText>
        <View style={styles.countsRow}>
          <ThemedText type="small" themeColor="textSecondary">
            암기 대상 {memorizeCount}개
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            복습 대상 {reviewCount}개
          </ThemedText>
        </View>
        <View style={styles.optionRow}>
          <Chip label="랜덤 섞기" selected={shuffle} onPress={() => setShuffle((v) => !v)} />
          <Chip
            label="즐겨찾기만"
            selected={studyFavoritesOnly}
            onPress={() => setStudyFavoritesOnly((v) => !v)}
          />
        </View>
        <View style={styles.buttonRow}>
          <Button
            label="암기"
            variant="ghost"
            disabled={memorizeCount === 0}
            onPress={() => router.push(`/deck/${deckId}/study?mode=memorize&${studyParams}`)}
            style={styles.flexButton}
          />
          <Button
            label="복습"
            variant="ghost"
            disabled={reviewCount === 0}
            onPress={() => router.push(`/deck/${deckId}/study?mode=review&${studyParams}`)}
            style={styles.flexButton}
          />
          <Button
            label="리콜"
            variant="ghost"
            disabled={recallCount < 4}
            onPress={() =>
              router.push(
                `/deck/${deckId}/recall?favorites=${studyFavoritesOnly ? 1 : 0}&shuffle=${shuffle ? 1 : 0}`
              )
            }
            style={styles.flexButton}
          />
        </View>
        {recallCount < 4 ? (
          <ThemedText type="small" themeColor="placeholder">
            리콜 테스트는 단어가 4개 이상일 때 시작할 수 있습니다.
          </ThemedText>
        ) : null}
      </Card>

      <WordRegisterForm deckId={deckId} knownTags={knownTags} />

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={theme.textSecondary} />
        <TextField
          value={query}
          onChangeText={(v) => {
            setQuery(v);
            setPage(0);
          }}
          placeholder="단어 검색"
          autoCapitalize="none"
          style={styles.searchInput}
        />
      </View>

      <View style={styles.filterRow}>
        <Chip
          label="즐겨찾기만"
          selected={favoritesOnly}
          onPress={() => {
            setFavoritesOnly((v) => !v);
            setPage(0);
          }}
        />
        <Chip
          label={revealAll ? '뜻 보임' : '뜻 가림'}
          selected={revealAll}
          onPress={() => setRevealAll((v) => !v)}
        />
      </View>

      {knownTags.length > 0 ? (
        <View style={styles.filterRow}>
          {knownTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={activeTag === tag}
              onPress={() => {
                setActiveTag((t) => (t === tag ? null : tag));
                setPage(0);
              }}
            />
          ))}
        </View>
      ) : null}

      {selectedIds.length > 0 ? (
        <Button
          label={`선택한 ${selectedIds.length}개 삭제`}
          variant="danger"
          onPress={deleteSelected}
        />
      ) : null}

      {pageItems.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {words.length === 0 ? '아직 등록된 단어가 없습니다.' : '조건에 맞는 단어가 없습니다.'}
        </ThemedText>
      ) : (
        <View style={isWide ? styles.grid : undefined}>
          {pageItems.map((word, i) => (
            <View key={word.id} style={isWide ? styles.gridItem : undefined}>
              <WordListRow
                index={currentPage * PAGE_SIZE + i}
                word={word}
                checked={selectedIds.includes(word.id)}
                revealAll={revealAll}
                onToggleChecked={() => toggleSelected(word.id)}
                onToggleFavorite={() => toggleFavorite(word.id)}
                onUpdate={(patch) => updateWord(word.id, patch)}
                onRemove={() => removeWord(word.id)}
              />
            </View>
          ))}
        </View>
      )}

      {totalPages > 1 ? (
        <View style={styles.pagination}>
          <IconButton
            name="chevron-back-outline"
            onPress={() => setPage((p) => Math.max(0, p - 1))}
            color={currentPage === 0 ? 'placeholder' : 'text'}
          />
          <ThemedText type="small">
            {currentPage + 1} / {totalPages}
          </ThemedText>
          <IconButton
            name="chevron-forward-outline"
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            color={currentPage === totalPages - 1 ? 'placeholder' : 'text'}
          />
        </View>
      ) : null}
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
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
  },
  countsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});

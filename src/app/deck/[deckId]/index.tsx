import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Chip } from '@/components/common/chip';
import { Screen } from '@/components/common/screen';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { WordListRow } from '@/components/vocab/word-list-row';
import { WordRegisterForm } from '@/components/vocab/word-register-form';
import { Border, Colors } from '@/constants/theme';
import { useDecksStore } from '@/stores/decks-store';
import { deckWords, useWordsStore } from '@/stores/words-store';

const PAGE_SIZE = 20;
const theme = Colors.light;

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
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
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <ThemedText type="screenTitle">←</ThemedText>
          </Pressable>
          <ThemedText type="screenTitle" style={styles.title}>
            단어장
          </ThemedText>
          <View style={styles.headerSpacer} />
        </View>
        <ThemedText type="bodyBold">단어장을 찾을 수 없습니다.</ThemedText>
        <Button label="목록으로" onPress={() => router.replace('/')} style={styles.backButton} />
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ThemedText type="screenTitle">←</ThemedText>
        </Pressable>
        <ThemedText type="screenTitle" style={styles.title} numberOfLines={1}>
          {deck.name}
        </ThemedText>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.headerAction}
            onPress={() => router.push(`/deck/${deckId}/note`)}>
            <Image
              source={require('../../../../assets/illustrations/icon-note.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <ThemedText type="labelKo" themeColor="textSecondary" style={styles.headerActionLabel}>
              노트
            </ThemedText>
          </Pressable>
          <Pressable
            style={styles.headerAction}
            onPress={() => router.push(`/deck/${deckId}/stats`)}>
            <Image
              source={require('../../../../assets/illustrations/icon-stats.png')}
              style={styles.headerIcon}
              resizeMode="contain"
            />
            <ThemedText type="labelKo" themeColor="textSecondary" style={styles.headerActionLabel}>
              통계
            </ThemedText>
          </Pressable>
        </View>
      </View>

      <View style={styles.studyBlock}>
        <ThemedText type="sectionHeading">학습 시작</ThemedText>
        <View style={styles.countsRow}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.countText}>
            암기 대상 {memorizeCount}개
          </ThemedText>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.countText}>
            복습 대상 {reviewCount}개
          </ThemedText>
        </View>

        {/* 옵션 칩은 서로 붙여 배치하고 겹치는 테두리는 1px로 둔다 */}
        <View style={styles.chipJoinRow}>
          <Chip label="랜덤 섞기" selected={shuffle} onPress={() => setShuffle((v) => !v)} />
          <View style={styles.chipJoined}>
            <Chip
              label="즐겨찾기만"
              selected={studyFavoritesOnly}
              onPress={() => setStudyFavoritesOnly((v) => !v)}
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Button
            label="암기"
            variant="outline"
            disabled={memorizeCount === 0}
            onPress={() => router.push(`/deck/${deckId}/study?mode=memorize&${studyParams}`)}
            style={styles.flexButton}
          />
          <Button
            label="복습"
            variant="outline"
            disabled={reviewCount === 0}
            onPress={() => router.push(`/deck/${deckId}/study?mode=review&${studyParams}`)}
            style={styles.flexButton}
          />
          <Button
            label="리콜"
            variant="outline"
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
          <View style={styles.recallHint}>
            <Image
              source={require('../../../../assets/illustrations/empty-flashcards.png')}
              style={styles.recallHintArt}
              resizeMode="contain"
            />
            <ThemedText type="caption" themeColor="textTertiary" style={styles.recallHintText}>
              리콜 테스트는 단어가 4개 이상일 때 시작할 수 있습니다.
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={styles.section}>
        <WordRegisterForm deckId={deckId} knownTags={knownTags} />
      </View>

      <TextField
        emphasis="secondary"
        value={query}
        onChangeText={(v) => {
          setQuery(v);
          setPage(0);
        }}
        placeholder="단어 검색"
        autoCapitalize="none"
      />

      <View style={[styles.filterRow, styles.filterRowFirst]}>
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
          style={styles.deleteSelected}
        />
      ) : null}

      {pageItems.length === 0 ? (
        <ThemedText type="body" themeColor="textSecondary" style={styles.emptyList}>
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
          <Pressable onPress={() => setPage((p) => Math.max(0, p - 1))} hitSlop={10}>
            <ThemedText
              type="metaSemi"
              style={{ color: currentPage === 0 ? theme.textTertiary : theme.ink }}>
              ‹
            </ThemedText>
          </Pressable>
          <ThemedText type="metaSemi">
            {currentPage + 1} / {totalPages}
          </ThemedText>
          <Pressable
            onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            hitSlop={10}>
            <ThemedText
              type="metaSemi"
              style={{ color: currentPage === totalPages - 1 ? theme.textTertiary : theme.ink }}>
              ›
            </ThemedText>
          </Pressable>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  backButton: {
    marginTop: 16,
  },

  studyBlock: {
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    padding: 20,
    gap: 12,
  },
  countsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  countText: {
    fontSize: 12,
  },
  chipJoinRow: {
    flexDirection: 'row',
  },
  chipJoined: {
    marginLeft: -1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  flexButton: {
    flex: 1,
  },
  recallHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  recallHintArt: {
    width: 44,
    height: 44,
    opacity: 0.85,
  },
  recallHintText: {
    flex: 1,
  },

  section: {
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
    paddingBottom: 24,
    marginBottom: 24,
    paddingTop: 24,
  },

  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  filterRowFirst: {
    marginTop: 16,
  },
  deleteSelected: {
    marginTop: 16,
  },
  emptyList: {
    marginTop: 24,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 20,
  },
  gridItem: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 24,
  },
});

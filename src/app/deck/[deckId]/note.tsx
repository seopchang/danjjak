import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';

import { Chip } from '@/components/common/chip';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { useDecksStore } from '@/stores/decks-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { shuffled } from '@/utils/shuffle';

const theme = Colors.light;

/** 모눈 간격과 선 색 (HANDOFF §7) */
const GRID = 24;
const GRID_COLOR = 'rgba(17,17,17,0.09)';
const ROW_LINE = 'rgba(17,17,17,0.22)';
const NUMBER_LINE = 'rgba(17,17,17,0.35)';
const MEANING_LINE = 'rgba(17,17,17,0.3)';
const MASK_BG = 'rgba(17,17,17,0.07)';
const MASK_TEXT = '#C8C8C8';

const ROW_HEIGHT = 48;
const NUMBER_WIDTH = 44;

/** 무엇을 가릴지. 바꾸면 공개해둔 행이 초기화된다. */
type HideMode = 'none' | 'term' | 'meaning';

const MODES: { key: HideMode; label: string }[] = [
  { key: 'none', label: '모두 보기' },
  { key: 'term', label: '단어 가리기' },
  { key: 'meaning', label: '뜻 가리기' },
];

/**
 * 노트 화면 (HANDOFF §7).
 * 모눈 위에 손글씨로 단어를 늘어놓고, 한쪽을 가린 채 외울 수 있게 한다.
 */
export default function NoteScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck = useDecksStore((s) => s.decks.find((d) => d.id === deckId));
  const allWords = useWordsStore((s) => s.words);

  const words = useMemo(() => deckWords(allWords, deckId), [allWords, deckId]);

  const [mode, setMode] = useState<HideMode>('none');
  const [revealed, setRevealed] = useState<string[]>([]);
  // 화면 표시 순서만 바꾼다. 원본 데이터 순서는 건드리지 않는다.
  const [order, setOrder] = useState<string[] | null>(null);
  const [bodyWidth, setBodyWidth] = useState(0);

  const rows = useMemo(() => {
    if (!order) return words;
    const byId = new Map(words.map((w) => [w.id, w]));
    // 섞은 뒤에 추가·삭제가 있었을 수 있으므로 현재 목록 기준으로 다시 맞춘다.
    const ordered = order.map((id) => byId.get(id)).filter((w) => w != null);
    const missing = words.filter((w) => !order.includes(w.id));
    return [...ordered, ...missing];
  }, [words, order]);

  const changeMode = (next: HideMode) => {
    setMode(next);
    setRevealed([]);
  };

  const toggleRow = (id: string) => {
    setRevealed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    setBodyWidth(event.nativeEvent.layout.width);
  };

  const bodyHeight = rows.length * ROW_HEIGHT;

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <ThemedText type="screenTitle">←</ThemedText>
        </Pressable>
        <ThemedText type="screenTitle" style={styles.title} numberOfLines={1}>
          {deck?.name ?? '단어장'}
        </ThemedText>
        <ThemedText type="labelKo" themeColor="textSecondary" style={styles.headerLabel}>
          노트
        </ThemedText>
      </View>

      <View style={styles.controls}>
        {MODES.map((m) => (
          <Chip
            key={m.key}
            label={m.label}
            selected={mode === m.key}
            onPress={() => changeMode(m.key)}
          />
        ))}
        <Chip label="순서 섞기" onPress={() => setOrder(shuffled(rows.map((w) => w.id)))} />
      </View>

      <ThemedText type="caption" themeColor="textTertiary" style={styles.hint}>
        {mode === 'none'
          ? '가릴 항목을 고르면 노트를 덮고 외울 수 있어요.'
          : '가려진 칸을 누르면 그 줄만 확인할 수 있어요.'}
      </ThemedText>

      {rows.length === 0 ? (
        <ThemedText type="body" themeColor="textSecondary">
          이 단어장에는 아직 단어가 없습니다.
        </ThemedText>
      ) : (
        <View style={styles.body} onLayout={handleLayout}>
          {/* 모눈: 24px 간격 가로·세로 선 */}
          <View style={styles.grid} pointerEvents="none">
            {Array.from({ length: Math.floor(bodyHeight / GRID) }, (_, i) => (
              <View key={`h${i}`} style={[styles.gridH, { top: (i + 1) * GRID }]} />
            ))}
            {Array.from({ length: Math.floor(bodyWidth / GRID) }, (_, i) => (
              <View key={`v${i}`} style={[styles.gridV, { left: (i + 1) * GRID }]} />
            ))}
          </View>

          {rows.map((word, i) => {
            const open = revealed.includes(word.id);
            const termHidden = mode === 'term' && !open;
            const meaningHidden = mode === 'meaning' && !open;

            return (
              <View key={word.id} style={styles.row}>
                <View style={styles.numberCell}>
                  <ThemedText type="noteNumber" themeColor="textSecondary">
                    {i + 1}
                  </ThemedText>
                </View>

                <Pressable
                  style={[styles.cell, termHidden && styles.masked]}
                  onPress={() => (termHidden ? toggleRow(word.id) : undefined)}
                  disabled={!termHidden}>
                  <ThemedText
                    type="noteTerm"
                    style={[styles.term, termHidden && styles.maskedText]}
                    numberOfLines={1}>
                    {termHidden ? '________' : word.term}
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.cell, styles.meaningCell, meaningHidden && styles.masked]}
                  onPress={() => (meaningHidden ? toggleRow(word.id) : undefined)}
                  disabled={!meaningHidden}>
                  <ThemedText
                    type="noteMeaning"
                    style={[styles.meaning, meaningHidden && styles.maskedText]}
                    numberOfLines={1}>
                    {meaningHidden ? '________' : word.meaning}
                  </ThemedText>
                </Pressable>
              </View>
            );
          })}
        </View>
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
  headerLabel: {
    fontSize: 12,
    letterSpacing: 0.6,
  },

  controls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  hint: {
    fontSize: 12,
    marginBottom: 16,
  },

  body: {
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    overflow: 'hidden',
  },
  grid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridH: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GRID_COLOR,
  },
  gridV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: GRID_COLOR,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    borderBottomWidth: Border.hair,
    borderBottomColor: ROW_LINE,
  },
  numberCell: {
    width: NUMBER_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    borderRightWidth: Border.hair,
    borderRightColor: NUMBER_LINE,
  },
  cell: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  meaningCell: {
    borderLeftWidth: Border.hair,
    borderLeftColor: MEANING_LINE,
    borderStyle: 'dashed',
  },
  term: {
    color: theme.ink,
    transform: [{ rotate: '-0.6deg' }],
  },
  meaning: {
    color: theme.inkMuted,
    transform: [{ rotate: '0.5deg' }],
  },
  masked: {
    backgroundColor: MASK_BG,
  },
  maskedText: {
    color: MASK_TEXT,
  },
});

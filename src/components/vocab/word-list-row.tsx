import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Checkbox } from '@/components/common/checkbox';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors, FontFamily } from '@/constants/theme';
import { Word } from '@/types';

const theme = Colors.light;

interface WordListRowProps {
  index: number;
  word: Word;
  checked: boolean;
  /** 뜻을 기본으로 펼쳐서 볼지 (목록 상단 토글과 연동) */
  revealAll: boolean;
  onToggleChecked: () => void;
  onToggleFavorite: () => void;
  onUpdate: (patch: Partial<Omit<Word, 'id' | 'deckId'>>) => void;
  onRemove: () => void;
}

export function WordListRow({
  index,
  word,
  checked,
  revealAll,
  onToggleChecked,
  onToggleFavorite,
  onUpdate,
  onRemove,
}: WordListRowProps) {
  const [meaningRevealed, setMeaningRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    term: word.term,
    meaning: word.meaning,
    tags: word.tags.join(', '),
  });

  const revealed = revealAll || meaningRevealed;
  const done = word.status === '암기완료';

  const commitEdit = () => {
    onUpdate({
      term: draft.term.trim(),
      meaning: draft.meaning.trim(),
      tags: parseTags(draft.tags),
    });
    setEditing(false);
  };

  const startEdit = () => {
    // 편집을 열 때마다 최신값으로 초안을 다시 채운다.
    setDraft({
      term: word.term,
      meaning: word.meaning,
      tags: word.tags.join(', '),
    });
    setEditing(true);
  };

  return (
    <View style={styles.row}>
      <View style={styles.topRow}>
        <Checkbox checked={checked} onPress={onToggleChecked} />
        <ThemedText type="meta" themeColor="textSecondary">
          {index + 1}
        </ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: done ? theme.ink : theme.surface }]}>
          <ThemedText
            type="labelKo"
            style={[styles.statusText, { color: done ? theme.onInk : theme.ink }]}>
            {word.status}
          </ThemedText>
        </View>

        <View style={styles.spacer} />

        <Pressable onPress={onToggleFavorite} hitSlop={8}>
          <Ionicons
            name={word.isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={word.isFavorite ? theme.favorite : theme.textSecondary}
          />
        </Pressable>
        <Pressable onPress={editing ? commitEdit : startEdit} hitSlop={8}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.actionLink}>
            {editing ? '완료' : '수정'}
          </ThemedText>
        </Pressable>
        <Pressable onPress={onRemove} hitSlop={8}>
          <ThemedText type="caption" themeColor="textSecondary" style={styles.actionLink}>
            삭제
          </ThemedText>
        </Pressable>
      </View>

      {editing ? (
        <View style={styles.editArea}>
          <TextField
            value={draft.term}
            onChangeText={(term) => setDraft((d) => ({ ...d, term }))}
            placeholder="단어"
            autoCapitalize="none"
          />
          <TextField
            value={draft.meaning}
            onChangeText={(meaning) => setDraft((d) => ({ ...d, meaning }))}
            placeholder="뜻"
          />
          <TextField
            emphasis="secondary"
            value={draft.tags}
            onChangeText={(tags) => setDraft((d) => ({ ...d, tags }))}
            placeholder="태그 (쉼표로 구분)"
            autoCapitalize="none"
          />
        </View>
      ) : (
        <>
          <ThemedText style={styles.term}>{word.term}</ThemedText>
          <Pressable onPress={() => setMeaningRevealed((v) => !v)}>
            <ThemedText type="body" themeColor={revealed ? 'ink' : 'textTertiary'}>
              {revealed ? word.meaning : '뜻 가림 · 눌러서 표시'}
            </ThemedText>
          </Pressable>
        </>
      )}

      {word.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {word.tags.map((tag) => (
            <View key={tag} style={styles.tag}>
              <ThemedText type="labelKo" themeColor="textSecondary" style={styles.tagText}>
                {tag}
              </ThemedText>
            </View>
          ))}
        </View>
      ) : null}

      <ThemedText type="caption" themeColor="textSecondary" style={styles.registered}>
        등록일 {dayjs(word.registeredAt).format('YYYY.MM.DD')}
      </ThemedText>
    </View>
  );
}

/** "a, b,  c" → ["a","b","c"] (빈 값과 중복 제거) */
export function parseTags(raw: string): string[] {
  const parts = raw
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  return [...new Set(parts)];
}

const styles = StyleSheet.create({
  row: {
    paddingVertical: 16,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusText: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  actionLink: {
    textDecorationLine: 'underline',
  },
  term: {
    fontFamily: FontFamily.displayBold,
    fontSize: 18,
    color: theme.ink,
  },
  editArea: {
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    borderWidth: Border.hair,
    borderColor: theme.line,
    borderRadius: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  registered: {
    fontSize: 11,
  },
});

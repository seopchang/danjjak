import dayjs from 'dayjs';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/common/card';
import { Checkbox } from '@/components/common/checkbox';
import { Chip } from '@/components/common/chip';
import { IconButton } from '@/components/common/icon-button';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Word } from '@/types';

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
  const theme = useTheme();
  const [meaningRevealed, setMeaningRevealed] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({
    term: word.term,
    meaning: word.meaning,
    tags: word.tags.join(', '),
  });

  const revealed = revealAll || meaningRevealed;

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
    <Card>
      <View style={styles.topRow}>
        <Checkbox checked={checked} onPress={onToggleChecked} />
        <ThemedText type="small" themeColor="textSecondary">
          {index + 1}
        </ThemedText>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                word.status === '암기완료' ? theme.primary : theme.backgroundElement,
            },
          ]}>
          <ThemedText
            type="small"
            style={{ color: word.status === '암기완료' ? theme.primaryText : theme.text }}>
            {word.status}
          </ThemedText>
        </View>
        <View style={styles.spacer} />
        <IconButton
          name={word.isFavorite ? 'star' : 'star-outline'}
          onPress={onToggleFavorite}
          size={18}
          color={word.isFavorite ? 'favorite' : 'textSecondary'}
        />
        <IconButton
          name={editing ? 'checkmark' : 'pencil-outline'}
          onPress={editing ? commitEdit : startEdit}
          size={16}
          color="textSecondary"
        />
        <IconButton name="trash-outline" onPress={onRemove} size={16} color="danger" />
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
            value={draft.tags}
            onChangeText={(tags) => setDraft((d) => ({ ...d, tags }))}
            placeholder="태그 (쉼표로 구분)"
            autoCapitalize="none"
          />
        </View>
      ) : (
        <>
          <ThemedText type="smallBold" style={styles.term}>
            {word.term}
          </ThemedText>
          <Pressable onPress={() => setMeaningRevealed((v) => !v)}>
            <ThemedText type="small" themeColor={revealed ? 'text' : 'placeholder'}>
              {revealed ? word.meaning : '뜻 가림 · 눌러서 표시'}
            </ThemedText>
          </Pressable>
        </>
      )}

      {word.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {word.tags.map((tag) => (
            <Chip key={tag} label={tag} />
          ))}
        </View>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        등록일 {dayjs(word.registeredAt).format('YYYY.MM.DD')}
      </ThemedText>
    </Card>
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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  spacer: {
    flex: 1,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  term: {
    fontSize: 18,
    lineHeight: 24,
  },
  editArea: {
    gap: 8,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
});

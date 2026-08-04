import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Chip } from '@/components/common/chip';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { parseTags } from '@/components/vocab/word-list-row';
import { useWordsStore } from '@/stores/words-store';

interface WordRegisterFormProps {
  deckId: string;
  /** 이 덱에서 이미 쓰인 태그들 — 눌러서 바로 넣을 수 있게 보여준다. */
  knownTags: string[];
}

export function WordRegisterForm({ deckId, knownTags }: WordRegisterFormProps) {
  const addWord = useWordsStore((s) => s.addWord);

  const [term, setTerm] = useState('');
  const [meaning, setMeaning] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const canSubmit = term.trim().length > 0 && meaning.trim().length > 0;

  const toggleTag = (tag: string) => {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  const handleAdd = () => {
    if (!canSubmit) return;
    const typed = parseTags(tagInput);
    addWord({
      deckId,
      term,
      meaning,
      tags: [...new Set([...tags, ...typed])],
    });
    setTerm('');
    setMeaning('');
    setTags([]);
    setTagInput('');
  };

  return (
    <View style={styles.block}>
      <ThemedText type="sectionHeading">단어 추가</ThemedText>
      <TextField
        value={term}
        onChangeText={setTerm}
        placeholder="단어 (예: abandon)"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <TextField value={meaning} onChangeText={setMeaning} placeholder="뜻 (예: 버리다, 포기하다)" />

      {knownTags.length > 0 ? (
        <View style={styles.tagRow}>
          {knownTags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              selected={tags.includes(tag)}
              onPress={() => toggleTag(tag)}
            />
          ))}
        </View>
      ) : null}

      <TextField
        emphasis="secondary"
        value={tagInput}
        onChangeText={setTagInput}
        placeholder="새 태그 (쉼표로 구분, 선택)"
        autoCapitalize="none"
      />

      <Button label="추가" onPress={handleAdd} disabled={!canSubmit} style={styles.submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 12,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  submit: {
    marginTop: 4,
  },
});

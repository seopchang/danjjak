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
import { deckWords, useWordsStore } from '@/stores/words-store';
import { useSessionsStore } from '@/stores/sessions-store';

export default function DeckListScreen() {
  const theme = useTheme();
  const decks = useDecksStore((s) => s.decks);
  const addDeck = useDecksStore((s) => s.addDeck);
  const removeDeck = useDecksStore((s) => s.removeDeck);
  const words = useWordsStore((s) => s.words);
  const removeWordsOfDeck = useWordsStore((s) => s.removeWordsOfDeck);
  const removeSessionsOfDeck = useSessionsStore((s) => s.removeSessionsOfDeck);

  const [newName, setNewName] = useState('');

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

  const handleAdd = () => {
    const name = newName.trim();
    if (!name) return;
    addDeck(name);
    setNewName('');
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

      <Card>
        <ThemedText type="smallBold">새 단어장</ThemedText>
        <View style={styles.addRow}>
          <TextField
            placeholder="예: 토익 필수, 수능 영단어"
            value={newName}
            onChangeText={setNewName}
            onSubmitEditing={handleAdd}
            returnKeyType="done"
            style={styles.addInput}
          />
          <Button label="추가" onPress={handleAdd} disabled={!newName.trim()} />
        </View>
      </Card>

      {list.length === 0 ? (
        <Card>
          <ThemedText type="smallBold">아직 단어장이 없습니다.</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            위에서 단어장을 하나 만들어 시작해보세요.
          </ThemedText>
        </Card>
      ) : null}

      {list.map(({ deck, total, done }) => (
        <Pressable key={deck.id} onPress={() => router.push(`/deck/${deck.id}`)}>
          <Card>
            <View style={styles.deckHead}>
              <ThemedText type="smallBold" style={styles.deckName} numberOfLines={1}>
                {deck.name}
              </ThemedText>
              <IconButton
                name="trash-outline"
                onPress={() => handleDelete(deck.id, deck.name)}
                size={18}
                color="textSecondary"
              />
            </View>
            <View style={styles.metaRow}>
              <ThemedText type="small" themeColor="textSecondary">
                단어 {total}개 · 암기완료 {done}개 · 미암기 {total - done}개
              </ThemedText>
              <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
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
          </Card>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
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
  deckHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  deckName: {
    flex: 1,
    fontSize: 18,
    lineHeight: 24,
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

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { shuffled } from '@/utils/shuffle';

export default function StudyModeScreen() {
  const { deckId, mode, shuffle, favorites } = useLocalSearchParams<{
    deckId: string;
    mode: 'memorize' | 'review';
    shuffle?: string;
    favorites?: string;
  }>();
  const theme = useTheme();
  const allWords = useWordsStore((s) => s.words);
  const markStatus = useWordsStore((s) => s.markStatus);
  const addSession = useSessionsStore((s) => s.addSession);

  const isMemorize = mode === 'memorize';
  const targetStatus = isMemorize ? '미암기' : '암기완료';

  // 큐는 화면에 들어온 시점에 한 번만 정한다.
  // (학습 처리로 status가 바뀌어도 목록이 도중에 흔들리지 않게 하기 위함)
  const [queue] = useState(() => {
    let targets = deckWords(allWords, deckId).filter((w) => w.status === targetStatus);
    if (favorites === '1') targets = targets.filter((w) => w.isFavorite);
    if (!isMemorize) {
      // 복습: 마지막 학습일이 오래된 순 (한 번도 복습 안 한 단어가 먼저)
      targets = [...targets].sort((a, b) =>
        (a.lastReviewedAt ?? '').localeCompare(b.lastReviewedAt ?? '')
      );
    }
    const ids = targets.map((w) => w.id);
    return shuffle === '1' ? shuffled(ids) : ids;
  });

  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const currentWord = useMemo(
    () => allWords.find((w) => w.id === queue[index]),
    [allWords, queue, index]
  );

  const finishSession = (testedCount: number, correct: number, incorrect: number) => {
    if (!finished && correct + incorrect > 0) {
      addSession({
        deckId,
        type: isMemorize ? '암기' : '복습',
        date: new Date().toISOString(),
        testedWordIds: queue.slice(0, testedCount),
        correctCount: correct,
        incorrectCount: incorrect,
        accuracy: Math.round((correct / (correct + incorrect)) * 100),
        durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        scopeLabel: `${isMemorize ? '암기' : '복습'} 테스트${favorites === '1' ? ' (즐겨찾기)' : ''}`,
      });
    }
    setFinished(true);
  };

  const handleAction = (isCorrect: boolean) => {
    if (!currentWord) return;
    markStatus(currentWord.id, isCorrect ? '암기완료' : '미암기');
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextIncorrect = incorrectCount + (isCorrect ? 0 : 1);
    setCorrectCount(nextCorrect);
    setIncorrectCount(nextIncorrect);

    setRevealed(false);
    if (index + 1 >= queue.length) {
      finishSession(index + 1, nextCorrect, nextIncorrect);
    } else {
      setIndex((i) => i + 1);
    }
  };

  const modeLabel = isMemorize ? '암기하기' : '복습하기';

  if (queue.length === 0 || finished || !currentWord) {
    return (
      <Screen>
        <View style={styles.header}>
          <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
          <ThemedText type="smallBold">{modeLabel} 모드</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <Card>
          <ThemedText type="smallBold">
            {queue.length === 0 ? '학습할 단어가 없습니다.' : '학습을 완료했습니다.'}
          </ThemedText>
          {finished ? (
            <ThemedText type="small" themeColor="textSecondary">
              {isMemorize ? '암기 완료' : '기억함'} {correctCount}개 · 미암기 {incorrectCount}개
            </ThemedText>
          ) : null}
          <Button label="모드 종료" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
        <ThemedText type="smallBold">{modeLabel} 모드</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <Card style={{ backgroundColor: theme.backgroundElement }}>
        <ThemedText type="small">
          {isMemorize
            ? '암기하기 모드: 미암기 단어만 나옵니다. 뜻 확인 후 암기 완료 또는 미암기로 처리하세요.'
            : '복습하기 모드: 오래 안 본 단어부터 나옵니다. 뜻 확인 후 기억함 또는 미암기로 처리하세요.'}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          진행률 {index + 1}/{queue.length}
        </ThemedText>
      </Card>

      <Card style={styles.wordCard}>
        <ThemedText type="title" style={styles.term}>
          {currentWord.term}
        </ThemedText>
        <Pressable
          onPress={() => setRevealed((v) => !v)}
          style={[styles.meaningBox, { borderColor: theme.border }]}>
          <ThemedText type="default" themeColor={revealed ? 'text' : 'placeholder'}>
            {revealed ? currentWord.meaning : '뜻 가림 · 눌러서 표시'}
          </ThemedText>
        </Pressable>
        {revealed && currentWord.example ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.example}>
            {currentWord.example}
          </ThemedText>
        ) : null}
      </Card>

      <View style={styles.actionRow}>
        <Button
          label={isMemorize ? '암기 완료' : '기억함'}
          variant="primary"
          onPress={() => handleAction(true)}
          style={styles.actionButton}
        />
        <Button
          label="미암기"
          variant="danger"
          onPress={() => handleAction(false)}
          style={styles.actionButton}
        />
      </View>

      <Button
        label="학습 모드 종료"
        variant="ghost"
        onPress={() => finishSession(index, correctCount, incorrectCount)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  term: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  meaningBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  example: {
    textAlign: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { Chip } from '@/components/common/chip';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { RecallDirection, Word } from '@/types';
import { shuffled } from '@/utils/shuffle';

const CHOICE_COUNT = 4;
/** 정답을 보여주고 다음 문제로 넘어가기까지의 시간(ms) */
const NEXT_DELAY = 650;

interface RecallQuestion {
  wordId: string;
  prompt: string;
  choices: string[];
  answer: string;
}

/**
 * 4지선다 문제를 만든다.
 * - meaningToTerm: 뜻을 보여주고 단어를 고른다 (기본)
 * - termToMeaning: 단어를 보여주고 뜻을 고른다
 *
 * 오답 보기는 같은 덱의 다른 단어에서 뽑되, 표시 텍스트가 같은 것은 제외해
 * "정답이 두 개로 보이는" 문제를 막는다.
 */
function buildQuestions(pool: Word[], direction: RecallDirection): RecallQuestion[] {
  const labelOf = (w: Word) => (direction === 'meaningToTerm' ? w.term : w.meaning);
  const promptOf = (w: Word) => (direction === 'meaningToTerm' ? w.meaning : w.term);

  return shuffled(pool).map((word) => {
    const answer = labelOf(word);
    const distractors = shuffled(pool.filter((w) => w.id !== word.id && labelOf(w) !== answer))
      .slice(0, CHOICE_COUNT - 1)
      .map(labelOf);
    return {
      wordId: word.id,
      prompt: promptOf(word),
      choices: shuffled([answer, ...distractors]),
      answer,
    };
  });
}

export default function RecallModeScreen() {
  const { deckId, favorites } = useLocalSearchParams<{
    deckId: string;
    favorites?: string;
  }>();
  const theme = useTheme();
  const allWords = useWordsStore((s) => s.words);
  const markStatus = useWordsStore((s) => s.markStatus);
  const addSession = useSessionsStore((s) => s.addSession);

  const [direction, setDirection] = useState<RecallDirection>('meaningToTerm');
  const [round, setRound] = useState(0);

  const pool = useMemo(() => {
    const base = deckWords(allWords, deckId);
    return favorites === '1' ? base.filter((w) => w.isFavorite) : base;
    // round가 바뀔 때만 새 문제를 만들기 위해 pool은 단어 목록 변화에 반응하지 않게 둔다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId, favorites, round]);

  // 방향이나 라운드가 바뀌면 문제를 새로 만든다.
  const questions = useMemo(
    () => (pool.length >= CHOICE_COUNT ? buildQuestions(pool, direction) : []),
    [pool, direction]
  );

  const startedAt = useRef(Date.now());
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = questions[index];

  const finishSession = (testedCount: number, correct: number, incorrect: number) => {
    if (!finished && correct + incorrect > 0) {
      addSession({
        deckId,
        type: '리콜',
        date: new Date().toISOString(),
        testedWordIds: questions.slice(0, testedCount).map((q) => q.wordId),
        correctCount: correct,
        incorrectCount: incorrect,
        accuracy: Math.round((correct / (correct + incorrect)) * 100),
        durationSeconds: Math.round((Date.now() - startedAt.current) / 1000),
        scopeLabel: `리콜 테스트${favorites === '1' ? ' (즐겨찾기)' : ''}`,
      });
    }
    setFinished(true);
  };

  const restart = () => {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setCorrectCount(0);
    setIncorrectCount(0);
    setFinished(false);
    startedAt.current = Date.now();
  };

  const pick = (choice: string) => {
    if (picked != null || !current) return;
    setPicked(choice);
    const isCorrect = choice === current.answer;
    markStatus(current.wordId, isCorrect ? '암기완료' : '미암기');
    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextIncorrect = incorrectCount + (isCorrect ? 0 : 1);
    setCorrectCount(nextCorrect);
    setIncorrectCount(nextIncorrect);

    setTimeout(() => {
      setPicked(null);
      if (index + 1 >= questions.length) {
        finishSession(index + 1, nextCorrect, nextIncorrect);
      } else {
        setIndex((i) => i + 1);
      }
    }, NEXT_DELAY);
  };

  if (questions.length === 0 || finished || !current) {
    const accuracy =
      correctCount + incorrectCount > 0
        ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
        : 0;
    return (
      <Screen>
        <View style={styles.header}>
          <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
          <ThemedText type="smallBold">리콜 테스트</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <Card>
          <ThemedText type="smallBold">
            {questions.length === 0
              ? '리콜 테스트를 만들 단어가 부족합니다. (4개 이상 필요)'
              : '리콜 테스트를 완료했습니다.'}
          </ThemedText>
          {finished ? (
            <ThemedText type="small" themeColor="textSecondary">
              정답 {correctCount}개 · 오답 {incorrectCount}개 · 정답률 {accuracy}%
            </ThemedText>
          ) : null}
          {questions.length > 0 ? (
            <Button label="다시 풀기" variant="ghost" onPress={restart} />
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
        <ThemedText type="smallBold">리콜 테스트</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <Card style={{ backgroundColor: theme.backgroundElement }}>
        <ThemedText type="small">
          {direction === 'meaningToTerm'
            ? '뜻을 보고 알맞은 단어를 고르세요.'
            : '단어를 보고 알맞은 뜻을 고르세요.'}{' '}
          정답이면 암기완료, 오답이면 미암기로 처리됩니다.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          진행률 {index + 1}/{questions.length}
        </ThemedText>
        <View style={styles.directionRow}>
          <Chip
            label="뜻 → 단어"
            selected={direction === 'meaningToTerm'}
            onPress={() => {
              if (direction === 'meaningToTerm') return;
              setDirection('meaningToTerm');
              restart();
            }}
          />
          <Chip
            label="단어 → 뜻"
            selected={direction === 'termToMeaning'}
            onPress={() => {
              if (direction === 'termToMeaning') return;
              setDirection('termToMeaning');
              restart();
            }}
          />
        </View>
      </Card>

      <Card style={styles.questionCard}>
        <ThemedText type="small" themeColor="textSecondary">
          {direction === 'meaningToTerm' ? '다음 뜻에 해당하는 단어는?' : '다음 단어의 뜻은?'}
        </ThemedText>
        <ThemedText type="default" style={styles.prompt}>
          {current.prompt}
        </ThemedText>
      </Card>

      <View style={styles.choices}>
        {current.choices.map((choice) => {
          const isAnswer = picked != null && choice === current.answer;
          const isWrongPick = picked === choice && choice !== current.answer;
          return (
            <Pressable
              key={choice}
              onPress={() => pick(choice)}
              style={[
                styles.choice,
                { borderColor: theme.border, backgroundColor: theme.card },
                isAnswer && { backgroundColor: theme.primary, borderColor: theme.primary },
                isWrongPick && { backgroundColor: theme.backgroundSelected },
              ]}>
              <ThemedText
                type="default"
                style={isAnswer ? { color: theme.primaryText } : undefined}>
                {choice}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      <Button
        label="테스트 종료"
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
  directionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  questionCard: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  prompt: {
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 28,
  },
  choices: {
    gap: 8,
  },
  choice: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
});

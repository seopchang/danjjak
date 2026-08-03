import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { SlideDirection, useFlashCardMotion } from '@/hooks/use-flash-card-motion';
import { useTheme } from '@/hooks/use-theme';
import { useDecksStore } from '@/stores/decks-store';
import { useSessionsStore } from '@/stores/sessions-store';
import { useWordsStore } from '@/stores/words-store';
import { buildDailyReviewQueue, DAILY_REVIEW_LIMIT } from '@/utils/review-queue';

interface Answer {
  wordId: string;
  deckId: string;
  isCorrect: boolean;
}

/**
 * 매일 복습 화면.
 *
 * 덱을 가리지 않고 전체 단어에서 "미암기 먼저, 그 다음 본 지 오래된 순"으로
 * 최대 50개를 뽑아 한 번에 훑는다. 자정 알림을 눌렀을 때 열리는 화면이기도 하다.
 */
export default function DailyReviewScreen() {
  const theme = useTheme();
  const allWords = useWordsStore((s) => s.words);
  const markStatus = useWordsStore((s) => s.markStatus);
  const decks = useDecksStore((s) => s.decks);
  const addSession = useSessionsStore((s) => s.addSession);

  // 큐는 화면에 들어온 시점에 한 번만 정한다.
  const [queue] = useState(() => buildDailyReviewQueue(allWords).map((w) => w.id));

  const startedAt = useRef(Date.now());
  const answers = useRef<Answer[]>([]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const [sliding, setSliding] = useState(false);

  const { cardStyle, meaningStyle, slideOut, slideIn, settle } = useFlashCardMotion(revealed);

  const currentWord = useMemo(
    () => allWords.find((w) => w.id === queue[index]),
    [allWords, queue, index]
  );

  const deckName = useMemo(() => {
    if (!currentWord) return '';
    return decks.find((d) => d.id === currentWord.deckId)?.name ?? '';
  }, [decks, currentWord]);

  /**
   * 여러 덱의 단어가 섞여 있으므로 덱별로 나눠 학습 기록을 남긴다.
   * (StudySession은 덱 하나에 속하는 구조라 통계 화면이 덱 단위로 읽는다)
   */
  const finishReview = () => {
    if (finished) return;
    setFinished(true);

    const byDeck = new Map<string, Answer[]>();
    for (const answer of answers.current) {
      const list = byDeck.get(answer.deckId);
      if (list) list.push(answer);
      else byDeck.set(answer.deckId, [answer]);
    }

    const durationSeconds = Math.round((Date.now() - startedAt.current) / 1000);
    for (const [deckId, list] of byDeck) {
      const correct = list.filter((a) => a.isCorrect).length;
      const incorrect = list.length - correct;
      addSession({
        deckId,
        type: '복습',
        date: new Date().toISOString(),
        testedWordIds: list.map((a) => a.wordId),
        correctCount: correct,
        incorrectCount: incorrect,
        accuracy: list.length > 0 ? Math.round((correct / list.length) * 100) : 0,
        durationSeconds,
        scopeLabel: '매일 복습',
      });
    }
  };

  const commitAction = (isCorrect: boolean, direction: SlideDirection) => {
    const word = allWords.find((w) => w.id === queue[index]);
    if (word) {
      markStatus(word.id, isCorrect ? '암기완료' : '미암기');
      answers.current.push({ wordId: word.id, deckId: word.deckId, isCorrect });
    }

    setCorrectCount((c) => c + (isCorrect ? 1 : 0));
    setIncorrectCount((c) => c + (isCorrect ? 0 : 1));
    setRevealed(false);

    if (index + 1 >= queue.length) {
      finishReview();
      settle();
    } else {
      setIndex((i) => i + 1);
      slideIn(direction);
    }
    setSliding(false);
  };

  const handleAction = (isCorrect: boolean) => {
    if (!currentWord || sliding) return;
    setSliding(true);
    const direction: SlideDirection = isCorrect ? -1 : 1;
    slideOut(direction, () => commitAction(isCorrect, direction));
  };

  if (queue.length === 0 || finished || !currentWord) {
    return (
      <Screen>
        <View style={styles.header}>
          <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
          <ThemedText type="smallBold">매일 복습</ThemedText>
          <View style={{ width: 24 }} />
        </View>
        <Card>
          <ThemedText type="smallBold">
            {queue.length === 0 ? '복습할 단어가 없습니다.' : '오늘 복습을 마쳤습니다.'}
          </ThemedText>
          {queue.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              단어장에 단어를 먼저 등록해주세요.
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary">
              기억함 {correctCount}개 · 미암기 {incorrectCount}개
            </ThemedText>
          )}
          <Button label="단어장으로" onPress={() => router.replace('/')} />
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
        <ThemedText type="smallBold">매일 복습</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <Card style={{ backgroundColor: theme.backgroundElement }}>
        <ThemedText type="small">
          미암기 단어를 먼저, 그다음 본 지 오래된 단어를 최대 {DAILY_REVIEW_LIMIT}개까지 모았습니다.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          진행률 {index + 1}/{queue.length}
        </ThemedText>
      </Card>

      <Animated.View style={cardStyle}>
        <Card style={styles.wordCard}>
          {deckName ? (
            <ThemedText type="small" themeColor="textSecondary">
              {deckName}
            </ThemedText>
          ) : null}
          <ThemedText type="title" style={styles.term}>
            {currentWord.term}
          </ThemedText>
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            style={[styles.meaningBox, { borderColor: theme.border }]}>
            {revealed ? (
              <Animated.View style={meaningStyle}>
                <ThemedText type="default">{currentWord.meaning}</ThemedText>
              </Animated.View>
            ) : (
              <ThemedText type="default" themeColor="placeholder">
                뜻 가림 · 눌러서 표시
              </ThemedText>
            )}
          </Pressable>
        </Card>
      </Animated.View>

      <View style={styles.actionRow}>
        <Button
          label="기억함"
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

      <Button label="복습 종료" variant="ghost" onPress={finishReview} />
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
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
});

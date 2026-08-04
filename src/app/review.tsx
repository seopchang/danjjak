import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/common/button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { SlideDirection, useFlashCardMotion } from '@/hooks/use-flash-card-motion';
import { useDecksStore } from '@/stores/decks-store';
import { useSessionsStore } from '@/stores/sessions-store';
import { useWordsStore } from '@/stores/words-store';
import { buildDailyReviewQueue, DAILY_REVIEW_LIMIT } from '@/utils/review-queue';

const theme = Colors.light;

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

  const Header = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <ThemedText type="screenTitle">←</ThemedText>
      </Pressable>
      <ThemedText type="screenTitle">매일 복습</ThemedText>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (queue.length === 0 || finished || !currentWord) {
    const nothingToReview = queue.length === 0;
    return (
      <Screen>
        <Header />
        <View style={styles.summary}>
          {!nothingToReview ? (
            <Image
              source={require('../../assets/illustrations/complete-badge.png')}
              style={styles.summaryArt}
              resizeMode="contain"
            />
          ) : null}
          <ThemedText type="sectionHeading" style={styles.summaryTitle}>
            {nothingToReview ? '복습할 단어가 없습니다.' : '오늘 복습을 마쳤습니다.'}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary" style={styles.summaryResult}>
            {nothingToReview
              ? '단어장에 단어를 먼저 등록해주세요.'
              : `기억함 ${correctCount}개 · 미암기 ${incorrectCount}개`}
          </ThemedText>
          <Button
            label="단어장으로"
            onPress={() => router.replace('/')}
            style={styles.summaryButton}
          />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header />

      <View style={styles.guide}>
        <ThemedText type="caption">
          미암기 단어를 먼저, 그다음 오래된 단어 순으로 최대 {DAILY_REVIEW_LIMIT}개를 모았어요.
        </ThemedText>
        <ThemedText type="metaSemi" themeColor="textSecondary">
          {index + 1}/{queue.length}
        </ThemedText>
      </View>

      <Animated.View style={cardStyle}>
        <View style={styles.wordCard}>
          {deckName ? (
            <ThemedText type="labelKo" themeColor="textSecondary" style={styles.deckName}>
              {deckName}
            </ThemedText>
          ) : null}
          <ThemedText type="term" style={styles.term}>
            {currentWord.term}
          </ThemedText>
          <Pressable onPress={() => setRevealed((v) => !v)} style={styles.meaningBox}>
            {revealed ? (
              <Animated.View style={meaningStyle}>
                <ThemedText type="body" style={styles.meaningText}>
                  {currentWord.meaning}
                </ThemedText>
              </Animated.View>
            ) : (
              <ThemedText type="body" themeColor="textTertiary" style={styles.meaningText}>
                뜻 가림 · 눌러서 표시
              </ThemedText>
            )}
          </Pressable>
        </View>
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
    borderBottomWidth: Border.strong,
    borderBottomColor: theme.ink,
    paddingBottom: 24,
    marginBottom: 24,
  },
  headerSpacer: {
    width: 24,
  },

  guide: {
    borderLeftWidth: Border.strong,
    borderLeftColor: theme.ink,
    paddingLeft: 14,
    paddingVertical: 4,
    gap: 6,
    marginBottom: 24,
  },

  wordCard: {
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    paddingVertical: 44,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 18,
  },
  deckName: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  term: {
    textAlign: 'center',
  },
  meaningBox: {
    borderWidth: Border.hair,
    borderColor: theme.ink,
    borderRadius: 0,
    paddingHorizontal: 18,
    paddingVertical: 12,
    minWidth: 160,
    alignItems: 'center',
  },
  meaningText: {
    textAlign: 'center',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
  },

  summary: {
    gap: 14,
    paddingVertical: 12,
  },
  summaryArt: {
    width: 88,
    height: 88,
    alignSelf: 'center',
  },
  summaryTitle: {
    textAlign: 'center',
  },
  summaryResult: {
    textAlign: 'center',
  },
  summaryButton: {
    marginTop: 4,
  },
});

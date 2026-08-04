import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { Button } from '@/components/common/button';
import { Screen } from '@/components/common/screen';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { SlideDirection, useFlashCardMotion } from '@/hooks/use-flash-card-motion';
import { useSessionsStore } from '@/stores/sessions-store';
import { deckWords, useWordsStore } from '@/stores/words-store';
import { shuffled } from '@/utils/shuffle';

const theme = Colors.light;

export default function StudyModeScreen() {
  const { deckId, mode, shuffle, favorites } = useLocalSearchParams<{
    deckId: string;
    mode: 'memorize' | 'review';
    shuffle?: string;
    favorites?: string;
  }>();
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
  // 카드가 넘어가는 중에는 버튼을 두 번 누르지 못하게 막는다.
  const [sliding, setSliding] = useState(false);

  const { cardStyle, meaningStyle, slideOut, slideIn, settle } = useFlashCardMotion(revealed);

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

  /** 카드가 빠져나간 뒤 실제 채점과 다음 카드 진입을 처리한다. */
  const commitAction = (isCorrect: boolean, direction: SlideDirection) => {
    const word = allWords.find((w) => w.id === queue[index]);
    if (word) markStatus(word.id, isCorrect ? '암기완료' : '미암기');

    const nextCorrect = correctCount + (isCorrect ? 1 : 0);
    const nextIncorrect = incorrectCount + (isCorrect ? 0 : 1);
    setCorrectCount(nextCorrect);
    setIncorrectCount(nextIncorrect);
    setRevealed(false);

    if (index + 1 >= queue.length) {
      finishSession(index + 1, nextCorrect, nextIncorrect);
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
    // 아는 단어는 왼쪽으로, 모르는 단어는 오른쪽으로 밀려난다.
    const direction: SlideDirection = isCorrect ? -1 : 1;
    slideOut(direction, () => commitAction(isCorrect, direction));
  };

  const modeLabel = isMemorize ? '암기하기' : '복습하기';

  const Header = () => (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} hitSlop={10}>
        <ThemedText type="screenTitle">←</ThemedText>
      </Pressable>
      <ThemedText type="screenTitle">{modeLabel} 모드</ThemedText>
      <View style={styles.headerSpacer} />
    </View>
  );

  if (queue.length === 0 || finished || !currentWord) {
    const nothingToStudy = queue.length === 0;
    return (
      <Screen>
        <Header />
        <View style={styles.summary}>
          {!nothingToStudy ? (
            <Image
              source={require('../../../../assets/illustrations/complete-badge.png')}
              style={styles.summaryArt}
              resizeMode="contain"
            />
          ) : null}
          <ThemedText type="sectionHeading" style={styles.summaryTitle}>
            {nothingToStudy ? '학습할 단어가 없습니다.' : '학습을 완료했습니다.'}
          </ThemedText>
          {finished ? (
            <ThemedText type="body" themeColor="textSecondary" style={styles.summaryResult}>
              {isMemorize ? '암기 완료' : '기억함'} {correctCount}개 · 미암기 {incorrectCount}개
            </ThemedText>
          ) : null}
          <Button label="모드 종료" onPress={() => router.back()} style={styles.summaryButton} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <Header />

      <View style={styles.guide}>
        <ThemedText type="caption">
          {isMemorize
            ? '암기하기 모드: 미암기 단어만 나옵니다. 뜻 확인 후 암기 완료 또는 미암기로 처리하세요.'
            : '복습하기 모드: 오래 안 본 단어부터 나옵니다. 뜻 확인 후 기억함 또는 미암기로 처리하세요.'}
        </ThemedText>
        <ThemedText type="metaSemi" themeColor="textSecondary">
          {index + 1}/{queue.length}
        </ThemedText>
      </View>

      <Animated.View style={cardStyle}>
        <View style={styles.wordCard}>
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

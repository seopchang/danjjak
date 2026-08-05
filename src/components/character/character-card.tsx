import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Border, Colors, Type } from '@/constants/theme';
import { useDogMotion } from '@/hooks/use-dog-motion';
import { STAGES, TOYS, useCharacterStore } from '@/stores/character-store';

const theme = Colors.light;

const FEED_COST = 1;

/**
 * 성장 캐릭터 카드 (HANDOFF §5.4).
 * 덱 목록 상단, 동기화 바 아래에 놓인다.
 */
export function CharacterCard() {
  const character = useCharacterStore((s) => s.character);
  const dance = useCharacterStore((s) => s.dance);
  const requestDance = useCharacterStore((s) => s.requestDance);
  const setName = useCharacterStore((s) => s.setName);
  const feed = useCharacterStore((s) => s.feed);
  const water = useCharacterStore((s) => s.water);
  const buyToy = useCharacterStore((s) => s.buyToy);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');

  const stage = STAGES[character.stageIndex];
  const next = STAGES[character.stageIndex + 1];
  const { motionStyle, source } = useDogMotion(dance, character.stageIndex, stage.image);

  const span = next ? next.min - stage.min : 0;
  const gained = character.points - stage.min;
  const growth = next && span > 0 ? Math.min(100, Math.max(0, (gained / span) * 100)) : 100;

  const commitName = () => {
    setName(nameDraft);
    setEditingName(false);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable onPress={() => requestDance(2)}>
          <Animated.Image
            source={source}
            style={[styles.dog, motionStyle]}
            resizeMode="contain"
          />
        </Pressable>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            {editingName ? (
              <TextInput
                value={nameDraft}
                onChangeText={setNameDraft}
                onBlur={commitName}
                onSubmitEditing={commitName}
                autoFocus
                placeholder="이름"
                placeholderTextColor={theme.textTertiary}
                style={styles.nameInput}
              />
            ) : (
              <Pressable
                style={styles.nameTap}
                onPress={() => {
                  setNameDraft(character.name);
                  setEditingName(true);
                }}>
                <ThemedText
                  type="sectionHeading"
                  themeColor={character.name ? 'text' : 'textTertiary'}
                  numberOfLines={1}>
                  {character.name || '이름을 정해주세요'}
                </ThemedText>
              </Pressable>
            )}
            <ThemedText type="metaSemi" themeColor="textSecondary">
              {character.points}P · {character.coins}C
            </ThemedText>
          </View>

          <ThemedText type="labelKo" themeColor="textTertiary" style={styles.stageName}>
            {stage.name}
          </ThemedText>

          <View style={styles.track}>
            <View style={[styles.fill, { width: `${growth}%` }]} />
          </View>

          <ThemedText type="caption" themeColor="textSecondary" style={styles.caption}>
            {next
              ? `매일 학습하면 자라요 · 다음 단계까지 ${next.min - character.points}P`
              : '최고 단계에 도달했어요.'}
          </ThemedText>
        </View>
      </View>

      <View style={styles.needRow}>
        <NeedGauge
          label="밥"
          value={character.hunger}
          disabled={character.coins < FEED_COST || character.hunger >= 100}
          onPress={feed}
        />
        <NeedGauge
          label="물"
          value={character.thirst}
          disabled={character.coins < FEED_COST || character.thirst >= 100}
          onPress={water}
        />
      </View>

      <View style={styles.shop}>
        {TOYS.map((toy) => {
          const owned = character.toys.includes(toy.id);
          const affordable = character.coins >= toy.cost;
          return (
            <Pressable
              key={toy.id}
              onPress={() => buyToy(toy.id)}
              disabled={owned || !affordable}
              style={[
                styles.toy,
                owned && { backgroundColor: theme.ink },
                !owned && !affordable && styles.disabled,
              ]}>
              <Image source={toy.image} style={styles.toyIcon} resizeMode="contain" />
              <ThemedText
                type="metaSemi"
                style={{ color: owned ? theme.onInk : theme.ink }}>
                {owned ? '보유' : `${toy.cost}C`}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>

      {character.puppies > 0 ? (
        <ThemedText type="caption" themeColor="textSecondary">
          함께 자란 강아지 {character.puppies}마리
        </ThemedText>
      ) : null}
    </View>
  );
}

/** 밥/물 한 칸 — 라벨 + 주기 버튼 + 게이지 */
function NeedGauge({
  label,
  value,
  disabled,
  onPress,
}: {
  label: string;
  value: number;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.need}>
      <View style={styles.needHead}>
        <ThemedText type="labelKo" themeColor="textSecondary" style={styles.needLabel}>
          {label}
        </ThemedText>
        <Pressable onPress={onPress} disabled={disabled} hitSlop={6}>
          <ThemedText
            type="caption"
            themeColor="textSecondary"
            style={[styles.feedLink, disabled && styles.disabled]}>
            주기 ({FEED_COST}C)
          </ThemedText>
        </Pressable>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.max(0, Math.min(100, value))}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: Border.strong,
    borderColor: theme.ink,
    borderRadius: 0,
    padding: 16,
    gap: 14,
    marginBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dog: {
    width: 72,
    height: 72,
    // 바닥을 축으로 튀어야 앉았다 일어서는 느낌이 난다 (§5.5).
    transformOrigin: '50% 90%',
  },
  info: {
    flex: 1,
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  nameTap: {
    flex: 1,
  },
  nameInput: {
    flex: 1,
    ...Type.sectionHeading,
    color: theme.ink,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.ink,
    paddingVertical: 2,
    paddingHorizontal: 0,
  },
  stageName: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  track: {
    height: 4,
    backgroundColor: theme.surface,
    borderRadius: 0,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: theme.ink,
    borderRadius: 0,
  },
  caption: {
    fontSize: 12,
  },

  needRow: {
    flexDirection: 'row',
    gap: 16,
  },
  need: {
    flex: 1,
    gap: 6,
  },
  needHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  needLabel: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  feedLink: {
    fontSize: 11,
    textDecorationLine: 'underline',
  },

  shop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  toy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: Border.hair,
    borderColor: theme.ink,
    borderRadius: 0,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  toyIcon: {
    width: 16,
    height: 16,
  },

  disabled: {
    opacity: 0.35,
  },
});

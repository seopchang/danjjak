import { useState } from 'react';
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { TransformModal } from '@/components/character/transform-modal';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors, Type } from '@/constants/theme';
import { useDogMotion } from '@/hooks/use-dog-motion';
import { STAGES, TOYS, upgradeCost, useCharacterStore } from '@/stores/character-store';

const theme = Colors.light;

/**
 * 성장 캐릭터 카드 (HANDOFF §5.4 + HANDOFF-character-update §0·§2·§7).
 * 덱 목록 상단, 동기화 바 아래에 놓인다.
 */
export function CharacterCard() {
  const character = useCharacterStore((s) => s.character);
  const dance = useCharacterStore((s) => s.dance);
  const requestDance = useCharacterStore((s) => s.requestDance);
  const setName = useCharacterStore((s) => s.setName);
  const growUp = useCharacterStore((s) => s.growUp);
  const buyToy = useCharacterStore((s) => s.buyToy);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  // 변신 연출은 자란 직후의 before/after 를 붙잡아 둬야 해서 따로 담는다.
  const [transform, setTransform] = useState<{ from: number; to: number } | null>(null);

  const stage = STAGES[character.stageIndex];
  const next = STAGES[character.stageIndex + 1];
  const cost = upgradeCost(character.stageIndex);
  const { motionStyle, source } = useDogMotion(dance, character.stageIndex, stage.image);

  const canGrow = cost != null && character.coins >= cost;
  const remaining = cost != null ? Math.max(0, cost - character.coins) : 0;
  const growth = cost != null && cost > 0 ? Math.min(100, (character.coins / cost) * 100) : 100;

  const commitName = () => {
    setName(nameDraft);
    setEditingName(false);
  };

  const handleGrow = () => {
    const from = character.stageIndex;
    if (!growUp()) return;
    setTransform({ from, to: from + 1 });
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Pressable onPress={() => requestDance(2)}>
          <Animated.Image source={source} style={[styles.dog, motionStyle]} resizeMode="contain" />
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
              코인 {character.coins}
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
              ? `단어 하나에 코인 1개 · 다음 단계까지 코인 ${remaining}개`
              : '함께 오래 지냈네요.'}
          </ThemedText>
        </View>
      </View>

      {/* 승급은 자동이 아니다. 사용자가 눌러야 자라고 그때 코인을 낸다. */}
      <View style={styles.growBlock}>
        <Pressable
          onPress={handleGrow}
          disabled={!canGrow}
          style={[styles.growButton, !canGrow && styles.disabled]}>
          <ThemedText type="button" style={{ color: theme.onInk }}>
            {next ? `${next.name}로 키우기` : '최고 단계에 도달했어요'}
          </ThemedText>
        </Pressable>
        {cost != null ? (
          <ThemedText type="metaSemi" themeColor="textSecondary" style={styles.growCost}>
            코인 {cost}
          </ThemedText>
        ) : null}
      </View>

      {/* 장난감은 보유 개념이 없다. 누를 때마다 코인을 쓰고 한 번 반응한다. */}
      <View style={styles.shop}>
        {TOYS.map((toy) => {
          const affordable = character.coins >= toy.cost;
          return (
            <Pressable
              key={toy.id}
              onPress={() => buyToy(toy.id)}
              disabled={!affordable}
              style={[styles.toy, !affordable && styles.disabled]}>
              <Image source={toy.image} style={styles.toyIcon} resizeMode="contain" />
              <ThemedText type="metaSemi" style={{ color: theme.ink }}>
                코인 {toy.cost}
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

      <TransformModal
        visible={transform != null}
        fromStage={transform?.from ?? 0}
        toStage={transform?.to ?? 0}
        name={character.name}
        onClose={() => setTransform(null)}
      />
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

  growBlock: {
    gap: 6,
  },
  growButton: {
    backgroundColor: theme.ink,
    borderRadius: 0,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  growCost: {
    textAlign: 'center',
    fontSize: 11,
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
    backgroundColor: theme.background,
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

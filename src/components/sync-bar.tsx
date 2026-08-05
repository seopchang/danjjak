import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { useSplashStore } from '@/stores/splash-store';
import { useSyncStore } from '@/stores/sync-store';

/**
 * 덱 목록 상단의 동기화 줄.
 * 박스형 배너가 아니라 점 하나 + 한 줄 텍스트로만 상태를 알린다 (스펙 2.6).
 */
export function SyncBar() {
  const theme = useTheme();
  const uid = useAuthStore((s) => s.uid);
  const initializing = useAuthStore((s) => s.initializing);
  const syncing = useSyncStore((s) => s.syncing);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const lastError = useSyncStore((s) => s.lastError);
  const lastSummary = useSyncStore((s) => s.lastSummary);
  const run = useSyncStore((s) => s.run);
  const showSplash = useSplashStore((s) => s.show);

  // 앱 안에서 borderRadius 를 쓰는 단 두 곳 중 하나 (6x6 상태 점)
  const Dot = ({ on }: { on: boolean }) => (
    <View style={[styles.dot, { backgroundColor: on ? theme.ink : theme.textTertiary }]} />
  );

  if (!isFirebaseConfigured()) {
    return (
      <View style={styles.bar}>
        <Dot on={false} />
        <ThemedText type="caption" themeColor="textSecondary" style={styles.grow}>
          로컬 전용 모드 · 동기화 설정 안 됨
        </ThemedText>
      </View>
    );
  }

  if (initializing) {
    return (
      <View style={styles.bar}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
        <ThemedText type="caption" themeColor="textSecondary" style={styles.grow}>
          불러오는 중…
        </ThemedText>
      </View>
    );
  }

  if (!uid) {
    return (
      <Pressable onPress={() => router.push('/settings')} style={styles.bar}>
        <Dot on={false} />
        <ThemedText type="caption" themeColor="textSecondary" style={styles.grow}>
          로그인하면 폰과 패드가 같은 단어장을 씁니다
        </ThemedText>
        <ThemedText type="labelKo" style={styles.action}>
          로그인
        </ThemedText>
      </Pressable>
    );
  }

  const status = lastError
    ? `동기화 실패: ${lastError}`
    : lastSyncedAt
      ? `마지막 동기화 ${dayjs(lastSyncedAt).format('M월 D일 HH:mm')}${
          lastSummary ? ` · ${lastSummary}` : ''
        }`
      : '아직 동기화하지 않았습니다';

  return (
    <Pressable
      onPress={() => {
        showSplash('동기화 중');
        run(uid);
      }}
      disabled={syncing}
      style={styles.bar}>
      {syncing ? (
        <ActivityIndicator size="small" color={theme.textSecondary} />
      ) : (
        <Dot on={!lastError && !!lastSyncedAt} />
      )}
      <ThemedText
        type="caption"
        themeColor="textSecondary"
        style={styles.grow}
        numberOfLines={1}>
        {syncing ? '동기화 중…' : status}
      </ThemedText>
      {!syncing ? (
        <ThemedText type="labelKo" style={styles.action}>
          동기화
        </ThemedText>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    marginBottom: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  grow: {
    flex: 1,
  },
  action: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
});

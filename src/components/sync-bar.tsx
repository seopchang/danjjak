import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { useSyncStore } from '@/stores/sync-store';

/**
 * 덱 목록 상단의 동기화 줄.
 * 로그인 상태에 따라 "로그인하기" / "동기화" 중 하나를 보여준다.
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

  if (!isFirebaseConfigured()) {
    return (
      <View style={[styles.bar, { borderColor: theme.border }]}>
        <Ionicons name="cloud-offline-outline" size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
          로컬 전용 모드 (동기화 설정 안 됨)
        </ThemedText>
      </View>
    );
  }

  if (initializing) {
    return (
      <View style={[styles.bar, { borderColor: theme.border }]}>
        <ActivityIndicator size="small" color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
          불러오는 중…
        </ThemedText>
      </View>
    );
  }

  if (!uid) {
    return (
      <Pressable
        onPress={() => router.push('/settings')}
        style={[styles.bar, { borderColor: theme.border }]}>
        <Ionicons name="cloud-outline" size={16} color={theme.textSecondary} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.grow}>
          로그인하면 폰과 패드가 같은 단어장을 씁니다
        </ThemedText>
        <ThemedText type="smallBold">로그인</ThemedText>
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
      onPress={() => run(uid)}
      disabled={syncing}
      style={[styles.bar, { borderColor: theme.border }]}>
      {syncing ? (
        <ActivityIndicator size="small" color={theme.text} />
      ) : (
        <Ionicons
          name={lastError ? 'warning-outline' : 'sync-outline'}
          size={16}
          color={lastError ? theme.text : theme.textSecondary}
        />
      )}
      <ThemedText type="small" themeColor="textSecondary" style={styles.grow} numberOfLines={1}>
        {syncing ? '동기화 중…' : status}
      </ThemedText>
      {!syncing ? <ThemedText type="smallBold">동기화</ThemedText> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  grow: {
    flex: 1,
  },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Screen } from '@/components/common/screen';
import { SquareSwitch } from '@/components/common/square-switch';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { Border, Colors } from '@/constants/theme';
import { isFirebaseConfigured } from '@/lib/firebase';
import {
  cancelDailyReviewReminder,
  REVIEW_HOUR,
  REVIEW_MINUTE,
  scheduleDailyReviewReminder,
} from '@/lib/notifications';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';
import { useSyncStore } from '@/stores/sync-store';
import { DAILY_REVIEW_LIMIT } from '@/utils/review-queue';

const theme = Colors.light;

/** "00:00" 같은 표기 */
function formatReminderTime(): string {
  const hour = String(REVIEW_HOUR).padStart(2, '0');
  const minute = String(REVIEW_MINUTE).padStart(2, '0');
  return `${hour}:${minute}`;
}

export default function SettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const email = useAuthStore((s) => s.email);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const errorCode = useAuthStore((s) => s.errorCode);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const logOut = useAuthStore((s) => s.logOut);
  const clearError = useAuthStore((s) => s.clearError);
  const resetSync = useSyncStore((s) => s.reset);

  const reminderEnabled = useSettingsStore((s) => s.reviewReminderEnabled);
  const setReminderEnabled = useSettingsStore((s) => s.setReviewReminderEnabled);

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [inputEmail, setInputEmail] = useState('');
  const [password, setPassword] = useState('');
  const [reminderBusy, setReminderBusy] = useState(false);

  const handleToggleReminder = async (next: boolean) => {
    setReminderBusy(true);
    try {
      if (!next) {
        await cancelDailyReviewReminder();
        setReminderEnabled(false);
        return;
      }

      const scheduled = await scheduleDailyReviewReminder();
      setReminderEnabled(scheduled);
      if (!scheduled) {
        Alert.alert(
          '알림 권한이 필요합니다',
          '휴대폰 설정 → 앱 → 보카덱 → 알림에서 알림을 허용해주세요.'
        );
      }
    } finally {
      setReminderBusy(false);
    }
  };

  const canSubmit = inputEmail.trim().length > 0 && password.length > 0 && !busy;

  const handleSubmit = async () => {
    const ok =
      mode === 'signIn' ? await signIn(inputEmail, password) : await signUp(inputEmail, password);
    if (ok) {
      // 계정이 바뀌었을 수 있으니 동기화 기준점을 비워 전체를 다시 받아온다.
      resetSync();
      setPassword('');
    }
  };

  const handleLogOut = () => {
    Alert.alert('로그아웃', '로그아웃해도 이 기기의 단어장은 남아 있습니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: async () => {
          await logOut();
          resetSync();
        },
      },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <ThemedText type="screenTitle">←</ThemedText>
        </Pressable>
        <ThemedText type="screenTitle">설정</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      {!isFirebaseConfigured() ? (
        <View style={styles.section}>
          <ThemedText type="sectionHeading">동기화가 설정되지 않았습니다</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            이 기기에만 저장됩니다.
          </ThemedText>
        </View>
      ) : uid ? (
        <View style={styles.section}>
          <ThemedText type="sectionHeading">로그인됨</ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            {email}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            다른 기기에서도 같은 계정으로 로그인한 뒤 동기화 버튼을 누르면 단어장이 합쳐집니다.
          </ThemedText>
          <Button label="로그아웃" variant="ghost" onPress={handleLogOut} />
        </View>
      ) : (
        <View style={styles.section}>
          <ThemedText type="sectionHeading">
            {mode === 'signIn' ? '로그인' : '새 계정 만들기'}
          </ThemedText>
          <ThemedText type="body" themeColor="textSecondary">
            폰과 패드에서 같은 계정으로 로그인하면 단어장을 함께 볼 수 있습니다.
          </ThemedText>

          <TextField
            placeholder="이메일"
            value={inputEmail}
            onChangeText={(t) => {
              setInputEmail(t);
              if (error) clearError();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />
          <TextField
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChangeText={(t) => {
              setPassword(t);
              if (error) clearError();
            }}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
            textContentType="password"
          />

          {error ? (
            <View style={styles.errorBox}>
              <ThemedText type="body" style={{ color: theme.inkMuted }}>
                {error}
              </ThemedText>
              {/* 릴리스 APK 에서는 콘솔을 볼 수 없어 원인 코드를 여기 같이 띄운다 */}
              {errorCode ? (
                <ThemedText type="meta" themeColor="textTertiary">
                  {errorCode}
                </ThemedText>
              ) : null}
            </View>
          ) : null}

          <Button
            label={busy ? '처리 중…' : mode === 'signIn' ? '로그인' : '계정 만들기'}
            onPress={handleSubmit}
            disabled={!canSubmit}
          />
          <Button
            label={mode === 'signIn' ? '계정이 없어요 · 새로 만들기' : '이미 계정이 있어요 · 로그인'}
            variant="ghost"
            onPress={() => {
              setMode((m) => (m === 'signIn' ? 'signUp' : 'signIn'));
              clearError();
            }}
          />
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.switchRow}>
          <View style={styles.switchLabel}>
            <ThemedText type="sectionHeading">매일 복습 알림</ThemedText>
            <ThemedText type="body" themeColor="textSecondary">
              매일 {formatReminderTime()}에 복습하라고 알려줍니다.
            </ThemedText>
          </View>
          <SquareSwitch
            value={reminderEnabled}
            onValueChange={handleToggleReminder}
            disabled={reminderBusy}
          />
        </View>
        <ThemedText type="caption" themeColor="textSecondary">
          미암기 단어를 먼저, 그다음 오래된 단어 순으로 최대 {DAILY_REVIEW_LIMIT}개를 모아 복습을
          시작합니다.
        </ThemedText>
      </View>

      <View style={styles.lastSection}>
        <ThemedText type="sectionHeading">동기화 방식</ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          이 앱은 항상 기기 안에 먼저 저장합니다. 인터넷이 없어도 단어 등록과 학습이 그대로
          동작합니다.
        </ThemedText>
        <ThemedText type="body" themeColor="textSecondary">
          같은 단어를 두 기기에서 각각 고쳤다면 나중에 고친 쪽이 남습니다.
        </ThemedText>
      </View>
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
  section: {
    gap: 10,
    borderBottomWidth: Border.hair,
    borderBottomColor: theme.line,
    paddingBottom: 24,
    marginBottom: 24,
  },
  lastSection: {
    gap: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchLabel: {
    flex: 1,
    gap: 4,
  },
  errorBox: {
    borderLeftWidth: Border.strong,
    borderLeftColor: theme.inkMuted,
    paddingLeft: 12,
    paddingVertical: 2,
    gap: 2,
  },
});

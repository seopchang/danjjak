import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/common/button';
import { Card } from '@/components/common/card';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { TextField } from '@/components/common/text-field';
import { ThemedText } from '@/components/themed-text';
import { isFirebaseConfigured } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import { useSyncStore } from '@/stores/sync-store';

export default function SettingsScreen() {
  const uid = useAuthStore((s) => s.uid);
  const email = useAuthStore((s) => s.email);
  const busy = useAuthStore((s) => s.busy);
  const error = useAuthStore((s) => s.error);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const logOut = useAuthStore((s) => s.logOut);
  const clearError = useAuthStore((s) => s.clearError);
  const resetSync = useSyncStore((s) => s.reset);

  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [inputEmail, setInputEmail] = useState('');
  const [password, setPassword] = useState('');

  const canSubmit = inputEmail.trim().length > 0 && password.length > 0 && !busy;

  const handleSubmit = async () => {
    const ok = mode === 'signIn'
      ? await signIn(inputEmail, password)
      : await signUp(inputEmail, password);
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
        <IconButton name="chevron-back" onPress={() => router.back()} size={24} />
        <ThemedText type="smallBold">설정</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      {!isFirebaseConfigured() ? (
        <Card>
          <ThemedText type="smallBold">동기화가 설정되지 않았습니다</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            지금은 이 기기에만 저장하는 로컬 전용 모드입니다. 단어장 기능은 모두 정상적으로
            쓸 수 있습니다.
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            폰과 패드를 함께 쓰려면 Firebase 프로젝트를 만들고 프로젝트 루트의 .env 파일에
            설정값을 넣어주세요. 자세한 방법은 README.md에 있습니다.
          </ThemedText>
        </Card>
      ) : uid ? (
        <Card>
          <ThemedText type="smallBold">로그인됨</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {email}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            다른 기기에서도 같은 계정으로 로그인한 뒤 동기화 버튼을 누르면 단어장이 합쳐집니다.
          </ThemedText>
          <Button label="로그아웃" variant="ghost" onPress={handleLogOut} />
        </Card>
      ) : (
        <Card>
          <ThemedText type="smallBold">
            {mode === 'signIn' ? '로그인' : '새 계정 만들기'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
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
            <ThemedText type="small" themeColor="danger">
              {error}
            </ThemedText>
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
        </Card>
      )}

      <Card>
        <ThemedText type="smallBold">동기화 방식</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          이 앱은 항상 기기 안에 먼저 저장합니다. 인터넷이 없어도 단어 등록과 학습이 그대로
          동작하고, 동기화 버튼을 눌렀을 때만 서버와 주고받습니다.
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          같은 단어를 두 기기에서 각각 고쳤다면 나중에 고친 쪽이 남습니다.
        </ThemedText>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});

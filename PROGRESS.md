# 진행 상황 요약 (다음 세션 이어서 작업하기 위한 문서)

이 문서는 PC방 등 **매번 초기화되는 환경**에서 새 Claude Code 세션을 시작할 때,
지금까지의 작업 맥락을 빠르게 파악하기 위한 요약입니다.

마지막 갱신: 2026-08-07

## 0. 환경 관련 중요 사실

- 이 저장소는 **PC방 등 초기화되는 컴퓨터**에서 만들어졌습니다. 컴퓨터를 끄면 Node.js/Git/GitHub CLI 설치, 로컬 프로젝트 파일이 전부 사라집니다.
- 새 세션 순서: Node.js/Git/GitHub CLI 설치 → clone → `npm install` → `.env` 재생성 → 이어서 작업.
- winget이 동작하지 않는 머신입니다. nodejs.org / GitHub 릴리즈에서 msi/exe를 직접 받아 `msiexec /quiet`, `/VERYSILENT`로 조용히 설치합니다.
  - **설치 직후 PATH 반영 안 됨**: 새 PowerShell 명령마다 아래로 PATH를 새로고침해야 node/npm/git/gh/npx가 인식됩니다.
    ```powershell
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    ```
  - 2026-08-04 세션에서 설치된 버전: Node 24.19.0 / Git 2.55.0.3 / gh 2.97.0
- GitHub: **https://github.com/seopchang/danjjak** (2026-08-05 에 `vocadeck` 에서 이름 변경. 옛 URL 은 GitHub 가 리다이렉트해준다). `gh auth login --web` 디바이스 코드 인증 필요(사용자가 브라우저에서 직접 입력 — 자동화 불가). 인증 후 **`gh auth setup-git` 을 꼭 실행할 것** — 안 하면 push 에서 `could not read Username` 으로 막힌다.
  - git 사용자: `seopchang` / `yunseobchang123@gmail.com` (새 PC에서는 `git config user.name/user.email` 직접 설정해야 함)
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨집니다 → 파일로 작성 후 `git commit -F <file>` 사용.
  - 이때 `Out-File -Encoding utf8` 은 **BOM 을 붙여서** 커밋 제목 앞에 `﻿` 가 남습니다. 반드시 아래처럼 BOM 없이 쓸 것:
    ```powershell
    [System.IO.File]::WriteAllText("$PWD\.git\COMMIT_MSG.txt", $msg, (New-Object System.Text.UTF8Encoding($false)))
    ```
- **한글 주석이 든 `.ps1` 은 정반대로 BOM 이 반드시 있어야 합니다.** (2026-08-07 에 여기서 한참 헤맴)
  Windows PowerShell 5.1 은 BOM 이 없으면 `.ps1` 을 ANSI(CP949)로 읽습니다. 그러면 한글 주석이
  깨지면서 **마지막 글자가 줄바꿈까지 삼켜, 바로 다음 줄이 주석 안으로 빨려들어가 조용히 실행되지 않습니다.**
  변수가 통째로 `$null` 이 되는데 에러는 엉뚱한 곳에서 납니다.
  ```powershell
  # 파일을 쓴 뒤 BOM 을 붙여 다시 저장
  $t = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($true)))
  ```
- **PowerShell 함수 안에서 `Write-Output` 을 쓰지 말 것.** 반환값 파이프라인에 섞여
  함수가 배열을 돌려줍니다. 진단 출력은 `Write-Host` 로 할 것.

### 확인은 웹 미리보기로 (가장 빠름)

Expo Go와 cloudflared 터널은 **더 이상 쓰지 않습니다.** 대신 이 컴퓨터 브라우저로 바로 봅니다.

```powershell
npx expo start --web --port 8081
# 브라우저에서 http://localhost:8081
```

- 파일을 저장하면 자동으로 다시 번들되어 화면이 갱신됩니다. 디자인 확인은 전부 여기서 하면 됩니다.
- **웹에서 확인 불가능한 것: 로컬 알림뿐입니다.** `expo-notifications`는 네이티브 모듈이라
  웹에서는 무동작으로 막아뒀습니다(`src/lib/notifications.ts`의 `SUPPORTED` 가드). 알림은 APK로만 확인됩니다.
- `.env`는 **서버 시작 시점에만** 읽힙니다. `.env`를 만들거나 고쳤으면 서버를 다시 띄워야 합니다.

APK는 최종 확인용입니다(빌드 42분). 아래 4-1 참고.

### `.env` 재생성

`.env`는 `.gitignore`에 있어 커밋되지 않습니다. 새 컴퓨터마다 다시 만들어야 합니다.

아래 내용을 저장소 루트에 `.env` 로 그대로 저장하면 됩니다. **직접 타이핑하지 말고 복사하세요**
(아래 "오타 주의" 참고).

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyDklrSEJ3ndmA9RGkaYIHS161YO2vxUtDo
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=vocadeck-4d370.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=vocadeck-4d370
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=vocadeck-4d370.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=769638786254
EXPO_PUBLIC_FIREBASE_APP_ID=1:769638786254:web:840c040857c8fa742edc9f
```

**왜 이걸 저장소에 적어두는가**: Firebase 웹 SDK config 는 비밀값이 아닙니다. 클라이언트 번들에
어차피 그대로 들어가고, 실제 보호는 Firestore 보안 규칙(`firestore.rules`)이 합니다.
게다가 이 값들은 **공개 릴리스 APK 안에 이미 박혀 있어서** 누구나 꺼내볼 수 있습니다
(4-2장의 조사가 바로 그 방법으로 진행됐습니다). PC방이라 매 세션 콘솔을 다시 뒤지는 비용이
더 커서 여기 적어둡니다. 값이 바뀌면 Firebase 콘솔 → 프로젝트 `vocadeck-4d370` →
프로젝트 설정 → 내 앱 → SDK 설정 및 구성에서 다시 가져오세요.

**오타 주의 — 실제로 한 번 당했습니다.** API 키 9번째 글자는 **소문자 `l`(엘)** 입니다.
이걸 대문자 `I`(아이)로 잘못 넣어서 APK 로그인이 오래 막혀 있었습니다 (4-2장).
키에는 `I`, `l`, `1`, `O`, `0` 이 섞여 있으니 **눈으로 옮겨 적지 말고 반드시 복사**하세요.

같은 6개 이름이 GitHub Secrets 에도 등록돼 있고 APK 빌드는 그쪽 값을 씁니다.
Secrets 는 쓰기 전용이라 읽어올 수 없으므로, 값이 의심되면 위 값으로 다시 넣으세요:
```powershell
gh secret set EXPO_PUBLIC_FIREBASE_API_KEY --body "AIzaSyDklrSEJ3ndmA9RGkaYIHS161YO2vxUtDo"
```

`.env` 없이도 앱은 **로컬 전용 모드**로 동작합니다. 단, 그러면 설정 화면에 **로그인 폼 자체가 안 나옵니다**
(`isFirebaseConfigured()` 가드). 로그인 관련 작업을 하려면 `.env`가 반드시 필요합니다.
`.env` 는 **서버 시작 시점에만** 읽히므로, 만든 뒤에는 개발 서버를 다시 띄워야 합니다.

## 1. 이 앱은 무엇인가

**단짝** (구 보카덱/VocaDeck) — 단어 암기 앱. 영어 단어장과 한국어 단어장을 모두 만들 수 있다. 자매 프로젝트인 [study-app](https://github.com/seopchang/study-app)(국어 어휘 앱 "범작가 클래스")의 어휘장 기능을 영어용으로 다시 만들고, **폰과 패드에서 같이 쓰기 위해 Firebase 동기화**를 추가한 것입니다.

## 2. 확정된 설계 결정

사용자와 논의해서 정한 것들입니다. 바꾸려면 먼저 확인할 것.

| 결정 | 내용 | 이유 |
|---|---|---|
| 저장소 | study-app과 **별도 저장소** | 기존 국어 앱을 건드려 깨뜨리지 않기 위해 |
| 범위 | **단어장 기능만** (일일과제·캘린더 없음) | 먼저 동기화가 잘 되는지 확인하고 필요하면 추가 |
| 덱 구조 | **여러 개 단어장(덱)** | "토익", "수능" 등 목적별 분리 |
| 오프라인 | **오프라인 우선 + 수동 동기화 버튼** | 평소 오프라인으로 쓰고 새 단어 넣을 때만 동기화 |
| 로그인 | **이메일 + 비밀번호** (구글 로그인 아님) | 아래 참고 |
| 테마 | **라이트 고정** | 일러스트가 어두운 라인아트라 다크 배경에서 안 보임 |

### 로그인 방식이 구글이 아닌 이유

Expo SDK 57에서 `expo-auth-session`의 `providers/google` 모듈이 없고, 공식 권장 라이브러리는
네이티브 코드가 필요합니다. 사용자 기기는 **안드로이드 폰 + 안드로이드 태블릿**이라,
나중에 개발 빌드로 전환하면 구글 로그인 추가는 가능합니다.

## 3. 데이터 모델과 동기화

`src/types/index.ts`:

```
Deck    { id, name, createdAt, updatedAt, deletedAt }
Word    { id, deckId, term, meaning, tags[], status, isFavorite,
          registeredAt, lastReviewedAt, updatedAt, deletedAt }
StudySession { id, deckId, type(암기|복습|리콜), date, testedWordIds[],
          correctCount, incorrectCount, accuracy, durationSeconds, scopeLabel,
          updatedAt, deletedAt }
```

- 모든 레코드에 `updatedAt`(ISO 문자열). 사전순 비교 = 시간순 비교라 Firestore 쿼리에 그대로 쓸 수 있음.
- 삭제는 **tombstone**(`deletedAt` 채움). 화면에서는 `visibleDecks()` / `deckWords()` 헬퍼로 걸러냄.
- **태그는 문자열 배열**로 단어에 직접 저장 — 기기 간 id를 맞출 필요가 없어 동기화가 단순해짐.

동기화(`src/lib/sync.ts`)는 수동 3단계: ① 로컬 변경분 id 기록 → ② 원격 변경분 받아 병합(최신 `updatedAt` 승) → ③ 기록해둔 id들의 병합 후 값을 업로드. Firestore 경로는 `users/{uid}/decks|words|sessions/{id}`.

**한계**: 기기 시계가 크게 어긋나면 최신 판정이 틀릴 수 있음. 개인용 2기기 수준이라 단순하게 감.

## 4. 검증 상태

### 끝난 것
- `npx tsc --noEmit` 통과.
- 전 라우트(8개) 안드로이드 Metro 번들 통과.
- `@firebase/auth/dist/rn` 단독 해석 확인 (아래 5장 크래시 재발 없음).
- Firebase 프로젝트 `vocadeck-4d370` (Firestore Standard, `(default)` DB, 위치 asia-northeast3 서울 — 변경 불가).
  보안 규칙은 `firestore.rules` 내용으로 게시 완료.
- **웹에서 이메일/비밀번호 로그인 성공 확인** (2026-08-04). 아래 4-2 참고.
- APK 빌드 2회 연속 성공.

- **폰 로그인 실패 원인 확정 (2026-08-05).** GitHub Secret 의 API 키 오타였다. 아래 4-2 참고.

### 아직 확인 안 된 것
- ⚠️ **로그인 미해결.** 원인 미확정. 진단 ⑤번 결과로 갈린다 (4-2).
- ⚠️ **동기화 미검증.** 폰↔패드 간 실제 병합 동작 확인 필요.
- ⚠️ **알림 실기기 미검증.** 웹에서는 확인 불가.
- ⚠️ **새 디자인·새 아이콘 실기기 미확인.** 웹에서는 확인함.
- ⚠️ **캐릭터 코인 개편·변신 연출 실기기 미확인** (7-2). 웹 번들·tsc 는 통과.

## 4-1. APK 빌드

```powershell
gh workflow run build-apk.yml
gh run list --workflow build-apk.yml --limit 5
```

- 빌드 시간 **약 42분**. 결과: https://github.com/seopchang/danjjak/actions
- 성공 시 APK: https://github.com/seopchang/danjjak/releases (`danjjak.apk`, `apk-latest` 태그)
  - 2026-08-05 이전 빌드의 릴리스 자산 이름은 `vocadeck.apk` 였습니다.

### 빌드 이력
| run | 결과 | 비고 |
|---|---|---|
| 30791137542 | ❌ 실패 (38분) | `resource drawable/splashscreen_logo not found` |
| 30794801485 | ✅ 성공 (42분) | 위 문제 수정 후 |
| 30815749231 | ✅ 성공 (41분) | 8장 기능 반영 |
| 30911421648 | ✅ 성공 (23분) | |
| 31003750133 | ✅ 성공 (22분) | API 키 오타 수정본. **이걸로도 로그인 실패** (4-2) |
| 31141586028 | ⏳ 2026-08-07 시작 | 로그인 진단 ⑤, 새 아이콘, 캐릭터 코인 개편, 리콜 표기 수정 |

### 이미 겪은 실패와 해결법

**(1) `resource drawable/splashscreen_logo not found`** — 해결됨
`expo-splash-screen` 플러그인에 `imageWidth`만 주고 `image`를 안 주면, 로고를 참조하는
`styles.xml`은 생성되는데 정작 drawable이 안 만들어진다. app.json의 splash 설정에 `image`를 반드시 넣을 것.

**(2) 토큰에 `workflow` 스코프 없음**
`.github/workflows/*` 를 푸시하면 거부된다. → `gh auth refresh -h github.com -s workflow` (디바이스 코드 인증 필요).
현재 토큰 스코프는 `gist, read:org, repo` 로 **workflow 없음**. 워크플로 파일을 고칠 일이 생기면 refresh 필요.

### 42분 날리기 전에 로컬에서 먼저 검증할 것

아이콘·스플래시·네이티브 설정을 건드렸으면 반드시:

```powershell
Remove-Item -Recurse -Force android
npx expo prebuild --platform android --no-install
# 생성물 확인
Get-ChildItem -Recurse android\app\src\main\res -Filter "splashscreen_logo*"
Get-ChildItem -Recurse android\app\src\main\res -Filter "ic_launcher*"
```

`android/` 는 `.gitignore`에 있어 커밋되지 않는다. CI가 매번 새로 만든다.
로컬에 JDK17/Android SDK가 없어 `gradlew assembleRelease`까지는 검증 불가. prebuild 단계까지만 가능.

## 4-2. 로그인 오류 — **아직 미해결.** 지금까지 지운 후보들

증상: **APK로 로그인하면 `auth/network-request-failed`. 컴퓨터 웹에서는 같은 계정으로 성공.**

⚠️ 이 장은 두 번 "원인 확정"이라고 적혔다가 두 번 다 틀렸다. **다음 세션은 아래 "확정된 사실"만
믿고, 추측을 사실로 적지 말 것.** 진단 결과가 나오기 전에는 결론을 쓰지 말 것.

### 1차 원인 (실재했고 고쳤음, 그러나 증상은 그대로)

`EXPO_PUBLIC_FIREBASE_API_KEY` 시크릿에 **소문자 `l` 이 대문자 `I` 로** 들어가 있었다
(키의 9번째 글자. 폰트에 따라 눈으로 구분이 안 된다). 2026-08-05 에 교체했다.

교체 후 빌드(run 31003750133)로 폰에서 확인한 결과 **키는 깨끗해졌지만 로그인은 여전히 실패**했다.
즉 이 오타는 실재한 버그였지만 증상의 원인은 아니었다(또는 유일한 원인이 아니었다).

### 2차 가설 (2026-08-07, **반증됨**)

폰 진단 화면에서 6개 값 중 **5개에 앞뒤 공백/줄바꿈**이 섞여 있는 것이 발견됐다
(apiKey 만 깨끗 — 그것만 `--body` 로 다시 넣었기 때문). 그중 `appId` 는 로그인 요청에
`X-Firebase-gmpid` 헤더로 실려 나가므로, 줄바꿈이 헤더를 깨뜨린다고 추정했다.

**틀렸다.** HTTP 헤더 값은 뒤쪽 공백을 잘라내는 것이 표준 동작이다. Node 로 확인:

```
trailing \n      => accepted, stored as "abc"     ← 조용히 잘림
trailing \r\n    => accepted, stored as "abc"     ← 조용히 잘림
middle \n        => REJECTED: TypeError           ← 이것만 거부(헤더 인젝션)
```

오염은 전부 **값 끝**이었으므로 안드로이드에서도 잘려나가고 요청은 정상적으로 나갔을 것이다.
시크릿 5개는 `--body` 로 재등록해 정리했고 `firebase.ts` 에 `.trim()` 도 넣었지만,
**이건 위생 문제였지 증상의 원인이 아니다.**

### 확정된 사실 (폰 진단 화면으로 측정된 것)

| 항목 | 결과 |
|---|---|
| 인터넷 · TLS | HTTP 204, 327ms ✓ |
| 폰 시계 | 서버와 +1초 ✓ (인증서 검증 문제 아님) |
| API 키 | 유효. identitytoolkit HTTP 200 ✓ |
| 설정값 6개 | 값 자체는 콘솔과 일치 ✓ |

**네트워크·시계·키는 전부 정상인데 로그인만 실패한다.**

### 다음에 확인할 것 — 진단 ④번을 보면 된다

기존 진단의 `Firebase Auth 서버` 단계는 `recaptchaParams` 를 GET 으로 찌르기만 해서
로그인 경로를 타지 않는다. 네트워크만 살아 있으면 무조건 통과하므로 아무것도 못 가려낸다.

그래서 **`로그인 엔드포인트`** 단계를 새로 넣었다(`src/lib/diagnostics.ts`,
`checkSignInEndpoint`). SDK 를 거치지 않고 로그인 REST 엔드포인트에 가짜 자격증명으로
직접 POST 한다. 실제 계정 정보가 필요 없다.

| 진단 ④ 결과 | 결론 | 다음 수사 방향 |
|---|---|---|
| `HTTP 400 INVALID_LOGIN_CREDENTIALS` | 네트워크·키·헤더 전부 정상. 원인은 **SDK 내부** | reCAPTCHA 등 DOM 이 필요한 절차가 RN 에 없어 깨지는 경우. 아래 참고 |
| 예외 / 타임아웃 | 원인은 **네트워크 계층** | identitytoolkit 호스트 차단·프록시 의심 |

**유력한 다음 후보(아직 검증 안 됨, 사실로 적지 말 것)**: 진단이 돌려준 응답에
`recaptchaSiteKey` 가 들어 있었다. Firebase Auth 는 비밀번호 로그인에 reCAPTCHA 검증을
걸 수 있는데, 브라우저는 DOM 이 있어 통과하지만 React Native 에는 DOM 이 없어 실패한다.
"웹은 되고 APK 만 안 된다"는 증상과 맞아떨어진다. 확인은 Firebase 콘솔 →
Authentication → Settings 에서 봇 보호/reCAPTCHA 설정을 볼 것.

### `auth/network-request-failed` 를 믿지 말 것

Firebase 는 fetch 가 던진 예외를 **종류 불문 전부** 이 코드 하나로 뭉갠다.
인터넷 문제처럼 보이지만 SSL·설정·SDK 내부 문제 전부가 여기로 온다.
이 코드만 보고 네트워크를 의심하다가 두 번 헛짚었다.

### 이걸 어떻게 잡았는지 (같은 상황 재발 시 그대로 쓸 것)

APK 안에 설정값이 그대로 박혀 있으므로, 빌드를 다시 하지 않고도 확인할 수 있다.

```powershell
gh release download apk-latest --repo seopchang/danjjak --pattern "danjjak.apk"
# APK 는 zip. assets/index.android.bundle 을 꺼낸다.
```

**중요**: 릴리스 번들은 Hermes 바이트코드이고 문자열이 **UTF-16 으로** 저장된다.
ASCII 로 grep 하면 하나도 안 잡혀서 "설정이 통째로 비었다"고 오판하게 된다.
`[System.Text.Encoding]::Unicode.GetString($bytes)` 로 읽어야 보인다.
값들은 `U+FEFF` 로 구분되어 연속으로 들어 있다.

꺼낸 키가 진짜 유효한지는 로그인 엔드포인트에 직접 던져서 판정한다:

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=<KEY>
body: {"email":"...","password":"...","returnSecureToken":true}
```

- `API key not valid` → **키 자체가 무효** (오타·삭제된 키)
- `INVALID_LOGIN_CREDENTIALS` → **키는 정상**, 계정/비번만 틀림
- 403 `API_KEY_HTTP_REFERRER_BLOCKED` → 키에 리퍼러 제한이 걸림

리퍼러 헤더를 붙이고/빼고 두 번 쏘면 "웹만 되는" 원인인 키 제한도 함께 가려낼 수 있다.
(이번 건은 리퍼러 유무와 무관했으므로 제한 문제는 아니었다.)

### 왜 여태 안 걸렸나 — 빌드가 이걸 못 잡는다

`build-apk.yml` 의 검증 단계는 6개 중 `PROJECT_ID` 하나가 **비어 있지 않은지만** 본다.
키가 틀려도 빌드는 초록불로 통과한다.
→ 개선안: 빌드 중에 위 엔드포인트로 키를 실제로 한 번 던져보고
   `API key not valid` 면 실패시키기. (워크플로 수정은 토큰에 `workflow` 스코프 필요)

### 앱에 넣어둔 진단 기능

설정 화면 로그인 영역의 **`로그인 연결 진단`** 버튼 (`src/lib/diagnostics.ts`).
릴리스 APK 는 콘솔을 볼 수 없어서 결과를 화면에 직접 띄운다:

1. Firebase 설정값 6개 — 값과 공백/줄바꿈 혼입 여부.
   앞뒤 공백은 `firebase.ts` 가 자동으로 다듬어 쓰므로 실패 `✕` 가 아니라 안내 `·` 로 뜬다.
   다듬기 전 **원본**을 보여주므로 시크릿이 더러워졌다는 사실 자체는 계속 확인할 수 있다.
2. 인터넷·TLS — gstatic 으로 HTTPS 가 뚫리는지
3. 폰 시계 — 서버 시각과의 오차(초). 5분 이상이면 인증서 검증이 깨진다
4. Firebase Auth 서버 — `recaptchaParams` GET.
   ⚠️ **로그인 경로를 타지 않아 판별력이 없다.** 네트워크만 살아 있으면 통과한다.
5. **로그인 엔드포인트** — 실제 로그인 REST 엔드포인트에 가짜 자격증명으로 POST.
   **이게 결정적인 단계다.** 판정표는 4-2장에 있다.

로그인 실패 시 원본 예외 메시지(`errorDetail`)도 코드와 함께 표시된다.
`auth/network-request-failed` 는 fetch 가 던진 예외를 **종류 불문하고 전부** 뭉뚱그린
코드라 그것만 봐서는 원인이 안 갈린다는 점을 기억할 것.

## 5. 이미 겪은 런타임 크래시 (되돌리면 재발함)

### `getReactNativePersistence is not a function`
앱을 켜자마자 죽던 문제. **원인은 Metro가 Firebase의 웹 빌드를 골라온 것.**

`@firebase/auth`의 exports 조건 순서에서 활성 조건에 `react-native`가 없으면
`browser`/`default`가 먼저 걸려 웹 빌드가 선택된다. 웹 빌드에는 RN 전용인
`getReactNativePersistence`가 아예 없다.

**세 겹으로 막아뒀다. 하나라도 되돌리면 재발 위험 있음:**
1. `metro.config.js` — `unstable_conditionNames`에 `react-native` 명시 (근본 차단)
2. 우산 패키지 `firebase/auth` 대신 **`@firebase/auth`를 직접 import** (`src/lib/firebase.ts`, `src/stores/auth-store.ts` 둘 다). **한쪽만 바꾸면 Auth 인스턴스가 갈라진다.**
3. `src/lib/firebase.ts` — 그래도 함수를 못 찾으면 `getAuth()`로 폴백해 앱이 죽지 않게.

**검증 방법** (개발 서버를 띄운 상태에서):
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/src/app/_layout.bundle?platform=android&dev=true" -OutFile layout.js
Select-String -Path layout.js -Pattern '@firebase(/|\\)auth(/|\\)dist(/|\\)[a-z-]+' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Sort-Object -Unique   # dist/rn 하나만 나와야 정상
```
`firebase.ts`만 격리해서 번들하면 통과하는데 앱에서는 실패할 수 있다.
앱이 실제로 타는 경로는 `_layout → auth-store → firebase.ts`이므로 **`_layout` 경로로 확인해야 한다.**

## 5-1. TypeScript 함정 (건드리면 깨짐)

- `src/types/firebase-auth.d.ts`: `getReactNativePersistence` 타입 보강. **지우면 tsc 깨짐.**
- `src/types/env.d.ts`: `process.env.EXPO_PUBLIC_*` 타입 선언. Expo가 만드는 `expo-env.d.ts`는
  `.gitignore`에 있어 clone 직후 없다. **지우면 clone 직후 tsc가 깨짐.**
- 개발 서버를 켜면 `expo-env.d.ts`가 CRLF로 다시 쓰인다. 내용 변화가 없으면 `git checkout --`로 되돌릴 것.
- **IDE 진단이 편집 직후 한 박자 늦게 온다.** 이미 고친 줄에 오류를 계속 보고한다.
  판단은 `npx tsc --noEmit` 결과로 할 것.

## 6. 다음 세션 시작 순서

```powershell
# 1. Node.js LTS / Git / GitHub CLI 설치 (winget 없음 → msi/exe 직접 다운로드, 0장 참고)
# 2. PATH 새로고침
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
# 3. 인증 (사용자가 브라우저에서 디바이스 코드 입력해야 함)
gh auth login --web
gh auth setup-git
# 4. 클론 & 설치
gh auth setup-git
gh repo clone seopchang/danjjak
cd danjjak
npm install
git config user.name "seopchang"
git config user.email "yunseobchang123@gmail.com"
# 5. .env 재생성 (0장 참고) — 로그인 작업을 할 거면 필수
# 6. 확인
npx tsc --noEmit
npx expo start --web --port 8081
```

### 우선순위

**1. 폰에서 `로그인 연결 진단` 을 눌러 ⑤ `로그인 엔드포인트` 결과를 볼 것.**
빌드 run **31141586028** (2026-08-07 시작) 에 이 진단이 들어 있다.
결과에 따라 수사 방향이 완전히 갈린다 — 4-2장의 판정표를 그대로 따를 것.
**결과를 보기 전에 원인을 추측해서 문서에 적지 말 것.** 이미 두 번 틀렸다.

**2. 같은 빌드로 실기기 확인이 밀려 있는 것들을 한꺼번에 볼 것:**
- 새 앱 아이콘 (런처에 강아지가 잘리지 않고 나오는지)
  - 안드로이드 런처는 아이콘을 캐싱한다. 안 바뀌어 보이면 홈 새로고침이나 재부팅을 해볼 것.
- 캐릭터 카드 — 코인 라벨, `키우기` 버튼, 밥·물 게이지가 사라졌는지
- 변신 연출 — 회전 → 폭죽. 첫 승급은 코인 20개(단어 20개)면 된다
- 노트 화면 모눈·손글씨, 스플래시, 통계의 옛 기록이 `매치` 로 보이는지

**3. 로그인이 되면** → 폰↔패드 동기화 테스트 (캐릭터도 같이 넘어가는지 확인)

**4. 알림 실기기 확인** (자정 알림 시각을 아침으로 옮길지 사용자와 상의 — 9장)

### 아직 사용자 판단이 필요한 것

- HANDOFF 스펙과 다르게 구현된 곳 5개. 전부 시각적 취향 문제라 임의로 정하지 않았다.
  웹 미리보기로 보여주고 정하기로 했으나 아직 결론이 안 났다.
  1. 암기/복습 플래시카드가 사방 테두리 (스펙 §4.3: 위아래 선만, 좌우 없음)
  2. 진행률 `1/12` 가 12px (스펙: 24px)
  3. 칩 비활성 배경이 `surface` 회색 (스펙 §2.3: `background` 흰색)
  4. 단어 목록 행에 왼쪽 큰 번호가 없음 (스펙 §4.2-7: 30px, `line` 색, 폭 44)
  5. 단어(term) 34px (스펙: 38px)
- 7-2장의 `puppies` 증가 조건(`newStage >= 3`) 이 맞는지.

## 7. 작업 방식 메모

- 코드 수정할 때마다 사용자 요청대로 알아서 git add/commit/push.
- 사용자가 "작업 종료"라고 하면 **`gh auth logout` + 실행 중인 node 프로세스 정리**.
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨짐 → 파일로 작성 후 `git commit -F <file>`.
- 사용자는 화면을 보면서 수정을 요청하는 방식으로 일한다. 실기기 확인은 사용자 몫.
- 확인은 웹 미리보기(즉시) → APK(42분) 순서로. APK는 여러 변경을 모아서 한 번에.

## 7-1. HANDOFF "단짝" 리뉴얼 (2026-08-05 — 코드 작업 완료, 실기기 미검증)

원본 스펙과 자료는 **저장소 안에 넣어뒀다**: `handoff/`
- `handoff/HANDOFF.md` — 확정 스펙 (이게 기준 문서다. 작업 전 반드시 정독)
- `handoff/HANDOFF-addendum-care-guide.md` — 설정 화면 "강아지 키우기 안내" 추가 스펙
  (원본이 mojibake 로 전달돼서 복원 후 사용자 확인을 거쳐 UTF-8 로 다시 적어둔 것)
- `handoff/reference/web-prototype.dc.html` — 확정된 동작이 담긴 웹 프로토타입
- `handoff/assets-original/` — 전처리 전 원본 이미지 26개
- `handoff/prep-assets.ps1` — 아래 전처리를 수행한 스크립트

### 끝난 것

- **에셋 26개 배치 완료** (`assets/illustrations/`). 5.6MB → 383KB.
  - 원본은 **투명 픽셀 아래 RGB에 회색/녹색이 남아 있어** 축소 시 가장자리로 번졌다
    (8장에 기록된 것과 같은 현상). `complete-badge` 109,109,109 / `empty-flashcards` 153,153,154 /
    `empty-notebook` 139,139,140 / `icon-stats` **174,178,144 녹색**.
  - 전처리: 투명 픽셀 RGB를 ink 로 통일 → 투명 여백 크롭 → 표시 크기의 3배로 리사이즈.
    다시 만들 일이 생기면 `handoff/prep-assets.ps1` 을 그대로 쓸 것.
- **폰트 패키지 설치**: `@expo-google-fonts/nanum-pen-script`, `@expo-google-fonts/noto-sans-kr`
  (package.json 반영 완료. **아직 `_layout.tsx` 에서 로드하지 않았다.**)
- **데이터 모델** (`src/types/index.ts`)
  - `Deck.lang?: 'en' | 'ko'` / `Word.lang?` 추가 (구버전 레코드는 없으므로 optional,
    읽을 때는 `deckLang()` 헬퍼가 'en' 으로 본다)
  - `StudySessionType` 에 `'매치'` 추가. **`'리콜'` 은 지우지 않았다** — 이미 Firestore 에
    저장된 기록이 있기 때문. 화면 표기는 항상 `sessionTypeLabel()` 을 거쳐 '매치' 로 보여준다.
  - `Character` 타입 추가
- **캐릭터 스토어** (`src/stores/character-store.ts`) — 8단계 `STAGES`, `TOYS` 6종,
  하루 1회 `awardDaily()`, `feed`/`water`/`buyToy`, 애니메이션 트리거 `requestDance()`.
  `todayKey()` 는 로컬 날짜를 쓴다 (`toISOString()` 은 UTC 라 자정 근처에서 하루가 어긋난다).
- **Firebase 동기화 확장** (`src/lib/sync.ts`) — 캐릭터는 계정당 하나뿐이라 목록 병합이 아니라
  단일 문서 `users/{uid}/state/character` 로 주고받는다. `updatedAt` 최신 승.
  `firestore.rules` 는 `{document=**}` 와일드카드라 **규칙 수정 불필요**(확인함).

### 2단계에서 끝낸 것 (1~10번 전부, 2026-08-05)

1. **폰트 로드** (`1c1938c`) — `_layout.tsx` 에 Nanum Pen Script / Noto Sans KR 추가,
   `theme.ts` 에 `noteNumber`/`noteTerm`/`noteMeaning`/`logoLarge`/`logoSmall` 역할 추가.
2. **언어 선택 칩** (`256dce4`) — `addDeck(name, lang)`, 생성 폼에 `영어`/`한국어` 칩,
   단어는 덱 언어를 상속, 단어 추가 placeholder 가 언어별로 갈린다.
   생성 폼은 스펙대로 1px `line` 테두리의 세로 배치로 바꿨다.
3. **캐릭터 카드** (`7898ad4`) — `src/components/character/character-card.tsx`.
   이름 인라인 편집, 성장 진행 바, 밥/물 게이지, 장난감 상점 6종, 강아지 수.
4. **동작 애니메이션** (`7898ad4`) — `src/hooks/use-dog-motion.ts`.
   §5.5 키프레임을 `interpolate` 로 그대로 옮겼다. `transformOrigin: '50% 90%'`.
5. **스플래시** (`5ef88b1`) — `splash-overlay.tsx` + `splash-store.ts`.
   `_layout` 에 마운트해 앱 시작 시, 동기화 바 탭 시 2초간 뜬다.
6. **노트 화면** (`55dee82`) — `src/app/deck/[deckId]/note.tsx`. 덱 상세 헤더에 `노트` 버튼 추가.
7. **awardDaily 연결** (`5ef88b1`) — study / review(매일 복습) / recall 세 화면.
   매일 복습은 덱별로 세션이 여러 건 저장돼도 지급은 1회다.
8. **이름 변경** (`b991f9d`) — `단짝`, `단어 매치`. `app.json` 은 `name` 만 바꿨다.
9. **문구 교체** (`b991f9d`) — 통계 빈 상태, 매치 부족 안내.
10. **저장소 이름 변경** — `seopchang/vocadeck` → **`seopchang/danjjak`**.

추가로 **설정 화면 "강아지 키우기 안내"** 접이식 섹션 (`8f335ef`, 추가 핸드오프 스펙).

### 이 작업에서 확인된 것

- **`app.json` 의 `package`/`slug`/`scheme` 은 바꾸지 않았다.** 안드로이드 `package` 를 바꾸면
  기존 설치본을 업그레이드하지 못하고 데이터가 끊긴다. 표시 이름(`name`)만 `단짝` 으로 바꿨다.
- HANDOFF §5.2 의 `newStage >= 4` 가 0-based 인지 애매했는데, 추가 핸드오프의
  "4단계 이상 성장하면…" 문장으로 **1-based 4단계(= 인덱스 3)** 가 맞다고 확인됐다.
  `character-store.ts` 의 기존 `newStage >= 3` 구현이 맞다.

### 아직 안 한 것

- ⚠️ **실기기 미검증.** 웹 번들은 통과했고 `tsc` 도 통과하지만, 아래는 APK 로만 확인된다:
  캐릭터 애니메이션 실제 프레임 전환, 스플래시 타이밍, 노트 화면 모눈 렌더링, 손글씨 폰트 폴백.

### 폰트 관련 주의 — HANDOFF 와 의도적으로 다르게 간다

HANDOFF §1.2/§1.3 은 앱 타이틀·화면 타이틀·섹션 헤딩·버튼에 **Space Grotesk** 를 지정하지만,
이 자리들은 전부 한글이 들어간다(`단짝`, `설정`, `학습 시작`, `암기`). Space Grotesk 에는
한글 글리프가 없어 안드로이드 폴백이 일정하지 않다 — **이미 8장에서 겪고 Pretendard 로 바꾼 문제다.**
그래서 한글이 들어갈 수 있는 역할은 계속 Pretendard 를 쓴다.
Space Grotesk 는 라틴 전용(term)에만, Nanum Pen Script(노트)·Noto Sans KR(로고)은
둘 다 한글 글리프가 있으므로 스펙대로 쓰면 된다.

## 7-2. 캐릭터 코인 개편 + 변신 연출 (2026-08-07 — 코드 완료, 실기기 미검증)

스펙: **`handoff/HANDOFF-character-update.md`** (이게 캐릭터 관련 최신 기준 문서다).
`handoff/HANDOFF-addendum-care-guide.md` 는 이 문서 §6 으로 **대체됐다. 읽지 말 것.**

> 원본이 또 mojibake 로 전달됐다. 한글 UTF-8 의 이어지는 바이트가 `0x80~0x9F` 구간에
> 걸려 유실되어 **기계적 복원이 불가능**했다(ISO-8859-1 → UTF-8 왕복 실패 확인).
> 코드 블록·숫자·파일명은 ASCII 라 온전했고, 단계 이름은 기존 코드와 대조해 확정했으며,
> 화면 문구는 사용자가 직접 타이핑해 준 것을 옮겼다. 복원본을 UTF-8 로 저장해 뒀다.

### 바뀐 것

- **재화가 코인 하나뿐이다.** `points`/`hunger`/`thirst`/`lastActiveDate`/`toys` 필드와
  관련 UI·로직을 전부 없앴다. 하루 1회 지급(`awardDaily`)도 삭제했다.
- **단어 하나당 코인 1개, 즉시 지급, 하루 상한 없음.** 암기·복습·매치 세 화면 모두
  단어 단위로 `addCoin()` 을 부른다(세션 종료 시 일괄이 아니다).
- **성장 8단계 → 6단계.** 그림 차이가 거의 없던 청년·성숙한 리트리버를 뺐다.
- **승급이 수동이다.** 캐릭터 카드의 `키우기` 버튼을 눌러야 자라고 그때 코인을 낸다.
  비용은 단계 간 차액이라 20 / 40 / 90 / 150 / 300, 다 키우면 단어 600개다.
- **장난감에 보유 개념이 없다.** 누를 때마다 코인을 쓰고 한 번 반응하고 끝이다.
- **변신 모달** (`src/components/character/transform-modal.tsx`) — 1450ms 회전 + 들썩임 →
  폭죽(원 3개·방사형 선 12개·떠오르는 점 3개)과 함께 등장. 타이밍·이징은 스펙 그대로.
- 설정 안내서를 `단짝이 키우기 안내서` 항목 5개로 전면 교체했다.

### 건드리면 깨지는 것

- **`sanitize()` (`character-store.ts`)** — 단계가 8→6 으로 줄어서 옛 `stageIndex` 가
  6, 7이면 **배열 밖이라 앱이 죽는다.** 저장본(persist merge)과 원격본(mergeRemote)
  **양쪽 모두** 이 함수를 타야 한다. 없어진 필드도 여기서 버린다.
- **`DOG_IMAGES` 배열** — 스펙의 `img` 는 0-based 인데 이 저장소 파일명은
  `dog-stage-1.png` ~ `dog-stage-8.png` 로 1-based 다. 이 배열 한 곳에서만 맞춘다.
  `stageIndex` 를 그대로 파일명에 넣지 말 것. 마지막 단계는 `dog-stage-8` 을 쓴다.
- **폭죽의 원은 `borderRadius` 를 쓴다.** 8장의 "모든 borderRadius 는 0" 규칙의 예외로,
  스펙이 `border-radius:50%` 를 명시했다. 코드에 주석으로 남겨뒀다.
- `puppies` 증가 조건은 `newStage >= 3`(1-based 4단계) 을 유지했다. 새 문서의
  "4단계를 넘기면" 이 5단계부터라는 뜻이면 이 상수만 고치면 된다. **사용자 확인 필요.**

## 8. 디자인 시스템 (2026-08-04 전면 리뉴얼)

카드형 UI(둥근 모서리 + 그림자 + 배경면)를 **선(線) 기반 레이아웃**으로 전면 교체했다.
`handoff-design-spec.md`(사용자가 별도로 받은 명세)를 반영한 것이며, 기능·상태관리·동기화·라우팅은 건드리지 않았다.

### 지켜야 할 규칙
- **모든 `borderRadius`는 0.** 예외는 단 하나 — `sync-bar.tsx`의 6×6 동기화 상태 점(`borderRadius: 3`).
- **그림자 금지** (`shadowColor`, `elevation` 등). 위계는 선 굵기와 여백으로만 만든다.
- 강조 컨테이너 = `borderWidth: 2` + `ink`. 목록 행 구분 = `borderBottomWidth: 1` + `line`.
- 유채색은 **즐겨찾기 별(`#F5B301`) 하나뿐.** 나머지는 흑·백·회색.
- **라이트 고정.** `use-theme.ts`가 항상 `Colors.light`를 반환한다.

### 폰트 (중요)
- **Space Grotesk / JetBrains Mono에는 한글 글리프가 없다.** 라틴·숫자 전용으로만 쓸 것.
  - Space Grotesk: 단어(term)
  - JetBrains Mono: 수치, 진행률, 날짜, 개수
- **한글이 들어갈 수 있는 자리는 전부 Pretendard** (`assets/fonts/Pretendard-{Regular,Bold}.ttf`).
  제목·헤딩·버튼·라벨·본문이 여기 해당한다. 원래 명세는 한글 자리에도 Space Grotesk를
  지정했지만, 그대로 두면 안드로이드에서 폴백이 일정하지 않아 바꿨다.
- 타이포 역할 이름은 `src/constants/theme.ts`의 `Type`에 정의돼 있고,
  `ThemedText`의 `type` prop으로 쓴다 (`appTitle`, `sectionHeading`, `term`, `labelKo`, `body` 등).

### 일러스트 (`assets/illustrations/`)
| 파일 | 위치 | 표시 크기 |
|---|---|---|
| `empty-notebook.png` | 덱 목록 빈 상태 | 140×140 |
| `empty-flashcards.png` | 덱 상세, 리콜 4개 미만 안내 | 44×44 |
| `complete-badge.png` | 암기·복습·리콜 완료 화면 | 88×88 |
| `icon-stats.png` | 덱 상세 헤더 `통계` | 14×14 |
| `icon-settings.png` | 덱 목록 헤더 `설정` | 14×14 |

원본은 투명 픽셀 아래에 회색/녹색 RGB가 남아 있어 축소하면 가장자리로 번졌다.
**RGB를 `ink`로 통일하고 투명 여백을 잘라낸 뒤 리사이즈**해서 넣었다 (6.6MB → 62KB).
다시 만들 일이 생기면 같은 전처리를 할 것.

### 앱 아이콘
연필 그림(`assets/images/`). 안드로이드 어댑티브 아이콘은 108dp 중 가운데 72dp 원만 항상 보이므로,
**네모 액자가 잘리지 않도록 전경 레이어는 캔버스의 47%로** 배치했다.
잘림이 없는 스플래시/iOS용 `app-icon.png`는 68%.
`android-icon-monochrome.png`는 안드로이드 13+ 테마 아이콘용.

### 새로 만든 컴포넌트
- `common/square-switch.tsx` — 기본 `Switch`가 알약 모양이라 트랙·손잡이를 사각형으로 직접 그렸다.

### 미사용이 된 컴포넌트
- `common/card.tsx`, `common/icon-button.tsx` — 리뉴얼 후 아무 데서도 쓰지 않는다.
  `Card`는 명세에 정의된 컴포넌트라 남겨뒀고, `IconButton`은 새 디자인에 아이콘 버튼이 없어 완전히 죽은 코드다.

## 9. 알림 관련 남은 확인거리

- 안드로이드 13+ 는 알림 권한을 사용자가 직접 허용해야 한다. 스위치를 켤 때 권한을 요청하고, 거절당하면 안내 알럿을 띄운다.
- **자정(00:00) 알림이 실제로 원하는 동작인지 사용자와 재확인 필요.** 자는 시간이라 아침으로 옮기고 싶을 수 있다.
  시각은 `src/lib/notifications.ts`의 `REVIEW_HOUR`/`REVIEW_MINUTE` 두 줄만 고치면 된다.
- 복습 대상 선정 로직은 `src/utils/review-queue.ts` — **미암기 우선 → 본 지 오래된 순 → 등록 순**, 최대 50개(`DAILY_REVIEW_LIMIT`). 덱을 가리지 않고 전체에서 뽑는다.

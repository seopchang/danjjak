# 진행 상황 요약 (다음 세션 이어서 작업하기 위한 문서)

이 문서는 PC방 등 **매번 초기화되는 환경**에서 새 Claude Code 세션을 시작할 때,
지금까지의 작업 맥락을 빠르게 파악하기 위한 요약입니다.

마지막 갱신: 2026-08-05

## 0. 환경 관련 중요 사실

- 이 저장소는 **PC방 등 초기화되는 컴퓨터**에서 만들어졌습니다. 컴퓨터를 끄면 Node.js/Git/GitHub CLI 설치, 로컬 프로젝트 파일이 전부 사라집니다.
- 새 세션 순서: Node.js/Git/GitHub CLI 설치 → clone → `npm install` → `.env` 재생성 → 이어서 작업.
- winget이 동작하지 않는 머신입니다. nodejs.org / GitHub 릴리즈에서 msi/exe를 직접 받아 `msiexec /quiet`, `/VERYSILENT`로 조용히 설치합니다.
  - **설치 직후 PATH 반영 안 됨**: 새 PowerShell 명령마다 아래로 PATH를 새로고침해야 node/npm/git/gh/npx가 인식됩니다.
    ```powershell
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    ```
  - 2026-08-04 세션에서 설치된 버전: Node 24.19.0 / Git 2.55.0.3 / gh 2.97.0
- GitHub: **https://github.com/seopchang/vocadeck**. `gh auth login --web` 디바이스 코드 인증 필요(사용자가 브라우저에서 직접 입력 — 자동화 불가). 인증 후 `gh auth setup-git`.
  - git 사용자: `seopchang` / `yunseobchang123@gmail.com` (새 PC에서는 `git config user.name/user.email` 직접 설정해야 함)
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨집니다 → 파일로 작성 후 `git commit -F <file>` 사용.

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

**보카덱(VocaDeck)** — 영어 단어 암기 앱. 자매 프로젝트인 [study-app](https://github.com/seopchang/study-app)(국어 어휘 앱 "범작가 클래스")의 어휘장 기능을 영어용으로 다시 만들고, **폰과 패드에서 같이 쓰기 위해 Firebase 동기화**를 추가한 것입니다.

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
- ⚠️ **동기화 미검증.** 폰↔패드 간 실제 병합 동작 확인 필요.
- ⚠️ **로그인 수정 후 실기기 미검증.** 키를 고쳤지만 APK 를 다시 빌드해서 확인해야 한다 (4-2).
- ⚠️ **알림 실기기 미검증.** 웹에서는 확인 불가.
- ⚠️ **새 디자인·새 아이콘 실기기 미확인.** 웹에서는 확인함.

## 4-1. APK 빌드

```powershell
gh workflow run build-apk.yml
gh run list --workflow build-apk.yml --limit 5
```

- 빌드 시간 **약 42분**. 결과: https://github.com/seopchang/vocadeck/actions
- 성공 시 APK: https://github.com/seopchang/vocadeck/releases (`vocadeck.apk`, `apk-latest` 태그)

### 빌드 이력
| run | 결과 | 비고 |
|---|---|---|
| 30791137542 | ❌ 실패 (38분) | `resource drawable/splashscreen_logo not found` |
| 30794801485 | ✅ 성공 (42분) | 위 문제 수정 후 |
| 30815749231 | ✅ 성공 (41분) | 8장 기능 반영. `apk-latest` 릴리스에 올라간 것이 이 빌드 |

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

## 4-2. 로그인 오류 — 원인 확정 (2026-08-05 해결)

증상이었던 것: **APK로 로그인하면 실패. 컴퓨터 웹에서는 같은 계정으로 성공.**

### 원인: GitHub Secret 의 API 키에 오타 한 글자

`EXPO_PUBLIC_FIREBASE_API_KEY` 시크릿에 **소문자 `l` 이 대문자 `I` 로** 들어가 있었다.
(키의 9번째 글자. 폰트에 따라 눈으로는 구분이 안 된다.)

- 웹은 손으로 만든 로컬 `.env` 를 써서 **정상 동작**
- APK 는 CI 가 Secrets 로 만든 `.env` 를 써서 **틀린 키를 사용**

즉 "APK 로 변환하면서 깨진 것"이 아니라, APK 만 처음부터 다른 키를 들고 있었다.
안드로이드 환경(시계·VPN·DNS·네트워크)과는 무관했다.

**해결**: `gh secret set EXPO_PUBLIC_FIREBASE_API_KEY` 로 교체 완료.
나머지 5개 값은 콘솔과 일치함을 확인했다 (전부 숫자·소문자라 같은 혼동이 없다).

### 이걸 어떻게 잡았는지 (같은 상황 재발 시 그대로 쓸 것)

APK 안에 설정값이 그대로 박혀 있으므로, 빌드를 다시 하지 않고도 확인할 수 있다.

```powershell
gh release download apk-latest --repo seopchang/vocadeck --pattern "vocadeck.apk"
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
릴리스 APK 는 콘솔을 볼 수 없어서 결과를 화면에 직접 띄운다. 4단계를 보여준다:

1. Firebase 설정값 6개 — 값과 공백/줄바꿈 혼입 여부
2. 인터넷·TLS — gstatic 으로 HTTPS 가 뚫리는지
3. 폰 시계 — 서버 시각과의 오차(초). 5분 이상이면 인증서 검증이 깨진다
4. Firebase Auth 서버 — 같은 키로 요청해 구글이 돌려준 사유 문자열 그대로 노출

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
gh repo clone seopchang/vocadeck
cd vocadeck
npm install
git config user.name "seopchang"
git config user.email "yunseobchang123@gmail.com"
# 5. .env 재생성 (0장 참고) — 로그인 작업을 할 거면 필수
# 6. 확인
npx tsc --noEmit
npx expo start --web --port 8081
```

### 우선순위
1. **새 APK 빌드 → 폰에서 로그인 확인** (4-2). 키를 고쳤으니 이제 되어야 한다.
   안 되면 설정 화면의 `로그인 연결 진단` 버튼을 눌러 어느 단계에서 막히는지 볼 것
2. 로그인 되면 → 폰↔패드 동기화 테스트
3. 새 디자인·새 아이콘 실기기 확인
4. 알림 실기기 확인 (자정 알림 시각을 아침으로 옮길지 사용자와 상의 — 아래 9장)

## 7. 작업 방식 메모

- 코드 수정할 때마다 사용자 요청대로 알아서 git add/commit/push.
- 사용자가 "작업 종료"라고 하면 **`gh auth logout` + 실행 중인 node 프로세스 정리**.
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨짐 → 파일로 작성 후 `git commit -F <file>`.
- 사용자는 화면을 보면서 수정을 요청하는 방식으로 일한다. 실기기 확인은 사용자 몫.
- 확인은 웹 미리보기(즉시) → APK(42분) 순서로. APK는 여러 변경을 모아서 한 번에.

## 7-1. 진행 중 — HANDOFF "단짝" 리뉴얼 (2026-08-05 시작, 미완)

원본 스펙과 자료는 **저장소 안에 넣어뒀다**: `handoff/`
- `handoff/HANDOFF.md` — 확정 스펙 (이게 기준 문서다. 작업 전 반드시 정독)
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

### 남은 것 (순서대로)

1. `_layout.tsx` 에 Nanum Pen Script / Noto Sans KR 로드 + `theme.ts` 에 타이포 역할 추가
   (노트 손글씨 3종, 로고)
2. 단어장 생성 폼에 **언어 선택 칩**(`영어`/`한국어`) + 덱 상세 단어 추가 **placeholder 분기**
   (HANDOFF §4.1-7, §4.2-3)
3. **캐릭터 카드** 컴포넌트 (HANDOFF §5.4) — 덱 목록 상단, 동기화 바 아래
4. **동작 애니메이션** (§5.5) — 6단계 이상은 프레임 4장 순환, 미만은 트랜스폼만
5. **스플래시** (§5.6) — 앱 시작 2초 + 동기화 바 탭
6. **노트 화면** 신규 라우트 `src/app/deck/[deckId]/note.tsx` (§7)
7. 세션 저장 후 `awardDaily()` 호출 연결 (study/review/recall 3곳, §4.3·§4.4)
8. 이름 변경: 앱 이름 `보카덱` → **`단짝`**, `리콜` → **`단어 매치`** 전역 치환 (§3)
9. §3 문구 교체 — 통계 빈 상태, 매치 부족 안내 (나머지 4곳은 이미 일치함)
10. **GitHub 저장소 이름 변경**: `vocadeck` → `danjjak`
    (GitHub 저장소명은 한글 불가라 로마자. `gh repo rename danjjak` 후 `git remote set-url`)

### 폰트 관련 주의 — HANDOFF 와 의도적으로 다르게 간다

HANDOFF §1.2/§1.3 은 앱 타이틀·화면 타이틀·섹션 헤딩·버튼에 **Space Grotesk** 를 지정하지만,
이 자리들은 전부 한글이 들어간다(`단짝`, `설정`, `학습 시작`, `암기`). Space Grotesk 에는
한글 글리프가 없어 안드로이드 폴백이 일정하지 않다 — **이미 8장에서 겪고 Pretendard 로 바꾼 문제다.**
그래서 한글이 들어갈 수 있는 역할은 계속 Pretendard 를 쓴다.
Space Grotesk 는 라틴 전용(term)에만, Nanum Pen Script(노트)·Noto Sans KR(로고)은
둘 다 한글 글리프가 있으므로 스펙대로 쓰면 된다.

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

# 진행 상황 요약 (다음 세션 이어서 작업하기 위한 문서)

이 문서는 PC방 등 **매번 초기화되는 환경**에서 새 Claude Code 세션을 시작할 때, 지금까지의 작업 맥락을 빠르게 파악하기 위한 요약입니다.

## 0. 환경 관련 중요 사실

- 이 저장소는 **PC방 등 초기화되는 컴퓨터**에서 만들어졌습니다. 컴퓨터를 끄면 Node.js/Git/GitHub CLI 설치, 로컬 프로젝트 파일이 전부 사라집니다.
- 새 세션 순서: Node.js/Git/GitHub CLI 설치 → clone → `npm install` → 이어서 작업.
- winget이 동작하지 않는 머신입니다. nodejs.org / GitHub 릴리즈에서 msi/exe를 직접 받아 `msiexec /qn`, `/VERYSILENT`로 조용히 설치합니다.
  - **설치 직후 PATH 반영 안 됨**: 새 PowerShell 명령마다 아래로 PATH를 새로고침해야 node/npm/git/gh/npx가 인식됩니다.
    ```powershell
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
    ```
- GitHub: **https://github.com/seopchang/vocadeck**. `gh auth login --web` 디바이스 코드 인증 필요(사용자가 브라우저에서 직접 입력 — 자동화 불가). 인증 후 `gh auth setup-git` 필수.
  - git 사용자: `seopchang` / `yunseobchang123@gmail.com`
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨집니다 → 파일로 작성 후 `git commit -F <file>` 사용.
- Expo Go 미리보기: 이 머신은 사용자 휴대폰과 같은 네트워크가 아닐 가능성이 높아 터널이 필요합니다. **`npx expo start --tunnel`(ngrok)은 실패**하므로 **cloudflared 퀵 터널**로 우회합니다:
  1. `cloudflared-windows-amd64.exe`를 GitHub 릴리즈(cloudflare/cloudflared)에서 다운로드
  2. `cloudflared tunnel --url http://localhost:8081` 백그라운드 실행 → 출력에서 `https://xxx.trycloudflare.com` 확보
  3. `$env:EXPO_PACKAGER_PROXY_URL = "<그 URL>"` 설정 후 `npx expo start` (--tunnel 없이). **`CI=1`로 띄우면 watch 모드가 꺼지므로 설정하지 말 것.**
  4. Expo Go 접속 주소: `exp://xxx.trycloudflare.com`
- **폰의 Expo Go가 구버전이면 SDK 57 프로젝트가 안 열립니다** → 스토어에서 업데이트. (접속 안 되면 이것부터 확인)

## 1. 이 앱은 무엇인가

**보카덱(VocaDeck)** — 영어 단어 암기 앱. 자매 프로젝트인 [study-app](https://github.com/seopchang/study-app)(국어 어휘 앱 "범작가 클래스")의 어휘장 기능을 영어용으로 다시 만들고, **폰과 패드에서 같이 쓰기 위해 Firebase 동기화**를 추가한 것입니다.

study-app에서 가져온 것: 테마(`src/constants/theme.ts` 흑백 미니멀 팔레트), 공통 컴포넌트(`src/components/common/*`), 암기·복습·리콜 학습 로직, `shuffle.ts`.

## 2. 확정된 설계 결정 (2026-08-03 세션)

사용자와 논의해서 정한 것들입니다. 바꾸려면 먼저 확인할 것.

| 결정 | 내용 | 이유 |
|---|---|---|
| 저장소 | study-app과 **별도 저장소** | 기존 국어 앱을 건드려 깨뜨리지 않기 위해 |
| 범위 | **단어장 기능만** (일일과제·캘린더 없음) | 먼저 동기화가 잘 되는지 확인하고 필요하면 추가 |
| 덱 구조 | **여러 개 단어장(덱)** | "토익", "수능" 등 목적별 분리 |
| 오프라인 | **오프라인 우선 + 수동 동기화 버튼** | 사용자 요청: 평소 오프라인으로 쓰고 새 단어 넣을 때만 동기화 |
| 디자인 | study-app 흑백 미니멀 테마 재사용 | 검증된 디자인, 개발 속도 |
| 로그인 | **이메일 + 비밀번호** (구글 로그인 아님) | 아래 참고 |

### 로그인 방식이 구글이 아닌 이유 (중요)

사용자는 처음에 구글 로그인을 원했으나, Expo SDK 57 공식 문서 확인 결과:

- `expo-auth-session`의 `providers/google` 모듈이 **SDK 57에 없음**
- 공식 권장 라이브러리들은 **Expo Go에서 동작하지 않음**(네이티브 코드 필요, 개발 빌드 필수)
- 예전 우회로 `auth.expo.io` 프록시는 폐지됨

Expo Go로 폰에서 바로 확인하는 워크플로우를 유지하기 위해 **이메일/비밀번호로 변경**했습니다. 사용자 기기는 **안드로이드 폰 + 안드로이드 태블릿**이라, 나중에 개발 빌드로 전환하면 구글 로그인 추가는 가능합니다(Firebase는 한 계정에 여러 로그인 수단 연결 가능).

## 3. 데이터 모델과 동기화

`src/types/index.ts`:

```
Deck    { id, name, createdAt, updatedAt, deletedAt }
Word    { id, deckId, term, meaning, example, tags[], status, isFavorite,
          registeredAt, lastReviewedAt, updatedAt, deletedAt }
StudySession { id, deckId, type(암기|복습|리콜), date, testedWordIds[],
          correctCount, incorrectCount, accuracy, durationSeconds, scopeLabel,
          updatedAt, deletedAt }
```

- 모든 레코드에 `updatedAt`(ISO 문자열). 사전순 비교 = 시간순 비교라 Firestore 쿼리에 그대로 쓸 수 있음.
- 삭제는 **tombstone**(`deletedAt` 채움). 화면에서는 `visibleDecks()` / `deckWords()` 헬퍼로 걸러냄.
- **태그는 문자열 배열**로 단어에 직접 저장 (study-app처럼 별도 tags 스토어의 id 참조가 아님) — 기기 간 id를 맞출 필요가 없어 동기화가 단순해짐.

동기화(`src/lib/sync.ts`)는 수동 3단계: ① 로컬 변경분 id 기록 → ② 원격 변경분 받아 병합(최신 `updatedAt` 승) → ③ 기록해둔 id들의 병합 후 값을 업로드. Firestore 경로는 `users/{uid}/decks|words|sessions/{id}`.

**한계**: 기기 시계가 크게 어긋나면 최신 판정이 틀릴 수 있음. 개인용 2기기 수준이라 단순하게 감.

## 4. 검증 상태 (2026-08-03 세션 종료 시점)

### 끝난 것
- `npx tsc --noEmit` 통과.
- 전 라우트/모듈 Metro 개별 컴파일 통과 (10개).
- Firebase 프로젝트 `vocadeck` 생성 완료 (프로젝트 ID `vocadeck-4d370`).
  - Firestore: Standard 버전, `(default)` DB, **위치 asia-northeast3(서울)** — 위치는 변경 불가.
  - 보안 규칙: `firestore.rules` 내용으로 교체 후 게시 완료.
  - 웹 앱 등록 완료 → 설정값은 로컬 `.env`(커밋 안 됨)와 **GitHub Secrets 6개**에 들어있음.
- **Firebase 콘솔 UI 개편됨**: 예전 "빌드" 메뉴 없음. 좌측 **제품 카테고리 → 데이터베이스 및 스토리지 → Firestore Database** 경로.
- `.env`가 없으면 앱은 **로컬 전용 모드**로 동작하며 단어장 기능은 전부 정상 (`isFirebaseConfigured()` 가드).

### 아직 확인 안 된 것 (다음 세션에서 제일 먼저)
- ⚠️ **실기기에서 앱이 뜨는 걸 한 번도 못 봄.** 화면 렌더링·레이아웃은 미검증.
- ⚠️ **로그인/회원가입 미검증.** Firebase Auth 실제 통신을 해본 적 없음.
- ⚠️ **동기화 미검증.** 폰↔패드 간 실제 병합 동작 확인 필요.

## 4-1. APK 빌드 현황과 실패 시 대처

빌드 결과는 여기서 확인: **https://github.com/seopchang/vocadeck/actions**
성공 시 APK 위치: **https://github.com/seopchang/vocadeck/releases** (`vocadeck.apk`, `apk-latest` 태그)

### 빌드 이력
| run | 결과 | 비고 |
|---|---|---|
| 30791137542 | ❌ 실패 (38분) | `resource drawable/splashscreen_logo not found` — 아래 참고 |
| 30794801485 | ⏳ 세션 종료 시점 진행 중 | 위 문제 수정 후 재시도. 리소스 링크 단계는 통과한 것 확인함 |

### 이미 겪은 실패와 해결법

**(1) `resource drawable/splashscreen_logo not found`** — 해결됨
`expo-splash-screen` 플러그인에 `imageWidth`만 주고 `image`를 안 주면, 로고를 참조하는 `styles.xml`은 생성되는데 정작 drawable이 안 만들어진다. **Expo Go는 스플래시를 건너뛰므로 개발 중엔 절대 안 드러나고 네이티브 빌드에서만 터진다.** app.json의 splash 설정에 `image`를 반드시 넣을 것.

**(2) 토큰에 `workflow` 스코프 없음**
`.github/workflows/*` 를 푸시하면 `refusing to allow an OAuth App to create or update workflow` 로 거부된다. → `gh auth refresh -h github.com -s workflow` (디바이스 코드 인증 필요, 사용자가 브라우저에서 입력).

### 빌드가 또 실패하면 (다음 세션 순서)

```powershell
# 1. PATH 새로고침 (이 머신 필수)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# 2. 어느 단계에서 깨졌는지
gh run list --workflow build-apk.yml --limit 5
gh run view --job=$(gh run view <RUN_ID> --json jobs --jq '.jobs[0].databaseId')

# 3. 실패 로그에서 원인만 추리기
gh run view --log-failed --job=<JOB_ID> | Select-String -Pattern "error|FAILURE|What went wrong|Caused by"
```

**중요: 고친 뒤 40분짜리 CI를 돌리기 전에 반드시 로컬에서 먼저 검증할 것.**
```powershell
Remove-Item -Recurse -Force android
npx expo prebuild --platform android --no-install
# 생성물 직접 확인 (예: 스플래시 문제였다면)
Get-ChildItem -Recurse android\app\src\main\res -Filter "splashscreen_logo*"
```
`android/` 폴더는 `.gitignore`에 있으므로 커밋되지 않는다. CI가 매번 새로 만든다.

로컬에 JDK17/Android SDK가 없어서 `gradlew assembleRelease`까지는 로컬 검증이 안 된다. prebuild 단계까지만 확인 가능.

### 빌드는 성공했는데 앱이 죽으면
Expo Go로 붙어서 에러 스택을 봐야 원인이 잡힌다 (0장 cloudflared 터널 방식 참고). APK만으로는 스택 추적이 어렵다.
이미 한 번 겪은 크래시는 5장에 정리해둠.

## 5. 이미 겪은 런타임 크래시 (되돌리면 재발함)

### `getReactNativePersistence is not a function`
앱을 켜자마자 죽던 문제. **원인은 Metro가 Firebase의 웹 빌드를 골라온 것.**

`@firebase/auth`의 exports 조건 순서는
`types → node → react-native → cordova → webworker → browser → default`
인데, 활성 조건에 `react-native`가 없으면 `browser`/`default`가 먼저 걸려 웹 빌드(`dist/esm`)가 선택된다. 웹 빌드에는 RN 전용인 `getReactNativePersistence`가 아예 없다.

**세 겹으로 막아뒀다. 하나라도 되돌리면 재발 위험 있음:**
1. `metro.config.js` — `unstable_conditionNames`에 `react-native` 명시 (근본 차단)
2. 우산 패키지 `firebase/auth` 대신 **`@firebase/auth`를 직접 import** (`src/lib/firebase.ts`, `src/stores/auth-store.ts` 둘 다). 우산 패키지 export map에는 `react-native` 조건이 아예 없다. **한쪽만 바꾸면 Auth 인스턴스가 갈라진다.**
3. `src/lib/firebase.ts` — 그래도 함수를 못 찾으면 `getAuth()`로 폴백해 앱이 죽지 않게. (이 경우 로그인 상태가 재시작 시 유지 안 될 뿐 나머지는 정상)

**검증할 때 주의**: `src/lib/firebase.ts`만 격리해서 번들하면 통과하는데 앱에서는 실패할 수 있다. 앱이 실제로 타는 경로는 `_layout → auth-store → firebase.ts`이므로 **`_layout` 경로로 확인해야 한다.**
```powershell
Invoke-WebRequest -Uri "http://localhost:8081/src/app/_layout.bundle?platform=android&dev=true" -OutFile layout.js
Select-String -Path layout.js -Pattern '@firebase(/|\\)auth(/|\\)dist(/|\\)[a-z-]+' -AllMatches |
  ForEach-Object { $_.Matches.Value } | Sort-Object -Unique   # dist/rn 하나만 나와야 정상
```

## 5-1. TypeScript 함정 (건드리면 깨짐)

- `src/types/firebase-auth.d.ts`: `getReactNativePersistence`는 `@firebase/auth`의 `react-native` export 조건에만 있는데 export map의 `types` 조건이 먼저 매칭돼서 TS가 못 찾음. 타입만 보강해둔 것. **이 파일 지우면 tsc 깨짐.**
- `src/types/env.d.ts`: `process.env.EXPO_PUBLIC_*` 타입 선언. Expo가 만드는 `expo-env.d.ts`에도 같은 타입이 있지만, **개발 서버를 켜면 expo-cli가 `.gitignore`를 재생성하면서 그 파일을 다시 무시 목록에 넣음** → clone 직후에는 존재하지 않음. 도구와 싸우는 대신 실제로 쓰는 키만 직접 선언해 커밋해둠. **이 파일 지우면 clone 직후 tsc가 깨짐.** (expo-env.d.ts 유무 양쪽에서 tsc 통과 확인함)

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
npx tsc --noEmit
```

**`.env`는 커밋되지 않으므로 새 컴퓨터에서 다시 만들어야 한다.** 값은 GitHub Secrets에 있지만 읽어올 수는 없다(쓰기 전용). 두 가지 방법:
- Firebase 콘솔 → 프로젝트 설정 → 내 앱 → SDK 설정에서 다시 복사 (프로젝트 `vocadeck-4d370`)
- `.env` 없이도 앱은 로컬 전용 모드로 동작하므로, UI 작업만 할 거면 그냥 넘어가도 됨

### 우선순위
1. **APK 빌드 결과 확인** (`gh run list --workflow build-apk.yml`) — 실패했으면 4-1장 순서대로
2. **실기기에서 앱이 뜨는지 확인** — 아직 한 번도 못 봄. 이게 제일 큰 미검증 항목
3. 로그인 → 폰↔패드 동기화 테스트
4. 사용자가 폰으로 보면서 요청하는 UI 조정 반영

## 7. 작업 방식 메모

- 코드 수정할 때마다 사용자 요청대로 알아서 git add/commit/push.
- 사용자가 "작업 종료"라고 하면 **`gh auth logout` + 실행 중인 node/cloudflared 프로세스 정리** 할 것.
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨짐 → 파일로 작성 후 `git commit -F <file>`.
- 사용자는 폰으로 앱을 보며 수정을 요청하는 방식으로 일한다. 실기기 확인은 사용자 몫.

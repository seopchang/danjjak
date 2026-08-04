# 진행 상황 요약 (다음 세션 이어서 작업하기 위한 문서)

이 문서는 PC방 등 **매번 초기화되는 환경**에서 새 Claude Code 세션을 시작할 때,
지금까지의 작업 맥락을 빠르게 파악하기 위한 요약입니다.

마지막 갱신: 2026-08-04

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

- 값 위치: Firebase 콘솔 → 프로젝트 **`vocadeck-4d370`** → 프로젝트 설정 → 내 앱 → SDK 설정 및 구성
- 키 이름 6개 (GitHub Secrets에 있는 이름과 동일 — APK 빌드도 같은 값을 씁니다):
  ```
  EXPO_PUBLIC_FIREBASE_API_KEY
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN
  EXPO_PUBLIC_FIREBASE_PROJECT_ID
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  EXPO_PUBLIC_FIREBASE_APP_ID
  ```
- GitHub Secrets는 쓰기 전용이라 읽어올 수 없습니다. 콘솔에서 복사해야 합니다.
- `.env` 없이도 앱은 **로컬 전용 모드**로 동작합니다. 단, 그러면 설정 화면에 **로그인 폼 자체가 안 나옵니다**
  (`isFirebaseConfigured()` 가드). 로그인 관련 작업을 하려면 `.env`가 반드시 필요합니다.

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

### 아직 확인 안 된 것
- ⚠️ **동기화 미검증.** 폰↔패드 간 실제 병합 동작 확인 필요.
- ⚠️ **폰에서 로그인 실패 원인 미확정.** 범위는 좁혀졌음 (4-2).
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

## 4-2. 로그인 오류 조사 (범위 좁혀짐)

증상: **APK로 로그인 시도 → "네트워크에 연결할 수 없습니다"**.
이 문구는 `auth/network-request-failed` 코드에서만 나온다(`auth-store.ts`의 `toKoreanMessage`).

### 2026-08-04에 밝혀진 것 — **웹에서는 로그인이 정상 동작한다**

로컬 `.env`를 만들고 `npx expo start --web`으로 같은 계정 로그인을 시도했더니 **성공**했다.
따라서 아래는 전부 배제된다:

- ✅ Firebase 설정값 6개 정상 (apiKey, projectId, appId 등)
- ✅ 이메일/비밀번호 로그인 제공업체 활성화됨
- ✅ 계정 자체 정상
- ✅ Firestore 프로젝트 연결 정상
- ✅ GitHub Secrets 6개 이름이 코드가 기대하는 이름과 일치 → **APK도 웹과 같은 값을 쓴다**
- ✅ `AndroidManifest.xml`에 `android.permission.INTERNET` 있음 (이전 세션 확인)

→ **원인은 안드로이드 환경 쪽으로 좁혀졌다.**

### 다음에 확인할 것

폰에서 로그인이 실패하면 **이제 화면에 원본 에러 코드가 함께 표시된다**
(`auth-store.ts`의 `errorCode` → `settings.tsx`에서 오류 문구 아래 작게 노출).
릴리스 APK는 콘솔을 볼 수 없어서 화면에 띄우도록 만든 것이다. 그 코드를 보고 판단할 것.

`network-request-failed`가 그대로 나온다면 안드로이드 쪽 흔한 원인:
1. **폰 시간이 자동이 아님** → 시계가 틀어지면 SSL 검증이 실패하고 그게 `network-request-failed`로 나타난다. 가장 흔함.
2. VPN 켜져 있음
3. 사설 DNS(Private DNS) 설정됨
4. 폰이 웹 테스트와 다른 네트워크(모바일 데이터 등)

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
1. **폰에서 로그인 재시도 → 화면에 뜨는 에러 코드 확인** (4-2). 이게 제일 오래 막혀 있던 문제
2. 로그인 되면 → 폰↔패드 동기화 테스트
3. 새 디자인·새 아이콘 실기기 확인
4. 알림 실기기 확인 (자정 알림 시각을 아침으로 옮길지 사용자와 상의 — 아래 9장)

## 7. 작업 방식 메모

- 코드 수정할 때마다 사용자 요청대로 알아서 git add/commit/push.
- 사용자가 "작업 종료"라고 하면 **`gh auth logout` + 실행 중인 node 프로세스 정리**.
- **커밋 메시지에 한글**을 넣을 때 PowerShell 인라인 `-m`은 인코딩이 깨짐 → 파일로 작성 후 `git commit -F <file>`.
- 사용자는 화면을 보면서 수정을 요청하는 방식으로 일한다. 실기기 확인은 사용자 몫.
- 확인은 웹 미리보기(즉시) → APK(42분) 순서로. APK는 여러 변경을 모아서 한 번에.

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

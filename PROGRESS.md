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

## 4. 검증 상태

- `npx tsc --noEmit` 통과.
- ⚠️ **실기기 확인 아직 안 됨** — 사용자가 폰으로 보면서 조정할 예정.
- Firebase 프로젝트 `vocadeck` 생성됨 (2026-08-03, 사용자가 콘솔에서 직접 — 구글 계정 필요해 자동화 불가).
  - Firestore: Standard 버전, `(default)` DB, **위치 asia-northeast3(서울)** — 위치는 변경 불가.
  - 보안 규칙: `firestore.rules` 내용으로 교체 후 게시 완료.
  - ⏳ 남은 것: 웹 앱(`</>`) 등록해서 config 받기 → `.env` 채우기 → `npx expo start --clear` 재시작.
- **Firebase 콘솔 UI가 개편됨**: 예전 "빌드" 메뉴 없음. 좌측 **제품 카테고리 → 데이터베이스 및 스토리지 → Firestore Database** 경로로 들어가야 함.
- `.env`가 없으면 앱은 **로컬 전용 모드**로 동작하며 단어장 기능은 전부 정상. (`isFirebaseConfigured()` 가드)

## 5. TypeScript 함정 (건드리면 깨짐)

- `src/types/firebase-auth.d.ts`: `getReactNativePersistence`는 `@firebase/auth`의 `react-native` export 조건에만 있는데 export map의 `types` 조건이 먼저 매칭돼서 TS가 못 찾음. 런타임엔 Metro가 올바르게 해석하므로 타입만 보강해둔 것. **이 파일 지우면 tsc 깨짐.**
- `src/types/env.d.ts`: `process.env.EXPO_PUBLIC_*` 타입 선언. Expo가 만드는 `expo-env.d.ts`에도 같은 타입이 있지만, **개발 서버를 켜면 expo-cli가 `.gitignore`를 재생성하면서 그 파일을 다시 무시 목록에 넣음** → clone 직후에는 존재하지 않음. 도구와 싸우는 대신 실제로 쓰는 키만 직접 선언해 커밋해둠. **이 파일 지우면 clone 직후 tsc가 깨짐.** (expo-env.d.ts 유무 양쪽에서 tsc 통과 확인함)

## 6. 작업 방식 메모

- 코드 수정할 때마다 사용자 요청대로 알아서 git add/commit/push.
- 사용자가 "작업 종료"라고 하면 **`gh auth logout` + 실행 중인 node/cloudflared 프로세스 정리** 할 것.

# 단짝 (구 vocadeck) — 디자인 & 기능 핸드오프

이 문서 하나로 웹 프로토타입에서 확정한 **모든 변경 사항**을 리포지토리(Expo / React Native)에 반영할 수 있다.
기능·데이터 구조·라우팅을 크게 바꾸는 항목은 "신규 기능" 절에 따로 정리했다.

동봉 파일
- `assets/` — 앱에 넣을 이미지 26개 (강아지 8단계, 동작 5종, 장난감 6종, 아이콘 3종, 빈 상태 3종, 앱 아이콘)
- `reference/web-prototype.dc.html` — 확정된 동작을 그대로 담은 웹 프로토타입 (구현 참고용, 그대로 복사하지 말고 동작 기준으로만 볼 것)

---

## 0. 작업 원칙

- Firebase 동기화, 오프라인 우선 저장, 라우팅 구조는 유지한다.
- 시각 스타일은 **선(線) 기반**이다. 카드형(둥근 모서리 + 그림자 + 배경색 박스)을 전부 없앤다.
- 모든 `borderRadius`는 **0**이다. 예외는 §1.4에 명시된 두 곳뿐이다.
- 유채색은 즐겨찾기 별 하나(`#F5B301`)만 쓴다. 그 외에는 흑·백·회색.

---

## 1. 디자인 토큰

### 1.1 색상 (`src/constants/theme.ts`)

| 이름 | 값 | 용도 |
|---|---|---|
| `ink` | `#111111` | 기본 텍스트, 주요 테두리, 채워진 버튼 배경 |
| `inkMuted` | `#3D3D3D` | 부정/삭제 계열 버튼 (미암기, 삭제) |
| `textSecondary` | `#6B6B6B` | 보조 텍스트, 라벨, 비활성 아이콘 |
| `textTertiary` | `#A3A3A3` | 가려진 뜻, 안내문, placeholder |
| `line` | `#E2E2E2` | 얇은 구분선, 보조 테두리 |
| `surface` | `#F4F4F4` | 아주 옅은 면 (진행 바 트랙 등) |
| `background` | `#FFFFFF` | 화면 배경 |
| `onInk` | `#FFFFFF` | 검정 배경 위 텍스트 |
| `favorite` | `#F5B301` | 즐겨찾기 별 (활성) — 앱 내 유일한 유채색 |

### 1.2 폰트

```bash
npx expo install expo-font \
  @expo-google-fonts/space-grotesk \
  @expo-google-fonts/jetbrains-mono \
  @expo-google-fonts/nanum-pen-script \
  @expo-google-fonts/noto-sans-kr
```

| 서체 | 용도 |
|---|---|
| **Space Grotesk** (600/700) | 제목, 화면 타이틀, 섹션 헤딩, 단어(term), 버튼 |
| **JetBrains Mono** (500/600/700) | 라벨, 칩, 수치, 진행률, 날짜, 포인트/코인 |
| **Nanum Pen Script** | **노트 화면 전용** 손글씨 (단어·뜻·번호) |
| **Noto Sans KR** (900) | 로고 "단어짝꿍", 스플래시 |
| 시스템 폰트 | 한글 본문 |

### 1.3 타이포 스케일

| 역할 | 폰트 | 크기 | 비고 |
|---|---|---|---|
| 앱 타이틀 (단짝) | Space Grotesk 700 | 28 | letterSpacing -0.3 |
| 화면 타이틀 | Space Grotesk 700 | 19 | |
| 섹션 헤딩 | Space Grotesk 700 | 16 | |
| 단어 (플래시카드) | Space Grotesk 700 | 38 | |
| 큰 숫자 (복습 개수) | JetBrains Mono 700 | 44 | 단위 "개"는 16 |
| 진행률 (n/N) | JetBrains Mono 700 | 24 | |
| 통계·요약 수치 | JetBrains Mono 700 | 26~32 | |
| 라벨 / 버튼 / 칩 | JetBrains Mono 600 | 10~13 | letterSpacing 0.4~1.0, 라틴은 대문자 |
| 본문 | 시스템 | 14 | |
| 보조 안내문 | 시스템 | 13 | `textSecondary` |
| 노트 단어 | Nanum Pen Script | 26 | rotate -0.6° |
| 노트 뜻 | Nanum Pen Script | 23 | rotate 0.5° |

### 1.4 테두리 / 여백 규칙

- 강조 컨테이너: `borderWidth: 2`, `borderColor: ink`, `borderRadius: 0`
- 리스트 행 구분: `borderTopWidth: 1, borderTopColor: line`
- 섹션 구분: 하단 `borderBottomWidth: 1, borderBottomColor: line` + `paddingBottom: 24, marginBottom: 24`
- 헤더 구분선: `borderBottomWidth: 2, borderBottomColor: ink`
- 화면 좌우 패딩 20 / 상단 32 / 하단 120
- 그림자(`shadow*`, `elevation`) 전부 제거

**`borderRadius`를 쓰는 유일한 두 곳**
1. 동기화 상태 점: 6×6 원 (`borderRadius: 3`)
2. 스플래시 없음 — 스위치 손잡이는 **사각형**이다 (원형 아님)

---

## 2. 공통 컴포넌트

### 2.1 `button.tsx`

| variant | 배경 | 테두리 | 텍스트 |
|---|---|---|---|
| `primary` | `ink` | 2px `ink` | `onInk`, Space Grotesk 700, 14 |
| `outline` | transparent | 2px `ink` | `ink`, Space Grotesk 700, 14 |
| `danger` | `inkMuted` | 2px `inkMuted` | `onInk`, Space Grotesk 700, 14 |
| `ghost` | transparent | 없음 | `textSecondary`, JetBrains Mono 600, 13, 밑줄 |

공통 `borderRadius: 0`, `paddingVertical: 13`, `paddingHorizontal: 16`. disabled는 `opacity: 0.35`.

### 2.2 `card.tsx`

카드형을 폐기하고 두 모드만 남긴다.
- `variant="framed"`: `borderWidth: 2, borderColor: ink, padding: 20`
- `variant="row"` (기본): 배경/테두리 없음, `paddingVertical: 18`, 상단 `borderTopWidth: 1, borderTopColor: line`

### 2.3 `chip.tsx`

- 비활성: 배경 `background`, `borderWidth: 1, borderColor: ink`, 텍스트 `ink`
- 활성: 배경 `ink`, 텍스트 `onInk`
- 공통: `borderRadius: 0`, `paddingVertical: 5~6`, `paddingHorizontal: 10~12`, JetBrains Mono 600, 11, letterSpacing 0.4
- 칩 그룹 `gap: 8` (붙여 놓는 토글 그룹은 `gap: 0` + `marginRight: 8`)

### 2.4 `text-field.tsx`

박스형 → **밑줄형**.
- 주요 입력(단어/뜻/단어장 이름): `borderBottomWidth: 2, borderBottomColor: ink`
- 보조 입력(검색/태그): `borderBottomWidth: 1`
- `borderRadius: 0`, `paddingVertical: 8~10`, `paddingHorizontal: 2`, 글자 15, placeholder `textTertiary`

### 2.5 `checkbox.tsx`

16×16 정사각, `borderWidth: 2, borderColor: ink, borderRadius: 0`. 체크 시 배경 `ink` + 흰 체크.

### 2.6 `sync-bar.tsx`

배너 → 한 줄.
- 6×6 원형 점 (`textTertiary` = 미설정 / `ink` = 동기화됨) + 텍스트 `로컬 전용 모드 · 동기화 설정 안 됨`
- JetBrains Mono 500, 13, `textSecondary`, 배경/테두리 없음, `paddingVertical: 10, marginBottom: 20`
- **탭하면 §5.4 스플래시("동기화 중")를 띄운다.**

### 2.7 스위치 (설정 화면)

- 트랙 44×24, `borderWidth: 2, borderColor: ink, borderRadius: 0`, OFF 흰 배경 / ON `ink`
- 손잡이 16×16 **사각형**, 흰 배경 + 1px `ink` 테두리, `top: 2`, OFF `left: 0` / ON `left: 22`

---

## 3. 이름 변경 (전역)

| 기존 | 변경 |
|---|---|
| 앱 이름 "보카덱" / vocadeck | **단짝** (로고 표기 "단어짝꿍", 어·꿍만 작게) |
| "리콜 테스트" / "리콜" | **단어 매치** (모드 버튼 라벨은 `매치`) |
| 학습 기록 유형 `리콜` | `매치` |

문구 다듬기

| 위치 | 변경 후 |
|---|---|
| 오늘의 복습 (대상 있음) | 미암기 단어부터 순서대로 모았어요. |
| 오늘의 복습 (대상 없음) | 단어를 등록하면 목록이 채워집니다. |
| 설정 · 동기화 상태 | 이 기기에만 저장됩니다. |
| 설정 · 알림 보조문 | 미암기 단어를 먼저, 그다음 오래된 단어 순으로 최대 50개를 모아 복습을 시작합니다. |
| 통계 빈 상태 | 아직 학습 기록이 없습니다. 암기·복습·단어 매치를 한 번 진행하면 여기에 쌓입니다. |
| 매치 부족 안내 | 단어 매치는 단어가 4개 이상일 때 시작할 수 있습니다. |

---

## 4. 화면별 스펙

### 4.1 덱 목록 (`src/app/index.tsx`)

위에서 아래로:

1. **헤더** — 10×10 검정 정사각형 + `단짝`(Space Grotesk 700, 28) / 오른쪽 `설정` 버튼(아이콘 `icon-settings.png` 14×14 + 텍스트 12, `textSecondary`, 대문자). 하단 2px `ink` 구분선.
2. **동기화 바** — §2.6
3. **캐릭터 카드** — §5 (신규)
4. **오늘의 복습 카드** — `borderWidth: 2, borderColor: ink, padding: 20`, 전체 탭 영역
   - 대상 있으면 배경 `ink` + 내부 텍스트 `onInk`, 없으면 흰 배경 + 탭 비활성
   - 라벨 `오늘의 복습`(JetBrains Mono 600, 12, letterSpacing 0.8, 대문자) + 우측 `→`
   - 개수(JetBrains Mono 700, 44) + `개`(16)
   - 안내문 13, opacity 0.75
5. **요약 3분할** (전체 단어 / 암기완료 / 미암기) — 상단 1px `line`, 칸 사이 `borderRightWidth: 1`, 수치 JetBrains Mono 700 32, 라벨 12 `textSecondary` 대문자
6. **섹션 헤딩** `내 단어장 (n)`(Space Grotesk 700, 18) + 우측 `+` 버튼(28×28, 배경 `ink`, `onInk` 18; 열려 있으면 `×`)
7. **단어장 추가 폼** (펼침 상태) — `borderWidth: 1, borderColor: line, padding: 16, gap: 14`
   - 단어장 이름 입력 (2px 밑줄)
   - **언어 선택 칩** `영어` / `한국어` (§6, gap 8, 선택 시 검정 반전)
   - `추가` 버튼 primary, 우측 정렬 (`paddingVertical: 8, paddingHorizontal: 16`)
8. **단어장 행** — 상단 1px `line`, `paddingVertical: 18, gap: 10`
   - 1줄: 이름(Space Grotesk 700, 19, 말줄임) / `NN%`(JetBrains Mono, 13, `textSecondary`) / `삭제`(ghost)
   - 2줄: 진행 바 높이 4, 트랙 `surface`, 채움 `ink`
   - 3줄: `단어 N · 완료 N · 미암기 N`(JetBrains Mono, 13, `textSecondary`) + 우측 `›`
9. **빈 상태** — 상단 1px `line`, `paddingTop: 32`, 중앙 정렬, `gap: 14`
   - `empty-notebook.png` 140×140, opacity 0.85
   - `아직 단어장이 없습니다.`(14, 700) / `오른쪽 위 + 버튼으로 단어장을 하나 만들어 시작해보세요.`(14, `textSecondary`)

### 4.2 덱 상세 (`src/app/deck/[deckId]/index.tsx`)

1. **헤더** — `←` / 덱 이름(중앙, Space Grotesk 700, 19, 말줄임) / 우측에 버튼 2개 `gap: 12`
   - `노트` (아이콘 `icon-note.png` 14×14 + 텍스트) → §7 노트 화면
   - `통계` (아이콘 `icon-stats.png` 14×14 + 텍스트)
2. **학습 시작 블록** (섹션 구분 1px) — 헤딩 `학습 시작`
   - 대상 수치: `암기 N` / `복습 N` (JetBrains Mono 500, 13, `textSecondary`)
   - 옵션 칩: `랜덤 섞기`, `즐겨찾기만` (붙여서 배치)
   - 모드 버튼 3개 `암기` / `복습` / `매치` — `flex: 1`, outline, `gap: 8`, 비활성 `opacity: 0.35`
   - 단어 4개 미만이면: `empty-flashcards.png` 44×44 + 안내문(13, `textTertiary`), `gap: 10`
3. **단어 추가 블록** (섹션 구분 1px) — 헤딩 `단어 추가`
   - 단어 입력 (2px 밑줄) — placeholder는 **덱 언어에 따라** `단어 (예: abandon)` / `단어 (예: 사과)`
   - 뜻 입력 (2px 밑줄) — `뜻 (예: 버리다, 포기하다)` / `뜻 (예: 열매, 과일)`
   - 기존 태그 칩 (선택 토글) / 새 태그 입력 (1px 밑줄)
   - `추가` primary, 좌측 정렬, 두 입력 비면 비활성 + `opacity: 0.35`
4. **검색** (1px 밑줄, placeholder `단어 검색`)
5. **필터 칩** `즐겨찾기만`, `뜻 가림`/`뜻 보임` / 아래에 태그 칩 목록
6. **선택 삭제** — 선택 시에만 danger 버튼 `선택한 N개 삭제`
7. **단어 행** — 상단 1px `line`, `paddingVertical: 18`, 좌측에 큰 번호(JetBrains Mono 700, 30, `line` 색, 폭 44)
   - 1줄: 체크박스 16×16 / 상태 배지(`암기완료` 검정 반전 / `미암기` 흰 배경, 1px `ink`, JetBrains Mono 10, 대문자) / 우측에 별·`수정`(또는 `완료`)·`삭제`
   - 2줄: 단어(Space Grotesk 700, 19)
   - 3줄: 뜻 — 가려졌으면 `뜻 가림 · 눌러서 표시`(`textTertiary`), 탭하면 그 행만 공개
   - 태그 칩(1px `line`, 11, `textSecondary`) / 등록일(JetBrains Mono, 12, `textTertiary`)
   - 수정 모드면 단어·뜻·태그를 밑줄 입력 3개로 교체
8. **페이지네이션** — 중앙 `‹ 1 / 3 ›`, 이동 불가 화살표는 `textTertiary` (20개/페이지)

### 4.3 암기 / 복습 / 매일 복습 (`study.tsx`, `review.tsx`)

- 헤더: `←` + 모드명 (`암기하기 모드` / `복습하기 모드` / `매일 복습`)
- 안내 줄: 좌측에 설명문(13, `textSecondary`, 최대 폭 70%), 우측에 진행률 `03/12`(JetBrains Mono 700, 24)
- 플래시카드: 위아래 2px `ink` 선만 (좌우 테두리 없음), `paddingVertical: 48`, 중앙 정렬, `gap: 20`
  - (매일 복습에서만) 덱 이름 12, `textSecondary`, 대문자
  - 단어 Space Grotesk 700, 38
  - 뜻 영역: 1px **dashed** `textTertiary` 밑줄, `paddingVertical: 8`, 최소 폭 160 — 가림 시 `뜻 가림 · 눌러서 표시`
  - 기존 카드 뒤집기 애니메이션은 유지
- 판정 버튼: `암기 완료`(복습은 `기억함`) primary / `미암기` danger, `gap: 8`
- 하단: `학습 모드 종료`(매일 복습은 `복습 종료`) ghost + 밑줄
- 요약(완료) 화면: `complete-badge.png` 88×88 중앙 → 제목(Space Grotesk 700, 16, 중앙) → 결과 줄(JetBrains Mono 500, 14, `textSecondary`, 중앙) → `모드 종료` primary
  - 학습할 단어가 아예 없었으면 배지 숨김, 제목은 `학습할 단어가 없습니다.`
  - **세션 저장 후 §5.2 포인트 지급을 호출한다.**

### 4.4 단어 매치 (`recall.tsx`)

- 헤더: `←` + `단어 매치`
- 안내 줄 + 진행률 (§4.3과 동일 스타일, 진행률 22)
- 방향 전환 칩 `뜻 → 단어` / `단어 → 뜻` (붙여서 배치, 검정 반전)
- 문제 영역: 위아래 2px `ink` 선, `paddingVertical: 36`, 중앙 정렬
  - 라벨 12 `textSecondary` 대문자 (`다음 뜻에 해당하는 단어는?` / `다음 단어의 뜻은?`)
  - 문제 Space Grotesk 700, 24
- 선택지 4개: 각 항목 상단 1px `line`, `paddingVertical: 16`, 중앙 정렬, 16 Space Grotesk 600
  - 정답 공개 시 정답 항목 배경 `ink` + `onInk`, 오답 선택 항목 배경 `surface`
  - 선택 후 650ms 뒤 다음 문제 (기존 동작 유지)
- 하단 `테스트 종료` ghost
- 요약: `complete-badge.png` 88×88 → `단어 매치를 완료했습니다.` → `정답 N개 · 오답 N개 · 정답률 NN%` → `다시 풀기` outline / `모드 종료` primary
  - 단어 부족 시 배지 없이 `단어 매치를 만들 단어가 부족합니다. (4개 이상 필요)`
  - **세션 저장 후 §5.2 포인트 지급 호출**

### 4.5 통계 (`stats.tsx`)

- 헤더 `←` + `{덱 이름} 통계`
- 요약 4분할 (전체 / 암기완료 / 미암기 / 즐겨찾기) — 칸 사이 1px `line`, 수치 JetBrains Mono 700 26, 라벨 11 대문자
- 섹션 헤딩 `학습 기록`
- 세션 행: 상단 1px `line`, `paddingVertical: 16, gap: 8`
  - 1줄: 유형 배지(`암기`/`복습`/`매치`, 배경 `ink`, `onInk`, JetBrains Mono 11, 대문자) + 날짜 `YYYY.MM.DD HH:MM`(JetBrains Mono, 13, `textSecondary`) + 펼침 토글 `▼`/`▲`
  - 2줄: `N개 · 정답 N · 오답 N · NN% · N분 N초`
  - 펼침 시 `· term — meaning` 목록 / 삭제됐으면 `테스트한 단어가 삭제되었습니다.`

### 4.6 설정 (`settings.tsx`)

- 헤더 `←` + `설정`
- 블록 1 (섹션 구분 1px): `동기화가 설정되지 않았습니다` + `이 기기에만 저장됩니다.`
- 블록 2 (섹션 구분 1px): `매일 복습 알림` + 설명 + §2.7 사각 스위치 + 보조문
- 블록 3: `동기화 방식` + `이 앱은 항상 기기 안에 먼저 저장합니다. 인터넷이 없어도 단어 등록과 학습이 그대로 동작합니다.`

---

## 5. 신규 기능 A — 성장 캐릭터 (강아지)

덱 목록 화면 상단(동기화 바 아래, 오늘의 복습 위)에 카드 하나를 추가한다.
`borderWidth: 2, borderColor: ink, padding: 16, gap: 14`

### 5.1 저장 데이터

기존 저장소(로컬 우선 + Firebase 동기화)에 `character` 객체를 추가한다.

```ts
type Character = {
  name: string;            // 사용자가 정한 강아지 이름, 기본 ''
  points: number;          // 성장 포인트
  coins: number;           // 구매용 코인
  hunger: number;          // 0~100
  thirst: number;          // 0~100
  lastActiveDate: string | null; // 'YYYY-MM-DD'
  stageIndex: number;      // 0~7
  toys: string[];          // 보유 장난감 id
  puppies: number;         // 태어난 강아지 수
};
```

### 5.2 포인트 지급 (하루 1회)

암기·복습·매치 **세션이 하나라도 완료되면** 호출한다. 같은 날 두 번째부터는 아무 일도 하지 않는다.

```
today = YYYY-MM-DD
if (lastActiveDate === today) return;
daysSince = lastActiveDate ? max(1, 경과 일수) : 1
decay     = min(100, daysSince * 15)
points   += 10
coins    += 5
hunger    = max(0, hunger - decay)
thirst    = max(0, thirst - decay)
newStage  = points 기준 단계 인덱스
leveledUp = newStage > stageIndex
if (leveledUp && newStage >= 4) puppies += (newStage - stageIndex)
stageIndex = newStage
lastActiveDate = today
→ 저장 후 동작 애니메이션 재생 (레벨업이면 더 길게)
```

### 5.3 성장 8단계

| # | 이름 | 필요 포인트 | 이미지 |
|---|---|---|---|
| 1 | 새끼 강아지 | 0 | `dog-stage-1.png` |
| 2 | 아기 강아지 | 20 | `dog-stage-2.png` |
| 3 | 걸음마 강아지 | 60 | `dog-stage-3.png` |
| 4 | 어린 강아지 | 150 | `dog-stage-4.png` |
| 5 | 청소년 리트리버 | 300 | `dog-stage-5.png` |
| 6 | 청년 리트리버 | 500 | `dog-stage-6.png` |
| 7 | 성숙한 리트리버 | 750 | `dog-stage-7.png` |
| 8 | 든든한 리트리버 | 1100 | `dog-stage-8.png` |

매일 학습 시 +10P 기준으로 최종 단계까지 약 110일.

### 5.4 카드 레이아웃

**1행** (`flexDirection: row, alignItems: center, gap: 14`)
- 강아지 이미지 72×72 (`resizeMode: contain`) — 탭 가능
- 오른쪽 열:
  - 이름 (Space Grotesk 700, 16) — 탭하면 인라인 입력(1px `ink` 밑줄)으로 바뀌고 blur 시 저장. 비어 있으면 `이름을 정해주세요`
  - 같은 줄 우측: `{points}P · {coins}C` (JetBrains Mono, 12, `textSecondary`)
  - 그 아래 단계명 (JetBrains Mono, 11, `textTertiary`, 대문자)
  - 진행 바: 높이 4, 트랙 `surface`, 채움 `ink` — 다음 단계까지의 비율
  - 캡션 12 `textSecondary`: `매일 학습하면 자라요 · 다음 단계까지 NNP` (최고 단계면 `최고 단계에 도달했어요.`)

**2행 — 밥 / 물** (`row, gap: 16`, 각 `flex: 1`)
- 라벨 `밥` / `물` (11, `textSecondary`, 대문자) + 우측 `주기 (1C)` 버튼(11, 밑줄)
- 게이지: 높이 4, 트랙 `surface`, 채움 `ink`
- `주기`는 코인 1 소모, 해당 수치 +40 (최대 100). 코인 부족·이미 100이면 비활성 `opacity: 0.35`

**3행 — 장난감 상점** (`row, wrap, gap: 6`)
- 칩 6개: 아이콘 16×16 + 가격 텍스트만 (이름 없음)

| id | 이미지 | 가격 |
|---|---|---|
| `ball` | `toy-ball.png` | 8C |
| `bone` | `toy-bone.png` | 10C |
| `rope` | `toy-rope.png` | 12C |
| `frisbee` | `toy-frisbee.png` | 14C |
| `duck` | `toy-duck.png` | 16C |
| `plush` | `toy-plush.png` | 18C |

- 구매 시 코인 차감 + `toys`에 추가 + 동작 애니메이션 3회
- 보유하면 배경 `ink` + 라벨 `보유`, 미보유·코인 부족이면 `opacity: 0.35` 비활성

**4행** — `puppies > 0`이면 `함께 자란 강아지 N마리` (12, `textSecondary`)

### 5.5 동작 애니메이션

**트리거**: 강아지 탭 / 밥·물 주기 / 장난감 구매(3회) / 세션 완료(2회, 레벨업 4회)

- **6단계(청년 리트리버) 이상**: 아래 4장을 240ms 간격으로 순환
  1. `dog-action-bow.png` (플레이 바우)
  2. `dog-action-sit.png` (앉기)
  3. `dog-action-bow-2.png` (플레이 바우 측면)
  4. `dog-action-stand.png` (서기)
- **6단계 미만**: 프레임 교체 없이 자기 단계 이미지에 튀는 트랜스폼만 적용

트랜스폼(0.9초, `transform-origin: 50% 90%`, 지정 횟수 반복):

```
0%   rotate(0)    translateY(0)    scale(1)
15%  rotate(-12°) translateY(-6px) scale(1.04)
30%  rotate(6°)   translateY(-10px) scale(1.06)
45%  rotate(-6°)  translateY(-2px) scale(1)
60%  rotate(12°)  translateY(-8px) scale(1.05)
75%  rotate(-4°)  translateY(-3px) scale(1.02)
100% rotate(0)    translateY(0)    scale(1)
```

RN에서는 `Animated.sequence` / `withRepeat`(Reanimated)로 같은 값들을 구현하면 된다.

여분 에셋: `dog-action-sleep.png` — 배고픔·갈증이 낮을 때 엎드려 자는 표현으로 쓰면 좋다 (현재 프로토타입에는 미연결).

### 5.6 스플래시 (앱 시작 / 동기화 중)

앱을 열 때, 그리고 동기화 바를 탭할 때 **2초간** 전체 화면 오버레이를 띄운다.

- 배경 흰색, 중앙 정렬, `gap: 28`, 마지막 30% 구간에서 페이드 아웃
- 로고 `단어짝꿍` (Noto Sans KR 900; 단 40 / 어 21 / 짝 40 / 꿍 21, letterSpacing -0.02em)
- 260×96 영역, 하단에 2px `ink` 선(바닥) — 그 위를 강아지가 걷는다
  - `dog-action-stand.png` 84×84
  - 좌우 이동: `translateX -110px ↔ 110px`, 1.1초, ease-in-out, 무한 반복(왕복)
  - 방향 전환: 2.2초 주기로 `scaleX(1) ↔ scaleX(-1)` (step-end)
- 하단 라벨 (JetBrains Mono, 12, `textSecondary`, 대문자, letterSpacing 0.8): `불러오는 중` / 동기화 시 `동기화 중`

---

## 6. 신규 기능 B — 한국어 단어장

- **덱에 언어 속성 추가**: `Deck.lang: 'en' | 'ko'` (기본 `'en'`)
- 단어장 **생성 시** 언어를 고른다 (§4.1의 7번 폼). 생성 후 변경 UI는 없다.
- 단어에도 `Word.lang`을 저장하되, 값은 **덱의 언어를 그대로 상속**한다 (개별 선택 UI 없음).
- 덱 상세의 단어 추가 placeholder는 덱 언어에 따라 달라진다 (§4.2의 3번).
- **언어 혼합 방지**: 암기·복습·매치는 항상 한 덱 안에서만 돌기 때문에 한 언어로 고정된다. 매치의 오답 선택지도 같은 덱에서만 뽑으므로 언어가 섞이지 않는다.
- 예외: 매일 복습(`review.tsx`)은 전체 덱을 합쳐 최대 50개를 모으므로 언어가 섞인다. 현재는 의도된 동작이다.

---

## 7. 신규 기능 C — 노트 화면

새 라우트: `src/app/deck/[deckId]/note.tsx` (덱 상세 헤더의 `노트` 버튼으로 진입)

- 헤더: `←` / 덱 이름(중앙, Space Grotesk 700, 19) / 우측 `노트` 라벨(12, `textSecondary`, 대문자)
- 컨트롤 칩 (wrap, `gap: 6`)
  - 가리기 모드 3택 1: `모두 보기` / `단어 가리기` / `뜻 가리기` (선택 시 검정 반전, 바꾸면 공개 목록 초기화)
  - `순서 섞기` — 누를 때마다 표시 순서를 랜덤으로 다시 섞는다 (원본 데이터 순서는 바꾸지 않음, 화면 표시 순서만)
- 힌트 12 `textTertiary`: 모두 보기일 때 `가릴 항목을 고르면 노트를 덮고 외울 수 있어요.` / 그 외 `가려진 칸을 누르면 그 줄만 확인할 수 있어요.`
- **노트 본문**: `borderWidth: 2, borderColor: ink`, 모눈 배경
  - 격자: 24×24 간격의 가로·세로 선, 색 `rgba(17,17,17,0.09)`, 1px (RN에서는 반복 배경 이미지 또는 절대 배치 라인으로 구현)
  - 각 행 높이 48, 하단 `borderBottomWidth: 1, borderBottomColor: rgba(17,17,17,0.22)`
  - 좌측 번호 칸: 폭 44, 우측 `borderRightWidth: 1, borderRightColor: rgba(17,17,17,0.35)`, 번호는 Nanum Pen Script 19, `textSecondary`
  - 단어 칸(`flex: 1`): Nanum Pen Script 26, `ink`, `rotate: -0.6deg`
  - 뜻 칸(`flex: 1`): 좌측 `borderLeftWidth: 1` **dashed** `rgba(17,17,17,0.3)`, Nanum Pen Script 23, `#3D3D3D`, `rotate: 0.5deg`
  - 가려진 칸: 텍스트 `________`, 색 `#C8C8C8`, 배경 `rgba(17,17,17,0.07)` — 탭하면 그 행만 공개(토글)
- 빈 상태: `이 단어장에는 아직 단어가 없습니다.` (14, `textSecondary`)

---

## 8. 에셋

`assets/` 폴더의 26개 파일을 리포지토리에 넣는다 (`assets/illustrations/` 등 원하는 위치). 모두 흑백 라인아트이므로 `tintColor` 같은 색 처리 없이 원본 그대로 표시한다. `resizeMode: 'contain'`.

| 파일 | 사용처 | 표시 크기 |
|---|---|---|
| `dog-stage-1~8.png` | 캐릭터 카드 (현재 단계) | 72×72 |
| `dog-action-stand.png` | 동작 4번 프레임 / 스플래시 | 72×72 / 84×84 |
| `dog-action-sit.png` | 동작 2번 프레임 | 72×72 |
| `dog-action-bow.png` | 동작 1번 프레임 | 72×72 |
| `dog-action-bow-2.png` | 동작 3번 프레임 | 72×72 |
| `dog-action-sleep.png` | (예비) 배고픔·갈증 낮을 때 | 72×72 |
| `toy-ball/bone/rope/frisbee/duck/plush.png` | 장난감 상점 칩 | 16×16 |
| `icon-note.png` | 덱 상세 `노트` 버튼 | 14×14 |
| `icon-stats.png` | 덱 상세 `통계` 버튼 | 14×14 |
| `icon-settings.png` | 덱 목록 `설정` 버튼 | 14×14 |
| `empty-notebook.png` | 덱 목록 빈 상태 | 140×140 |
| `empty-flashcards.png` | 매치 단어 부족 안내 | 44×44 |
| `complete-badge.png` | 학습·매치 완료 요약 | 88×88 |
| `app-icon.png` | 앱 아이콘 (1024×1024, 흰 배경) | — |

앱 아이콘 적용 (`app.json`):

```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/illustrations/app-icon.png",
    "backgroundColor": "#FFFFFF"
  }
}
```

---

## 9. 체크리스트

- [ ] `theme.ts` 색상 토큰 교체 (유채색은 `favorite` 하나만)
- [ ] 4개 서체 로드 및 §1.3 타이포 스케일 적용
- [ ] 전역 `borderRadius` 검색 → 동기화 점 하나 외 전부 0
- [ ] 그림자(`shadow*`, `elevation`) 전부 제거
- [ ] `Card` 카드형 → 선 기반 행/프레임, `TextField` → 밑줄형, 스위치 손잡이 사각형화
- [ ] 앱 이름 `단짝`, "리콜" → "단어 매치" 전역 치환 (기록 유형 `매치` 포함)
- [ ] §3 문구 6곳 교체
- [ ] `Deck.lang` 추가 + 단어장 생성 시 언어 선택 + placeholder 분기
- [ ] `character` 저장 구조 추가 + 하루 1회 포인트/코인 지급 + 8단계 판정
- [ ] 캐릭터 카드(이름 편집·게이지·상점·강아지 수) 구현
- [ ] 동작 애니메이션 (6단계 이상 프레임 순환 / 그 이하 트랜스폼만)
- [ ] 스플래시 (앱 시작 2초 + 동기화 바 탭)
- [ ] 노트 화면 신규 라우트 (모눈 배경, 손글씨, 가리기, 순서 섞기)
- [ ] 에셋 26개 배치 + 앱 아이콘 등록
- [ ] 다크 모드가 있다면 이번 범위에서 제외하거나 `ink`/`background`만 반전

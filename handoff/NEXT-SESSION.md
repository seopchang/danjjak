# 다음 세션에 붙여넣을 프롬프트

---

PC방 컴퓨터라 아무것도 안 깔려 있고 winget도 안 돼.
nodejs.org랑 GitHub 릴리즈에서 직접 받아서 조용히 설치해줘 (Node.js LTS, Git, GitHub CLI).
설치해도 PATH가 새 프로세스에 자동 반영이 안 되니까, PowerShell 명령마다 앞에 이거 붙여:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

그다음:
1. gh auth login --web 으로 디바이스 코드 알려줘. 내가 브라우저에 입력할게.
   **인증되면 gh auth setup-git 도 꼭 실행해.** 안 하면 push가 `could not read Username`으로 막혀.
2. gh repo clone seopchang/danjjak 하고 npm install
3. git config user.name "seopchang" / user.email "yunseobchang123@gmail.com"
3-1. PROGRESS.md 0장의 ".env 재생성"에 값 6개가 적혀 있어. 그대로 복사해서 .env 만들어줘.
4. PROGRESS.md 전체 읽어. 특히 0장(환경), 4-2장(로그인 — 지금 제일 중요), 7-2장(캐릭터), 8장(디자인).
5. handoff/HANDOFF.md 는 전체 기준 스펙,
   handoff/HANDOFF-character-update.md 는 **캐릭터 관련 최신 기준**이야.
   handoff/HANDOFF-addendum-care-guide.md 는 위 문서 §6으로 대체됐으니 읽지 마.

## 지금 상황

리뉴얼 코드 작업은 다 끝났어. 지난 세션(2026-08-07)에 이것들을 푸시했어:

- `6704dd6` Firebase 설정값 trim
- `f9a9ae1` 앱 아이콘을 단짝 강아지로 교체
- `e2ab45c` 통계의 옛 '리콜' 기록을 '매치'로 표시
- `9e54cc0` 캐릭터 재화를 코인 하나로 통일 + 변신 연출
- `b44634b` 로그인 원인을 가려낼 진단 단계 추가

APK 빌드 run **31141586028** 을 돌려놨어. 위 변경이 전부 들어가 있어.
릴리스: https://github.com/seopchang/danjjak/releases (danjjak.apk, apk-latest 태그)

## 이번 세션에 할 일

### 1순위 — 로그인 원인 확정

**로그인은 아직 안 고쳐졌어.** 이게 제일 중요해.

지난 두 세션에 "원인 확정"이라고 두 번 적었는데 **두 번 다 틀렸어.**
그래서 이번엔 결과를 보고 판단할 수 있게 진단을 새로 넣었어.

폰에서 설정 → `로그인 연결 진단` 을 누르고 **⑤ `로그인 엔드포인트`** 줄을 봐줘.
내가 결과를 알려줄게. 판정은 PROGRESS.md 4-2장 표를 그대로 따르면 돼:

| ⑤ 결과 | 결론 |
|---|---|
| `HTTP 400 INVALID_LOGIN_CREDENTIALS` | 네트워크·키 전부 정상 → 원인은 **SDK 내부** |
| 예외 / 타임아웃 | 원인은 **네트워크 계층** |

**결과를 보기 전에 원인을 추측해서 문서에 적지 마.** 가설은 가설이라고 적어줘.

### 2순위 — 같은 APK로 실기기 확인

- 새 앱 아이콘 (런처에 강아지가 안 잘리고 나오는지)
  - 안 바뀌어 보이면 런처 캐시야. 홈 새로고침이나 재부팅 해볼 것
- 캐릭터 카드 — 코인 라벨 한 줄, `키우기` 버튼, 밥·물 게이지 사라졌는지
- 변신 연출 — 회전 → 폭죽. 첫 승급은 코인 20개니까 단어 20개 넘기면 돼
- 노트 화면 모눈·손글씨, 스플래시, 통계에서 옛 기록이 `매치`로 보이는지

### 3순위

- 로그인 되면 폰↔패드 동기화 테스트 (캐릭터도 같이 넘어가는지)
- 알림 실기기 확인 (자정 알림을 아침으로 옮길지 상의 — PROGRESS 9장)

## 내가 아직 정해야 하는 것 (물어봐줘)

1. HANDOFF 스펙과 다르게 구현된 곳 5개가 있어. 전부 보기 문제라 네가 임의로 정하지 말고
   웹 미리보기 띄워서 보여주고 물어봐. 목록은 PROGRESS.md 6장 "아직 사용자 판단이 필요한 것"에 있어.
2. 캐릭터 `puppies` 증가 조건이 4단계부터인지 5단계부터인지 (PROGRESS 7-2장 마지막 줄)

## 꼭 지킬 것

- **폰트**: HANDOFF는 한글 자리에도 Space Grotesk를 지정하는데 그건 따르지 마.
  한글 글리프가 없어서 안드로이드 폴백이 깨지는 걸 이미 겪고 Pretendard로 바꿨어 (PROGRESS 8장).
  한글 자리 = Pretendard, 라틴 전용(term) = Space Grotesk,
  노트 손글씨 = Nanum Pen Script, 로고 = Noto Sans KR.
- **app.json의 package / slug / scheme은 건드리지 마.** 바꾸면 안드로이드가 다른 앱으로 봐서
  기존 설치본을 업그레이드 못 하고 데이터가 끊겨. 표시 이름(name)만 "단짝"이야.
- **새로 만드는 데이터는 전부 Firebase에도 저장되게** 해줘.
- **캐릭터 sanitize()를 지우지 마.** 성장 단계가 8→6으로 줄어서 옛 stageIndex가 6,7이면
  배열 밖이라 앱이 죽어. 저장본과 원격본 양쪽 다 이 함수를 타야 해 (PROGRESS 7-2장).
- 커밋 메시지에 한글 넣을 땐 파일로 써서 git commit -F 로 해.
  이때 Out-File -Encoding utf8은 BOM을 붙이니까 PROGRESS 0장의
  [System.IO.File]::WriteAllText(..., UTF8Encoding($false)) 방식을 써.
- **한글 주석이 든 .ps1은 반대로 BOM이 꼭 있어야 해.** 없으면 PowerShell 5.1이 CP949로 읽어서
  깨진 한글이 줄바꿈을 삼키고 다음 줄이 주석 속으로 사라져. 지난 세션에 여기서 한참 헤맸어.
- 코드 고칠 때마다 알아서 git add/commit/push 해줘.
- 개발 서버 켜면 expo-env.d.ts가 CRLF로 다시 써지는데, 내용 변화 없으면
  git checkout -- 로 되돌리고 커밋하지 마.
- 확인 질문은 너무 자주 하지 말고 관련 작업은 한 번에 묶어서 진행해줘.
- **근데 확실하지 않은 걸 확실한 것처럼 말하지는 마.** 로그인 건에서 두 번 그랬어.
  검증 안 된 건 "가설"이라고 해줘.

## 작업 방식

- Expo Go는 안 써. 디자인 확인은 웹 미리보기로: npx expo start --web --port 8081
  → 브라우저에서 http://localhost:8081
  (.env는 서버 시작 시점에만 읽히니까 .env 만든 뒤에 서버 띄워야 해)
- 최종 확인은 APK 빌드: gh workflow run build-apk.yml — 42분. 변경 모아서 한 번에.
- 워크플로 파일(.github/workflows/*)을 고치려면 토큰에 workflow 스코프가 필요해.
  gh auth login --web은 기본으로 안 줘서, 필요하면
  gh auth refresh -h github.com -s workflow 로 디바이스 코드를 한 번 더 받아야 해.
- 내가 "작업 종료"라고 하면 gh auth logout 하고 실행 중인 node 프로세스 정리해줘.

## 토큰 관리

컨텍스트 길어지면 미리 말해줘. 중간에 끊기지 않게 커밋 자주 하고,
끝날 때쯤 PROGRESS.md 갱신하고 다음 세션 프롬프트 만들어줘.

---

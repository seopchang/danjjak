# 다음 세션에 붙여넣을 프롬프트

---

PC방 컴퓨터라 아무것도 안 깔려 있고 winget도 안 돼.
nodejs.org랑 GitHub 릴리즈에서 직접 받아서 조용히 설치해줘 (Node.js LTS, Git, GitHub CLI).
설치해도 PATH가 새 프로세스에 자동 반영이 안 되니까, PowerShell 명령마다 앞에 이거 붙여:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

그다음:
1. gh auth login --web 으로 디바이스 코드 알려줘. 내가 브라우저에 입력할게.
   인증되면 gh auth setup-git 도 꼭 실행해 (안 하면 push가 막혀).
2. gh repo clone seopchang/danjjak 하고 npm install
   (저장소 이름이 vocadeck에서 danjjak으로 바뀌었어)
3. git config user.name "seopchang" / user.email "yunseobchang123@gmail.com"
3-1. PROGRESS.md 0장의 ".env 재생성"에 값 6개가 적혀 있어. 그대로 복사해서 .env 만들어줘.
     (타이핑하지 말고 복사할 것 — API 키 9번째 글자가 소문자 l인데 대문자 I로 잘못 넣어서
      예전에 로그인이 오래 막혔던 적 있어)
4. PROGRESS.md 전체 읽어. 특히 0장(환경), 7-1장(리뉴얼 결과), 8장(디자인 시스템).
5. handoff/HANDOFF.md 와 handoff/HANDOFF-addendum-care-guide.md 읽어. 이게 기준 스펙이야.
   handoff/reference/web-prototype.dc.html 은 확정된 동작이 담긴 웹 프로토타입이고.

## 지금 상황

"보카덱" → "단짝" 전면 리뉴얼의 **코드 작업은 전부 끝났어.** HANDOFF 1~10번과
추가 핸드오프(설정 화면 "강아지 키우기 안내")까지 반영돼서 푸시된 상태야.
tsc 통과, 웹 번들 통과. 저장소 이름도 danjjak으로 바꿨어.

**이번 세션에 할 일은 실기기 검증이야.**

APK를 빌드해서 폰에서 두 가지를 한 번에 확인해줘:
1. **로그인이 되는지** — 지지난 세션에 GitHub Secret의 API 키 오타(소문자 l ↔ 대문자 I)를
   고쳤는데 아직 APK로 확인을 못 했어. 안 되면 설정 화면의 "로그인 연결 진단" 버튼을
   눌러서 나온 내용 알려줄게.
2. **리뉴얼 결과물** — 캐릭터 카드 애니메이션(강아지 탭/밥·물/장난감), 스플래시(앱 시작 2초),
   노트 화면(모눈 배경 + 손글씨), 단어장 만들 때 영어/한국어 칩, 설정 화면 접이식 안내.

로그인이 되면 폰↔패드 동기화도 테스트해줘 (캐릭터도 같이 넘어가는지).

## 남아 있는 자잘한 것

- 자정(00:00) 복습 알림 시각을 아침으로 옮길지 정해야 해 (PROGRESS 9장).
- 참고: 워크플로 파일(.github/workflows/*)을 고치려면 토큰에 workflow 스코프가 필요해.
  gh auth login --web 은 기본으로 안 줘서, 필요하면 gh auth refresh -h github.com -s workflow 로
  디바이스 코드를 한 번 더 받아야 해.

## 꼭 지킬 것

- **폰트**: HANDOFF는 한글 자리에도 Space Grotesk를 지정하는데 그건 따르지 마.
  Space Grotesk에 한글 글리프가 없어서 안드로이드 폴백이 깨지는 문제를 이미 겪고
  Pretendard로 바꾼 상태야 (PROGRESS 7-1장, 8장 참고).
  한글 들어가는 자리 = Pretendard, 라틴 전용(term) = Space Grotesk,
  노트 손글씨 = Nanum Pen Script, 로고 = Noto Sans KR. 뒤 둘은 한글 글리프 있어서 스펙대로 OK.
- **app.json의 package / slug / scheme은 건드리지 마.** 바꾸면 안드로이드가 다른 앱으로 봐서
  기존 설치본을 업그레이드 못 하고 데이터가 끊겨. 표시 이름(name)만 "단짝"으로 바꿔놨어.
- **새로 만드는 데이터는 전부 Firebase에도 저장되게** 해줘.
- 커밋 메시지에 한글 넣을 땐 파일로 써서 git commit -F 로 해 (PowerShell 인코딩 깨짐).
  이때 Out-File -Encoding utf8은 BOM을 붙이니까 PROGRESS 0장에 적어둔
  [System.IO.File]::WriteAllText(..., UTF8Encoding($false)) 방식을 써.
- 코드 고칠 때마다 알아서 git add/commit/push 해줘.
- 개발 서버 켜면 expo-env.d.ts가 CRLF로 다시 써지는데, 내용 변화 없으면
  git checkout -- 로 되돌리고 커밋하지 마.
- 확인 질문은 너무 자주 하지 말고 관련 작업은 한 번에 묶어서 진행해줘.

## 작업 방식

- Expo Go는 안 써. 디자인 확인은 웹 미리보기로: npx expo start --web --port 8081
  → 브라우저에서 http://localhost:8081
  (.env는 서버 시작 시점에만 읽히니까 .env 만든 뒤에 서버 띄워야 해)
- 최종 확인은 APK 빌드: gh workflow run build-apk.yml — 42분 걸림. 변경 모아서 한 번에.
- 내가 "작업 종료"라고 하면 gh auth logout 하고 실행 중인 프로세스 정리해줘.

## 토큰 관리

컨텍스트 길어지면 미리 말해줘. 중간에 끊기지 않게 커밋 자주 하고,
끝날 때쯤 PROGRESS.md 갱신하고 다음 세션 프롬프트 만들어줘.

---

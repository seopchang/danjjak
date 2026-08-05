# 다음 세션에 붙여넣을 프롬프트

---

PC방 컴퓨터라 아무것도 안 깔려 있고 winget도 안 돼.
nodejs.org랑 GitHub 릴리즈에서 직접 받아서 조용히 설치해줘 (Node.js LTS, Git, GitHub CLI).
설치해도 PATH가 새 프로세스에 자동 반영이 안 되니까, PowerShell 명령마다 앞에 이거 붙여:
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

그다음:
1. gh auth login --web 으로 디바이스 코드 알려줘. 내가 브라우저에 입력할게.
2. gh repo clone seopchang/vocadeck 하고 npm install
   (저장소 이름을 바꿨으면 그걸로 클론해)
3. git config user.name "seopchang" / user.email "yunseobchang123@gmail.com"
3-1. PROGRESS.md 0장의 ".env 재생성"에 값 6개가 적혀 있어. 그대로 복사해서 .env 만들어줘.
     (타이핑하지 말고 복사할 것 — API 키 9번째 글자가 소문자 l인데 대문자 I로 잘못 넣어서
      예전에 로그인이 오래 막혔던 적 있어)
4. PROGRESS.md 전체 읽어. 특히 0장(환경), 7-1장(지금 하던 작업), 8장(디자인 시스템).
5. handoff/HANDOFF.md 전체 읽어. 이게 지금 적용 중인 기준 스펙이야.
   handoff/reference/web-prototype.dc.html 은 확정된 동작이 담긴 웹 프로토타입이고.

## 지금 상황

앱을 "보카덱"에서 "단짝"으로 전면 리뉴얼하는 중이야. HANDOFF.md 스펙을 적용하고 있고,
1단계(에셋 26개 전처리·배치, 데이터 모델, 캐릭터 스토어, Firebase 동기화 확장)까지 끝나서
커밋 b3b9709로 푸시돼 있어. tsc는 통과 상태야.

남은 건 PROGRESS.md 7-1장 "남은 것"에 1~10번으로 순서대로 적혀 있어. 그거 이어서 해줘.
요약하면: 폰트 로드 → 언어 선택 칩 → 캐릭터 카드 → 동작 애니메이션 → 스플래시 →
노트 화면 → awardDaily 연결 → 이름 변경(단짝/매치) → 문구 교체 → 저장소 이름 변경.

## 꼭 지킬 것

- **폰트**: HANDOFF는 한글 자리에도 Space Grotesk를 지정하는데 그건 따르지 마.
  Space Grotesk에 한글 글리프가 없어서 안드로이드 폴백이 깨지는 문제를 이미 겪고
  Pretendard로 바꾼 상태야 (PROGRESS 7-1장 맨 아래, 8장 참고).
  한글 들어가는 자리 = Pretendard, 라틴 전용(term) = Space Grotesk,
  노트 손글씨 = Nanum Pen Script, 로고 = Noto Sans KR. 뒤 둘은 한글 글리프 있어서 스펙대로 OK.
- **새로 만드는 데이터는 전부 Firebase에도 저장되게** 해줘. 캐릭터는 이미
  users/{uid}/state/character 로 동기화 붙여놨어.
- 커밋 메시지에 한글 넣을 땐 파일로 써서 git commit -F 로 해 (PowerShell 인코딩 깨짐).
- 코드 고칠 때마다 알아서 git add/commit/push 해줘.
- 개발 서버 켜면 expo-env.d.ts가 CRLF로 다시 써지는데, 내용 변화 없으면
  git checkout -- 로 되돌리고 커밋하지 마.

## 작업 방식

- Expo Go는 안 써. 디자인 확인은 웹 미리보기로: npx expo start --web --port 8081
  → 브라우저에서 http://localhost:8081
  (.env는 위 3-1에서 만들어. 서버 시작 시점에만 읽히니까 .env 만든 뒤에 서버 띄워야 해)
- 최종 확인은 APK 빌드: gh workflow run build-apk.yml — 42분 걸림. 변경 모아서 한 번에.
- 내가 "작업 종료"라고 하면 gh auth logout 하고 실행 중인 프로세스 정리해줘.

## 참고: 지난 세션에 해결한 것

폰에서 로그인이 안 되던 문제 원인 확정했어. GitHub Secret의
EXPO_PUBLIC_FIREBASE_API_KEY에 소문자 l이 대문자 I로 들어가 있었어(눈으로 구분 안 되는 오타).
웹은 로컬 .env를 써서 됐고 APK만 틀린 키를 들고 있었던 거야. 시크릿은 교체 완료했고,
**다음 APK 빌드에서 로그인이 되는지 확인이 필요해.** 안 되면 설정 화면에
"로그인 연결 진단" 버튼 넣어놨으니까 그거 눌러서 나온 내용 알려줄게.
자세한 건 PROGRESS.md 4-2장에 다 적혀 있어.

## 토큰 관리

컨텍스트 길어지면 미리 말해줘. 중간에 끊기지 않게 커밋 자주 하고,
끝날 때쯤 PROGRESS.md 갱신하고 다음 세션 프롬프트 만들어줘.

---

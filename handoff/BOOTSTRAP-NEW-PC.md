# 새 PC 부트스트랩 프롬프트 (PC방 등 매번 초기화되는 환경)

**이 문서는 프로젝트에 묶여 있지 않다.** 어떤 저장소로 작업하든 그대로 쓸 수 있게 썼다.
`<OWNER>/<REPO>` 자리만 바꾸면 된다.

> ⚠️ **이 파일의 원본은 저장소 밖에 따로 보관할 것.**
> clone 하기 *전에* 필요한 내용이라, 저장소 안에만 두면 닭이 먼저냐 달걀이 먼저냐가 된다.
> 폰 메모장이나 메일에 복사해 두고, 여기 있는 건 고쳐 나가기 위한 버전 관리본으로 쓴다.

아래 `---` 사이를 통째로 복사해서 새 세션 첫 메시지로 붙여넣는다.

---

PC방 컴퓨터라 아무것도 안 깔려 있고 winget도 안 돼. 아래 순서로 개발 환경을 만들어줘.

## 1. 설치 (Node.js LTS / Git / GitHub CLI)

nodejs.org랑 GitHub 릴리즈에서 직접 받아서 조용히 설치해줘. 버전을 하드코딩하지 말고
아래에서 최신을 찾아서 받아:

- Node.js: `https://nodejs.org/dist/index.json` 에서 `lts` 가 false 아닌 최신 →
  `https://nodejs.org/dist/<version>/node-<version>-x64.msi`
- Git: GitHub API `repos/git-for-windows/git/releases/latest` 에서 `64-bit.exe`
  (`busybox` 들어간 건 제외)
- GitHub CLI: `repos/cli/cli/releases/latest` 에서 `windows_amd64.msi`

조용히 설치:
- msi: `msiexec /i "<file>" /qn /norestart`
- Git exe: `/VERYSILENT /NORESTART /NOCANCEL /SP-`

설치 후 `node -v`, `npm -v`, `git --version`, `gh --version` 찍어서 보여줘.

## 2. PATH — 명령마다 붙여야 함

설치해도 PATH가 새 프로세스에 자동 반영이 안 돼. PowerShell 명령마다 **맨 앞에** 이거 붙여:

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
```

## 3. GitHub 인증

`gh auth login --web` 을 백그라운드로 돌리고 **디바이스 코드를 나한테 알려줘.**
내가 브라우저에 입력할게 (자동화 불가). 내가 "됐어"라고 해도 실제로 완료됐는지
`gh auth status` 로 확인하고 넘어가.

인증되면 **`gh auth setup-git` 을 꼭 실행해.** 이거 안 하면 push 할 때
`could not read Username for 'https://github.com'` 로 막혀. (매번 여기서 걸림)

`.github/workflows/*` 를 고칠 일이 있으면 `--web` 기본 스코프에 `workflow` 가 없어서 거부돼.
그때는 `gh auth refresh -h github.com -s workflow` 로 디바이스 코드를 한 번 더 받아야 해.

## 4. 저장소

```powershell
gh repo clone <OWNER>/<REPO>
cd <REPO>
npm install
git config user.name "<이름>"
git config user.email "<메일>"
```

저장소 이름을 바꾼 적 있으면 clone 되는 폴더명이 옛 이름과 다를 수 있으니 실제 폴더를 확인해.

## 5. 프로젝트 문서 읽기

저장소에 `PROGRESS.md`, `AGENTS.md`, `CLAUDE.md`, `README.md`, `handoff/` 같은 게 있으면
작업 시작 전에 읽어. 특히 환경·비밀값·이미 겪은 함정이 적힌 장은 꼭.

`.env` 가 `.gitignore` 에 있으면 새 PC마다 다시 만들어야 해. 값이 문서에 적혀 있으면
**타이핑하지 말고 복사**해 (`I`/`l`/`1`, `O`/`0` 이 섞인 키에서 실제로 한 번 당했음).

## 이 환경에서 조심할 것 (전에 다 겪은 것들)

**PowerShell 인코딩 — 방향이 반대라 헷갈림**

- 커밋 메시지에 한글: 인라인 `-m` 은 깨짐 → 파일로 쓰고 `git commit -F <file>`.
  이때 **BOM 을 붙이면 안 됨** (제목 앞에 `﻿` 가 남음):
  ```powershell
  [System.IO.File]::WriteAllText("$PWD\.git\COMMIT_MSG.txt", $msg, (New-Object System.Text.UTF8Encoding($false)))
  ```
- 한글 주석이 든 `.ps1`: **BOM 이 반드시 있어야 함.** 없으면 PowerShell 5.1 이 ANSI(CP949)로
  읽어서, 깨진 한글의 마지막 글자가 **줄바꿈까지 삼켜 다음 줄이 주석 속으로 사라짐.**
  변수가 통째로 `$null` 이 되는데 에러는 엉뚱한 데서 남.
  ```powershell
  $t = [System.IO.File]::ReadAllText($p, [System.Text.UTF8Encoding]::new($false))
  [System.IO.File]::WriteAllText($p, $t, (New-Object System.Text.UTF8Encoding($true)))
  ```

**PowerShell 문법**

- 함수 안에서 `Write-Output` 쓰지 마. 반환값 파이프라인에 섞여 함수가 배열을 돌려줌.
  진단 출력은 `Write-Host` 로.
- `&&`, `||`, 삼항 연산자 없음 (5.1). `A; if ($?) { B }` 로.
- 변수는 **대소문자를 구분하지 않음.** `$DOG` 과 `$dog` 은 같은 변수.
- 네이티브 exe에 `2>&1` 붙이지 마. 정상 종료해도 실패로 잡힘.

**기타**

- 개발 서버를 켜면 자동 생성 파일이 CRLF로 다시 써지는 경우가 있음
  (Expo면 `expo-env.d.ts`). 내용 변화가 없으면 `git checkout --` 로 되돌리고 커밋하지 마.
  `git diff --ignore-cr-at-eol --stat` 로 진짜 변경인지 먼저 확인.

## 작업 방식

- 코드 고칠 때마다 알아서 `git add`/`commit`/`push` 해줘.
- 확인 질문은 너무 자주 하지 말고 관련 작업은 묶어서 진행해줘.
- **다만 확실하지 않은 걸 확실한 것처럼 말하지는 마.** 검증 안 된 건 "가설"이라고 해줘.
  원인을 단정하기 전에 실제로 확인할 방법이 있는지 먼저 생각해줘.
- 컨텍스트 길어지면 미리 말해줘. 중간에 끊기지 않게 커밋 자주 하고,
  끝날 때쯤 진행 문서 갱신하고 다음 세션 프롬프트 만들어줘.

## 끝날 때

내가 "작업 종료"라고 하면:
- `gh auth logout`
- 실행 중인 node/개발 서버 프로세스 정리
- 커밋 안 된 변경이 있으면 알려줘

---

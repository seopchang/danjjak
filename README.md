# 보카덱 (VocaDeck)

영어 단어 암기 앱. 폰과 패드에서 같은 단어장을 볼 수 있도록 Firebase 동기화를 지원한다.

- **오프라인 우선**: 모든 데이터는 기기 안(AsyncStorage)에 먼저 저장된다. 인터넷이 없어도 단어 등록과 학습이 그대로 동작한다.
- **수동 동기화**: 동기화 버튼을 눌렀을 때만 서버와 주고받는다. 자동으로 통신하지 않는다.
- **여러 단어장(덱)**: "토익", "수능" 처럼 목적별로 나눠서 관리한다.

자매 프로젝트: [seopchang/study-app](https://github.com/seopchang/study-app) (국어 어휘 앱 "범작가 클래스"). 테마와 공통 컴포넌트를 여기서 가져왔다.

## 기능

| 화면 | 내용 |
|---|---|
| 덱 목록 | 단어장 생성/삭제, 덱별 진행률 막대, 동기화 바 |
| 덱 상세 | 단어 등록(단어/뜻/예문/태그), 검색, 태그 필터, 즐겨찾기 필터, 뜻 일괄 가림/보임, 다중 선택 삭제, 20개 페이지네이션 |
| 암기하기 | 미암기 단어만. 단어를 보고 뜻을 가린 채 스스로 확인 → 암기완료/미암기 |
| 복습하기 | 암기완료 단어를 오래 안 본 순서로. 기억함/미암기 |
| 리콜 테스트 | 4지선다. **뜻→단어**와 **단어→뜻** 양방향 전환 가능. 정답=암기완료, 오답=미암기 |
| 통계 | 전체/암기완료/미암기/즐겨찾기 배지, 세션 기록(유형·정답률·소요시간·테스트한 단어 펼쳐보기) |
| 설정 | 이메일 로그인/가입/로그아웃, 동기화 방식 설명 |

## 기술 스택

- Expo SDK 57 (managed workflow), Expo Router (파일 기반 라우팅, `src/app`)
- TypeScript, React 19.2 / React Native 0.86
- 상태/영속화: `zustand` + `persist` + `@react-native-async-storage/async-storage`
- 동기화: **Firebase JS SDK** (`firebase` 패키지) — Auth(이메일/비밀번호) + Firestore

### 왜 Firebase JS SDK인가

`@react-native-firebase/*`와 구글 소셜 로그인 라이브러리는 **네이티브 코드가 필요해 Expo Go에서 동작하지 않는다**(개발 빌드 필수). Expo Go로 폰에서 바로 QR 미리보기를 하려면 JS SDK + 이메일/비밀번호 인증이어야 한다. 개인용 단어장 규모에서는 성능 차이가 사실상 없다.

> 구글 로그인을 나중에 넣고 싶다면 개발 빌드(dev client)를 만들어야 한다. Firebase는 한 계정에 여러 로그인 수단을 연결할 수 있으므로, 이메일 계정을 유지한 채 나중에 추가할 수 있다.

## 시작하기

```bash
npm install
npx expo start
```

Expo Go 앱으로 QR을 찍으면 바로 열린다. **폰의 Expo Go가 구버전이면 SDK 57 프로젝트가 열리지 않으니** 스토어에서 먼저 업데이트할 것.

Firebase 설정을 하지 않아도 앱은 **로컬 전용 모드**로 정상 동작한다. 동기화 바에 "로컬 전용 모드"라고 표시되고 동기화만 비활성화된다.

## Firebase 연동 (폰 ↔ 패드 동기화)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성
2. **Authentication** → 시작하기 → **이메일/비밀번호** 로그인 사용 설정
3. **Firestore Database** → 데이터베이스 만들기 (프로덕션 모드)
4. **규칙** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 붙여넣고 게시
5. **프로젝트 설정 → 내 앱 → 웹 앱 추가**(`</>` 아이콘) → SDK 설정값 복사
6. `.env.example`을 `.env`로 복사하고 값 채우기
7. `npx expo start --clear` 로 재시작 (환경변수는 번들 시점에 주입되므로 재시작 필요)

그 다음 폰과 패드에서 각각 **설정 → 같은 계정으로 로그인 → 동기화** 를 누르면 단어장이 합쳐진다.

### 동기화 동작 방식

`src/lib/sync.ts` 참고.

1. 로컬에서 마지막 동기화 이후 바뀐 항목의 id를 기록
2. 원격에서 마지막 동기화 이후 바뀐 항목을 받아 병합 (같은 항목이면 `updatedAt`이 최신인 쪽이 이김)
3. 1에서 기록한 id들의 *병합 후* 값을 업로드

삭제는 즉시 지우지 않고 `deletedAt`을 채우는 tombstone 방식이라 다른 기기에도 삭제가 전파된다.

**한계**: 두 기기의 시계가 크게 어긋나면 최신 판정이 틀릴 수 있다. 개인용 2기기 수준에서는 충분하다고 보고 단순한 방식을 택했다.

## 디렉토리 구조

```
src/
  app/                      Expo Router 라우트
    _layout.tsx             루트 레이아웃 (Firebase 인증 상태 구독)
    index.tsx               덱 목록
    settings.tsx            로그인 / 설정
    deck/[deckId]/
      index.tsx             덱 상세 (단어 목록·등록)
      study.tsx             암기 / 복습
      recall.tsx            리콜 4지선다
      stats.tsx             통계
  components/
    common/                 Button, Card, Chip, Screen 등 (study-app에서 가져옴)
    vocab/                  WordListRow, WordRegisterForm
    sync-bar.tsx            동기화 상태 바
  lib/
    firebase.ts             Firebase 초기화 (설정 없으면 로컬 전용 모드)
    sync.ts                 수동 동기화 엔진
  stores/                   zustand 스토어 (decks, words, sessions, auth, sync)
  types/                    데이터 모델
```

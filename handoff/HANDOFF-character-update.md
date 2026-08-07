# 단짝 — 캐릭터/변신 업데이트 (추가 지시)

기존 `HANDOFF.md` 이후의 모든 변경분이다. **이 문서 하나만 보면 된다.**
`HANDOFF-addendum-care-guide.md` 는 이 문서의 §6 으로 대체되었으니 무시할 것.

> 이 문서는 2026-08-07 세션에 원본이 **인코딩이 깨진 상태(mojibake)** 로 전달됐다.
> 한글 UTF-8 은 이어지는 바이트가 `0x80~0x9F` 구간에 자주 걸리는데 그 구간이 전달 과정에서
> 유실되어 기계적 복원이 불가능했다. 코드 블록·숫자·파일명은 ASCII 라 온전했고,
> 단계 이름은 기존 `character-store.ts` 와 대조해 확정했으며, 화면에 나가는 문구는
> 사용자가 직접 타이핑해 준 것을 그대로 옮겼다.

---

## 0. 재화를 코인 하나로 통일 (⚠ 기존 문서 §5.2 / §5.4 폐기)

기존 `HANDOFF.md` 의 **포인트(P) + 코인(C) 이중 재화, 하루 1회 지급, 밥·물 게이지**를 전부 없앤다.

### 없어진 것
- `points` 필드 → 삭제
- `hunger`, `thirst`, `lastActiveDate` 필드 → 삭제
- 밥/물 게이지 UI 와 `주기 (1C)` 버튼 → 캐릭터 카드에서 제거
- 하루 1회 `+10P / +5C` 지급 로직 → 제거 (`awardDaily` 삭제)
- 시간 경과에 따른 게이지 감소 로직 → 제거

### 새 규칙
**단어 하나를 공부할 때마다 코인 1개.** 모드 구분 없이 동일하다.

- 암기(플래시카드): 카드 한 장 넘길 때마다 +1
- 복습: 채점되는 단어 하나마다 +1
- 단어 매치: 문제 하나 풀 때마다 +1
- 하루 상한 없음. 세션 종료 시 일괄이 아니라 **단어 단위로 즉시 지급**한다.

```ts
type Character = {
  name: string;        // 사용자가 정한 강아지 이름, 기본 ''
  coins: number;       // 유일한 재화
  stageIndex: number;
  puppies: number;
};
```

캐릭터 카드 상단 라벨도 `포인트 N · 코인 N` 두 줄이 아니라 **`코인 N` 한 줄**이다.
승급 진행률 게이지는 `coins / 다음 단계 비용` 으로 계산한다.

### 마이그레이션
기존 저장 데이터에 `points` 가 있으면 코인으로 흡수하거나 그냥 버리면 된다.
`hunger` / `thirst` / `lastActiveDate` / `toys` 는 읽지 않고 무시한다.

---

## 1. 성장 단계를 8단계 → 6단계로 축소

중간 두 단계(청년 리트리버, 성숙한 리트리버)는 그림 차이가 거의 없어 제거했다.
청소년 리트리버 다음이 바로 마지막 단계다.

```ts
export const STAGES = [
  { name: '새끼 강아지',     min: 0,   img: 0 },
  { name: '아기 강아지',     min: 20,  img: 1 },
  { name: '걸음마 강아지',   min: 60,  img: 2 },
  { name: '어린 강아지',     min: 150, img: 3 },
  { name: '청소년 리트리버', min: 300, img: 4 },
  { name: '든든한 리트리버', min: 600, img: 7 },
];
```

- `img` 는 기존 이미지 파일 인덱스다. 원본 파일명은 그대로 두고 **단계 배열의 `img` 값으로
  이미지를 고른다.** 마지막 단계는 8번째 그림을 쓴다. 6·7번째 그림은 더 이상 쓰이지 않는다.
  - **이 저장소의 파일명은 `dog-stage-1.png` ~ `dog-stage-8.png` 로 1-based** 라서
    원본 문서의 0-based `img` 와 어긋난다. `img: 0` → `dog-stage-1.png`,
    `img: 7` → `dog-stage-8.png` 로 변환한다 (사용자 확인 완료).
- 이미지를 고르는 모든 지점에서 `STAGES[stageIndex].image` 를 쓴다.
  `stageIndex` 를 그대로 파일명에 넣는 코드가 있으면 전부 수정 대상이다.
- 승급 비용은 `next.min - current.min` 이라 자동으로 **20 / 40 / 90 / 150 / 300** 이 된다.
  총 600코인 = 단어 600개.
- `min` 은 이제 포인트가 아니라 **누적 코인 기준**이다. 승급은 자동이 아니라
  **사용자가 `키우기` 버튼을 눌러야** 진행되고, 그때 코인을 차감한다.

### 춤 조건 변경
```diff
- const grown = stageIndex >= 5;
+ const grown = stageIndex >= 4;
```
청소년 리트리버(5단계)부터 춤/여러 동작이 나온다.

### 저장 데이터 마이그레이션
기존 사용자의 `stageIndex` 가 6, 7이면 배열 범위를 벗어난다. 로드 시 클램프할 것.

```ts
character.stageIndex = Math.min(character.stageIndex ?? 0, STAGES.length - 1);
```

---

## 2. 장난감: 보유 상태 제거

장난감을 사면 "보유"로 바뀌고 버튼이 검게 칠해지던 동작을 없앤다.
이제 **누를 때마다 코인을 쓰고, 강아지가 한 번 신나게 반응하고 끝**이다.

```diff
- if (coins < cost || toys.includes(toyId)) return;
- setCharacter({ ...c, coins: c.coins - cost, toys: [...c.toys, toyId] });
+ if (coins < cost) return;
+ setCharacter({ ...c, coins: c.coins - cost });
+ dance();
```

버튼 렌더링도 항상 흰 배경 / 검은 글씨 / `코인 N` 라벨 고정이다.
코인이 모자랄 때만 `opacity: 0.35` + `disabled`. 이름표(공, 로프 토이 등)는 넣지 않는다.
`character.toys` 필드는 더 이상 쓰지 않는다.

---

## 3. 변신(레벨업) 연출

`키우기` 버튼을 누르면 전체 화면 모달이 뜨고 두 단계로 진행된다.

### 단계 1 — 회전 (1450ms)
- 이전 단계 강아지 이미지 130×130, `dogSpin` 애니메이션 무한 반복
- 모달 박스 전체가 `wobble` 로 들썩거림
- 라벨(작은 글씨): `변신 중`
- 제목: `{이름}이 뱅글뱅글` — 이름에 받침이 없으면 `{이름}가 뱅글뱅글`
- 부제: `어지러울 것 같지만 괜찮대요.`
- 버튼(비활성): `도는 중…`

### 단계 2 — 등장
- 다음 단계 강아지 이미지 170×170, `upBurst`
- 뒤에서 **폭죽 연출**이 한 번 재생됨
- 라벨: `변신 완료`
- 제목: `{이름}이 {단계명}가 됐어요`
- 부제: 다음 단계가 남아 있으면 `더 자라려면 단어를 더 모아주세요.`
  마지막 단계면 `마지막 단계까지 함께 왔어요.`
- 버튼: `보러 가기` (누르면 모달 닫힘)

### 키프레임
```css
@keyframes dogSpin  {0%{transform:rotate(0) scale(1)}50%{transform:rotate(720deg) scale(.62)}100%{transform:rotate(1440deg) scale(1)}}
@keyframes wobble   {0%,100%{transform:translateY(0) rotate(-3deg)}50%{transform:translateY(-8px) rotate(3deg)}}
@keyframes upBurst  {0%{transform:scale(.4) rotate(-180deg);opacity:0}45%{transform:scale(1.35) rotate(20deg);opacity:1}70%{transform:scale(.92) rotate(-8deg)}85%{transform:scale(1.08) rotate(4deg)}100%{transform:scale(1) rotate(0);opacity:1}}

@keyframes ringPop  {0%{transform:scale(.35);opacity:0}25%{opacity:.9}100%{transform:scale(1.55);opacity:0}}
@keyframes ringPop2 {0%{transform:scale(.5) rotate(0);opacity:0}30%{opacity:.5}100%{transform:scale(1.95) rotate(26deg);opacity:0}}
@keyframes sparkOut {0%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(-14px) scale(.4);opacity:0}22%{opacity:1}100%{transform:translate(-50%,-50%) rotate(var(--a)) translateY(-78px) scale(1);opacity:0}}
@keyframes dustFloat{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}30%{opacity:.85}100%{opacity:0;transform:translate(-50%,-50%) translateY(-44px) scale(1)}}
```

애니메이션 이름을 그대로 쓰지 않아도 되지만 타이밍/이징은 유지할 것.

### 폭죽 연출 마크업
강아지 이미지를 감싼 `position:relative; width:190px; height:190px` 컨테이너 안에,
등장 단계에서만 렌더한다.

- **원 3개**: 중심 굵게(2px) / 중심 얇게(1px, 지연 .14s) / 점선(1px dashed, `ringPop2`, 지연 .06s)
- **방사형 선 12개**: 30도 간격, 길이 18/10 교차, 지연 .06 / .095 / .13 / .165 순환, `sparkOut` .72s
- **위로 떠오르는 점 3개**: `dustFloat`, 각각 1.1s/.18s, 1.2s/.32s, 1s/.45s

React Native 로 옮길 경우: 원 3개는 `Animated.View` + `scale`/`opacity`,
방사형 선 12개는 각각 `rotate` 고정 + `translateY` 애니메이션,
점 3개는 `translateY` + `opacity` 로 구현하면 동일하다.
색은 전부 `#111111`, 배경 흰색, 다른 색 금지.

---

## 4. 조사(은/는, 이/가) 처리

강아지 이름은 사용자가 정하므로 받침 유무로 조사를 골라야 한다.

```ts
function subjectParticle(name: string) {
  const last = name.charCodeAt(name.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasBatchim ? '이' : '가';
}
```

---

## 5. 한글 줄바꿈

강아지 이름이 들어가는 제목이 어절 중간에서 쪼개지지 않게 처리할 것.

```css
word-break: keep-all;
text-wrap: balance;
```

React Native 에서도 해당 옵션(어절 단위 줄바꿈).

---

## 6. 설정 화면 — "단짝이 키우기 안내서"

⚠ `HANDOFF-addendum-care-guide.md` 를 이 섹션이 대체한다. 제목·항목 수·본문이 모두 바뀌었다.

### 위치
설정 화면(`src/app/settings.tsx`), 기존 3개 블록(동기화 상태 / 매일 복습 알림 / 동기화 방식) **다음**.

### 구조
접이식(아코디언) 헤더 버튼:
- `flexDirection: row, justifyContent: space-between, alignItems: center`
- 제목 `단짝이 키우기 안내서` (16)
- 우측에 펼침 글리프 `▼`(닫힘) / `▲`(열림), 18, `textSecondary`
- 기본은 닫힌 상태

펼쳐지면 아이템 5개, 각각 `flexDirection: row, gap: 14, alignItems: flex-start`:
- 좌측 아이콘 56×56 (`resizeMode: contain`)
- 우측: 제목(14, 700) + 설명(13, `textSecondary`)
- 아이템 간 `gap: 20`

### 콘텐츠 (그대로 사용)

| 아이콘 | 제목 | 설명 |
|---|---|---|
| `dog-stage-5.png` | 단어 하나에 코인 하나 | 암기·복습·단어 매치에서 단어를 하나 볼 때마다 코인이 1개 쌓입니다. 하루 상한은 없습니다. |
| `dog-stage-3.png` | 키우기는 직접 누릅니다 | 코인이 모이면 캐릭터 카드의 키우기 버튼이 켜집니다. 눌러야 다음 단계로 자라고, 그때 코인을 씁니다. |
| `dog-stage-8.png` | 다 키우기까지 단어 600개 | 새끼 강아지부터 든든한 리트리버까지 여섯 단계입니다. 단계별 비용은 20 / 40 / 90 / 150 / 300코인입니다. |
| `dog-stage-7.png` | 청소년부터는 춤도 춰요 | 5단계 청소년 리트리버부터는 쓰다듬거나 장난감을 줄 때 여러 동작을 보여줍니다. 4단계를 넘기면 새 식구를 데려오기도 합니다. |
| `dog-stage-1.png` | 이름도 지어주세요 | 캐릭터 카드에서 이름을 누르면 바꿀 수 있습니다. 변신 창에도 그 이름이 그대로 나옵니다. |

기존 `포인트로 자라요`, `코인으로 돌봐요` 두 항목은 삭제한다(밥·물이 없어졌으므로).

---

## 7. 캐릭터 카드 문구 (그대로 사용)

| 자리 | 문구 |
|---|---|
| 재화 라벨 | `코인 N` 한 줄만 (포인트 라벨 삭제) |
| 키우기 버튼 | `{다음 단계명}로 키우기` / 최고 단계면 `최고 단계에 도달했어요` |
| 버튼 아래 비용 | `코인 N` |
| 진행 안내 | `단어 하나에 코인 1개 · 다음 단계까지 코인 N개` / 최고 단계면 `함께 오래 지냈네요.` |
| 강아지 수 | `함께 자란 강아지 N마리` |
| 이름 미설정 | `이름을 정해주세요` |

---

## 체크리스트

- [x] `points` / `hunger` / `thirst` / `lastActiveDate` 필드 및 관련 UI·로직 전부 제거
- [x] 단어 하나당 코인 1개 즉시 지급으로 교체 (하루 1회 지급 로직 삭제)
- [x] 캐릭터 카드에서 밥·물 게이지 행 삭제
- [x] `STAGES` 6단계로 교체, `img` 인덱스로 이미지 매핑
- [x] 저장된 `stageIndex` 클램프 마이그레이션
- [x] `grown` 조건 `>= 4` 로 변경
- [x] 설정 안내서 §6 으로 전면 교체 (제목 `단짝이 키우기 안내서`, 항목 5개)
- [x] 장난감 보유 상태 제거, 구매 시 춤 트리거
- [x] 변신 모달 2단계 연출 + 폭죽 마크업
- [x] 조사 처리 유틸 적용
- [x] 제목 어절 단위 줄바꿈

# 추가 핸드오프 — 설정 화면 "강아지 키우기 안내"

기존 `handoff/HANDOFF.md`에 이어지는 작은 추가 사항. §4.6 설정 화면에 접이식 섹션 하나를 더 넣는다.

> 이 문서는 2026-08-05 세션에서 원본이 **인코딩이 깨진 상태(UTF-8 을 Latin-1 로 읽은 mojibake)** 로
> 전달되어, 복원한 내용을 사용자 확인을 거쳐 UTF-8 로 다시 적어둔 것이다.

## 위치

설정 화면(`src/app/settings.tsx`), 기존 3개 블록(동기화 상태 / 매일 복습 알림 / 동기화 방식) **다음**에 배치.
"동기화 방식" 블록 아래에 구분선(`borderBottomWidth: 1, borderColor: line, paddingBottom: 24, marginBottom: 24`)을 추가해 구획을 나눈다.

## 구조

접이식(아코디언) 헤더 버튼:
- `flexDirection: row, justifyContent: space-between, alignItems: center`
- 제목 `강아지 키우기 안내` (Space Grotesk 700, 16)
- 우측에 펼침 상태 글리프 `▼`(닫힘) / `▲`(열림), 18, `textSecondary`
- 탭하면 아래 목록이 펼쳐지고 접힌다 (기본은 닫힌 상태)

펼쳐지면 아이템 4개, 각각 `flexDirection: row, gap: 14, alignItems: flex-start`:
- 좌측 아이콘 56×56 (`resizeMode: contain`, 성장 단계 이미지 재사용)
- 우측: 제목(14, 700) + 설명(13, `textSecondary`)

아이템 간 `gap: 20`.

## 콘텐츠 (그대로 사용)

| 아이콘 | 제목 | 설명 |
|---|---|---|
| `dog-stage-4.png` | 포인트로 자라요 | 매일 암기·복습·단어 매치 중 하나만 완료해도 그날 +10P, +5C를 받아요. 하루에 한 번만 지급되고, 포인트가 쌓이면 8단계에 걸쳐 새끼 강아지에서 든든한 리트리버까지 자라요. |
| `toy-bone.png` | 코인으로 돌봐요 | 코인으로 밥·물을 주거나(각 1코인) 장난감을 살 수 있어요. 며칠 쉬면 밥·물 게이지가 서서히 줄어드니 자주 들여다봐 주세요. |
| `dog-stage-6.png` | 청년이 되면 춤도 춰요 | 6단계(청년 리트리버)부터는 쓰다듬거나 돌봐줄 때 여러 동작을 보여줘요. 4단계 이상 성장하면 강아지가 새 친구를 데려오기도 해요. |
| `dog-stage-1.png` | 이름도 지어주세요 | 캐릭터 카드에서 이름을 눌러 나만의 강아지 이름을 지어줄 수 있어요. |

## 구현하면서 스펙과 다르게 간 것

1. **제목 폰트**: 문서는 `강아지 키우기 안내`에 Space Grotesk 를 지정하지만, 한글이라 글리프가 없다.
   기존 규칙대로 Pretendard(`sectionHeading`)를 쓴다. PROGRESS 7-1장·8장의 폰트 방침과 같은 이유다.
2. **에셋 경로**: 문서의 `handoff/assets/` 대신 전처리된 `assets/illustrations/` 를 쓴다.

## 참고

아이콘·문구는 확정된 값을 그대로 쓰면 되고, 새로 디자인할 필요는 없다.

이 문서의 "4단계 이상 성장하면 강아지가 새 친구를 데려오기도 해요" 는
`character-store.ts` 의 `newStage >= 3`(0-based 인덱스 3 = 4단계) 구현과 일치한다.
HANDOFF §5.2 의 의사코드 `newStage >= 4` 가 0-based 인지 1-based 인지 애매했는데,
이 문장으로 **1-based 4단계(= 인덱스 3)** 가 맞다는 것이 확인됐다.

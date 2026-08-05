/**
 * 선(線) 기반 흑백 미니멀 디자인 토큰.
 *
 * 규칙:
 * - 모든 borderRadius 는 0. 예외는 동기화 상태 점(6x6) 하나뿐이다.
 * - 그림자(shadow*, elevation)는 쓰지 않는다. 위계는 선 굵기와 여백으로만 만든다.
 * - 유채색은 즐겨찾기 별(favorite) 하나만 쓴다.
 */

import '@/global.css';

import { Platform } from 'react-native';

// 팔레트. 이 앱은 라이트 고정이라 스킴별 분기가 없다.
const palette = {
  /** 기본 텍스트, 주요 테두리, 채워진 버튼 배경 */
  ink: '#111111',
  /** 부정/삭제 계열 버튼 배경 (미암기, 삭제) */
  inkMuted: '#3D3D3D',
  /** 보조 텍스트, 라벨, 비활성 아이콘 */
  textSecondary: '#6B6B6B',
  /** 가려진 뜻, 안내문, placeholder */
  textTertiary: '#A3A3A3',
  /** 약한 구분선, 보조 테두리 */
  line: '#E2E2E2',
  /** 아주 얕은 면 (칩 비활성 배경 등) */
  surface: '#F4F4F4',
  /** 화면 배경 */
  background: '#FFFFFF',
  /** 검은 배경 위 텍스트 */
  onInk: '#FFFFFF',
  /** 선택된 오답 항목 배경 */
  selected: '#E7E7E7',
  /** 즐겨찾기 별(활성) — 앱 내 유일한 유채색 */
  favorite: '#F5B301',
} as const;

/**
 * 기존 컴포넌트가 쓰던 키 이름을 팔레트에 연결해둔 것.
 * 새 코드는 위 팔레트 이름(ink, line, surface ...)을 쓴다.
 */
const scheme = {
  ...palette,
  text: palette.ink,
  primary: palette.ink,
  primaryText: palette.onInk,
  danger: palette.inkMuted,
  success: palette.ink,
  border: palette.line,
  card: palette.background,
  backgroundElement: palette.surface,
  backgroundSelected: palette.selected,
  placeholder: palette.textTertiary,
} as const;

// 라이트 고정: 시스템이 다크여도 같은 팔레트를 쓴다.
// 일러스트 5개가 어두운 라인아트라 다크 배경에서는 보이지 않기 때문.
export const Colors = {
  light: scheme,
  dark: scheme,
} as const;

export type ThemeColor = keyof typeof scheme;

/**
 * 폰트 패밀리.
 * Space Grotesk / JetBrains Mono 에는 한글 글리프가 없으므로
 * 한글이 들어갈 수 있는 자리에는 반드시 Pretendard 를 쓴다.
 */
export const FontFamily = {
  /** 라틴 전용 — 단어(term), 문제 텍스트 */
  display: 'SpaceGrotesk_600SemiBold',
  displayBold: 'SpaceGrotesk_700Bold',
  /** 라틴/숫자 전용 — 수치, 라벨, 버튼, 칩, 날짜 */
  mono: 'JetBrainsMono_500Medium',
  monoSemi: 'JetBrainsMono_600SemiBold',
  monoBold: 'JetBrainsMono_700Bold',
  /** 한글 포함 가능한 모든 자리 */
  korean: 'Pretendard-Regular',
  koreanBold: 'Pretendard-Bold',
  /** 노트 화면 손글씨 — 한글 글리프 있음 */
  hand: 'NanumPenScript_400Regular',
  /** 로고 "단어짝꿍", 스플래시 — 한글 글리프 있음 */
  logo: 'NotoSansKR_900Black',
} as const;

/**
 * 타이포 스케일. 스펙 1.3 표를 그대로 옮긴 것.
 * `-Ko` 접미사는 한글이 섞일 수 있어 Pretendard 로 대체한 자리다.
 */
export const Type = {
  /** 앱 타이틀 "보카덱" */
  appTitle: { fontFamily: FontFamily.koreanBold, fontSize: 28, letterSpacing: -0.3 },
  /** 화면 타이틀 */
  screenTitle: { fontFamily: FontFamily.koreanBold, fontSize: 19 },
  /** 섹션 헤딩 */
  sectionHeading: { fontFamily: FontFamily.koreanBold, fontSize: 16 },
  /** 단어장 이름 등 목록 제목 */
  rowTitle: { fontFamily: FontFamily.koreanBold, fontSize: 17 },
  /** 플래시카드의 단어(term) — 라틴 */
  term: { fontFamily: FontFamily.display, fontSize: 34 },
  /** 리콜 문제 텍스트 — 한글일 수 있어 Pretendard */
  question: { fontFamily: FontFamily.koreanBold, fontSize: 22 },
  /** 복습 개수 같은 큰 숫자 */
  bigNumber: { fontFamily: FontFamily.monoBold, fontSize: 44 },
  /** 통계 수치 */
  statValue: { fontFamily: FontFamily.monoBold, fontSize: 20 },
  /** 라틴 라벨 — 대문자 변환과 함께 쓴다 */
  labelLatin: {
    fontFamily: FontFamily.monoSemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase' as const,
  },
  /** 한글 라벨 — 대문자 변환 없이 자간만 */
  labelKo: { fontFamily: FontFamily.koreanBold, fontSize: 12, letterSpacing: 1 },
  /** 숫자/라틴 수치 라벨 (진행률, 날짜, 카운트) */
  meta: { fontFamily: FontFamily.mono, fontSize: 11 },
  metaSemi: { fontFamily: FontFamily.monoSemi, fontSize: 12 },
  /** 버튼 텍스트 — 한글이므로 Pretendard */
  button: { fontFamily: FontFamily.koreanBold, fontSize: 14, letterSpacing: 0.5 },
  /** 본문 */
  body: { fontFamily: FontFamily.korean, fontSize: 14 },
  bodyBold: { fontFamily: FontFamily.koreanBold, fontSize: 14 },
  /** 보조 안내문 */
  caption: { fontFamily: FontFamily.korean, fontSize: 13 },
  /** 노트 행 번호 */
  noteNumber: { fontFamily: FontFamily.hand, fontSize: 19 },
  /** 노트 단어 칸 (rotate -0.6deg 는 사용처에서 준다) */
  noteTerm: { fontFamily: FontFamily.hand, fontSize: 26 },
  /** 노트 뜻 칸 (rotate 0.5deg 는 사용처에서 준다) */
  noteMeaning: { fontFamily: FontFamily.hand, fontSize: 23 },
  /** 로고 큰 글자 (단·짝) — letterSpacing 은 -0.02em 환산 */
  logoLarge: { fontFamily: FontFamily.logo, fontSize: 40, letterSpacing: -0.8 },
  /** 로고 작은 글자 (어·꿍) */
  logoSmall: { fontFamily: FontFamily.logo, fontSize: 21, letterSpacing: -0.42 },
} as const;

/** 화면 공통 여백 (스펙 1.4) */
export const Layout = {
  screenPaddingH: 20,
  screenPaddingTop: 32,
  /** 스크롤 여유 */
  screenPaddingBottom: 120,
  /** 섹션 구분 */
  sectionGap: 24,
} as const;

/** 테두리 굵기 */
export const Border = {
  /** 강조 컨테이너 / 헤더 구분선 */
  strong: 2,
  /** 보조 컨테이너 / 리스트 행 구분 */
  hair: 1,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;

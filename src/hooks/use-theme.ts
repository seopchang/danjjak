import { Colors } from '@/constants/theme';

/**
 * 이 앱은 라이트 고정이다.
 * 선 기반 흑백 디자인이고 일러스트 5개가 어두운 라인아트라,
 * 시스템이 다크 모드여도 같은 팔레트를 쓴다.
 */
export function useTheme() {
  return Colors.light;
}

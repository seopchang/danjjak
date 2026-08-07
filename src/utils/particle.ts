/**
 * 한글 조사 고르기.
 *
 * 강아지 이름은 사용자가 정하므로 받침 유무를 그때그때 따져야 한다.
 * 한글 음절은 U+AC00 부터 28개 종성이 한 묶음이라, 28로 나눈 나머지가 0이면 받침이 없다.
 * (handoff/HANDOFF-character-update.md §4)
 */
export function subjectParticle(word: string): '이' | '가' {
  const last = word.charCodeAt(word.length - 1);
  const hasBatchim = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0;
  return hasBatchim ? '이' : '가';
}

/** `{이름}이` / `{이름}가` */
export function withSubject(word: string): string {
  return `${word}${subjectParticle(word)}`;
}

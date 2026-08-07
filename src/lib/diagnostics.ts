import { getFirebaseConfigSnapshot } from '@/lib/firebase';

/**
 * 로그인 진단.
 *
 * 증상: 웹에서는 로그인이 되는데 APK(안드로이드)에서만
 * `auth/network-request-failed`가 난다.
 *
 * Firebase Auth는 fetch가 던진 예외를 종류에 상관없이 전부
 * `auth/network-request-failed` 하나로 뭉뚱그린다. 그래서 그 코드만 봐서는
 * 인터넷 문제인지, SSL/시계 문제인지, API 키 제한인지 구분되지 않는다.
 * 여기서 단계를 쪼개 어디까지 되는지 확인한다.
 *
 * 릴리스 APK는 콘솔을 볼 수 없어 결과를 화면에 그대로 띄운다.
 */

export interface DiagnosticLine {
  label: string;
  detail: string;
  ok: boolean | null;
}

const TIMEOUT_MS = 10000;

/** 응답이 없어도 화면이 영영 "실행 중"으로 남지 않게 시간을 끊는다. */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function describeThrown(e: unknown): string {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
}

/**
 * 값에 눈에 안 보이는 공백/줄바꿈이 섞였는지 (CI 시크릿 오염 탐지).
 *
 * 앞뒤 공백은 firebase.ts 가 자동으로 다듬어 쓰므로 더 이상 로그인을 막지 않는다.
 * 그래도 시크릿이 더러워졌다는 사실은 보여줘야 고칠 수 있어 안내로 남긴다.
 */
function whitespaceNote(value: string): { note: string; ok: boolean | null } {
  if (value.length === 0) return { note: ' ← 비어 있음', ok: false };
  if (value !== value.trim()) return { note: ' ← 앞뒤 공백/줄바꿈 (자동 제거됨)', ok: null };
  if (/\s/.test(value)) return { note: ' ← 중간에 공백 있음', ok: false };
  return { note: '', ok: true };
}

function maskApiKey(value: string): string {
  if (!value) return '(비어 있음)';
  if (value.length <= 12) return `${value} (len ${value.length})`;
  return `${value.slice(0, 6)}…${value.slice(-4)} (len ${value.length})`;
}

/** ① 설정값이 APK에 제대로 들어왔는지 */
function configLines(): DiagnosticLine[] {
  const config = getFirebaseConfigSnapshot();
  return Object.entries(config).map(([key, value]) => {
    const { note, ok } = whitespaceNote(value);
    return {
      label: key,
      detail: (key === 'apiKey' ? maskApiKey(value) : value.trim() || '(비어 있음)') + note,
      ok,
    };
  });
}

/** ② 인터넷과 TLS 자체가 되는지 (폰 시계가 틀어지면 여기서 실패한다) */
async function checkInternet(): Promise<DiagnosticLine> {
  const started = Date.now();
  try {
    const res = await fetchWithTimeout('https://www.gstatic.com/generate_204');
    const ms = Date.now() - started;
    return {
      label: '인터넷 · TLS',
      detail: `HTTP ${res.status} (${ms}ms)`,
      ok: res.status === 204 || res.ok,
    };
  } catch (e) {
    return {
      label: '인터넷 · TLS',
      detail: `${describeThrown(e)} (${Date.now() - started}ms)`,
      ok: false,
    };
  }
}

/**
 * ③ Firebase Auth 백엔드에 실제로 닿는지 + API 키가 이 환경에서 허용되는지.
 *
 * 로그인과 같은 호스트(identitytoolkit)에 같은 키로 요청한다.
 * 400/403이 와도 "닿았다"는 뜻이라 오히려 성과다 — 구글이 돌려준 사유 문자열이
 * (API_KEY_INVALID, 요청 차단 등) 원인을 그대로 알려준다.
 */
async function checkAuthEndpoint(): Promise<DiagnosticLine> {
  const { apiKey } = getFirebaseConfigSnapshot();
  if (!apiKey) {
    return { label: 'Firebase Auth 서버', detail: 'apiKey가 없어 건너뜀', ok: false };
  }

  const started = Date.now();
  try {
    const res = await fetchWithTimeout(
      `https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=${encodeURIComponent(apiKey)}`
    );
    const ms = Date.now() - started;
    let body = '';
    try {
      body = (await res.text()).replace(/\s+/g, ' ').slice(0, 300);
    } catch {
      body = '(본문 읽기 실패)';
    }
    return {
      label: 'Firebase Auth 서버',
      detail: `HTTP ${res.status} (${ms}ms) ${body}`,
      ok: res.ok,
    };
  } catch (e) {
    return {
      label: 'Firebase Auth 서버',
      detail: `${describeThrown(e)} (${Date.now() - started}ms)`,
      ok: false,
    };
  }
}

/** ④ 폰 시계가 실제 시각과 얼마나 어긋났는지 (SSL 검증 실패의 가장 흔한 원인) */
async function checkClockSkew(): Promise<DiagnosticLine> {
  try {
    const res = await fetchWithTimeout('https://www.gstatic.com/generate_204');
    const serverDate = res.headers.get('date');
    if (!serverDate) {
      return { label: '폰 시계', detail: '서버 시각을 읽지 못함', ok: null };
    }
    const skewSec = Math.round((Date.now() - new Date(serverDate).getTime()) / 1000);
    return {
      label: '폰 시계',
      detail: `서버와 ${skewSec >= 0 ? '+' : ''}${skewSec}초 차이 (폰: ${new Date().toISOString()})`,
      // 5분 이상 어긋나면 TLS 인증서 검증이 깨진다.
      ok: Math.abs(skewSec) < 300,
    };
  } catch (e) {
    return { label: '폰 시계', detail: describeThrown(e), ok: null };
  }
}

export async function runLoginDiagnostics(): Promise<DiagnosticLine[]> {
  const network = await Promise.all([checkInternet(), checkClockSkew(), checkAuthEndpoint()]);
  return [...configLines(), ...network];
}

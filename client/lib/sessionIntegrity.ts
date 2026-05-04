/**
 * sessionIntegrity.ts
 *
 * Detecta reutilização indevida de sessão, mudança de dispositivo/contexto
 * e restauração automática de tokens antigos.
 *
 * Estratégia:
 * 1. No login, gera um fingerprint do contexto do browser e guarda-o
 *    associado ao userId no localStorage.
 * 2. Em cada verificação de sessão, compara o fingerprint atual com o
 *    armazenado. Se divergir, a sessão é invalidada.
 * 3. Verifica também se o userId da sessão atual corresponde ao userId
 *    do fingerprint guardado — previne fuga entre contas no mesmo dispositivo.
 */

const FINGERPRINT_KEY = "ss_fp";
const SESSION_META_KEY = "ss_meta";

interface SessionMeta {
  userId: string;
  fingerprint: string;
  createdAt: number;   // timestamp absoluto de criação da sessão
  lastActive: number;  // timestamp da última atividade
}

/**
 * Gera um fingerprint leve e estável do contexto do browser.
 * Não é perfeito (user-agent pode ser forjado), mas adiciona uma
 * barreira significativa contra reutilização de token noutro dispositivo.
 */
async function generateFingerprint(): Promise<string> {
  const components = [
    navigator.userAgent,
    navigator.language,
    String(screen.colorDepth),
    String(screen.width) + "x" + String(screen.height),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ].join("|");

  // SHA-256 via Web Crypto API (disponível em todos os browsers modernos)
  const encoder = new TextEncoder();
  const data = encoder.encode(components);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Deve ser chamado imediatamente após login bem-sucedido.
 * Regista o fingerprint e os metadados da sessão.
 */
export async function registerSession(userId: string): Promise<void> {
  const fingerprint = await generateFingerprint();
  const meta: SessionMeta = {
    userId,
    fingerprint,
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
  try {
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    localStorage.setItem(FINGERPRINT_KEY, fingerprint);
  } catch {
    // localStorage pode estar indisponível em modo privado em alguns browsers
  }
}

/**
 * Verifica a integridade da sessão atual.
 *
 * @returns "valid" — sessão íntegra
 * @returns "fingerprint_mismatch" — contexto mudou (possível hijack)
 * @returns "user_mismatch" — userId diferente (fuga entre contas)
 * @returns "no_meta" — sem metadados (sessão antiga, não registada)
 */
export async function verifySessionIntegrity(
  currentUserId: string
): Promise<"valid" | "fingerprint_mismatch" | "user_mismatch" | "no_meta"> {
  try {
    const raw = localStorage.getItem(SESSION_META_KEY);
    if (!raw) return "no_meta";

    const meta: SessionMeta = JSON.parse(raw);

    // Verifica se o userId da sessão corresponde ao userId dos metadados
    if (meta.userId !== currentUserId) return "user_mismatch";

    // Verifica o fingerprint atual contra o guardado
    const currentFingerprint = await generateFingerprint();
    if (meta.fingerprint !== currentFingerprint) return "fingerprint_mismatch";

    // Atualiza o timestamp de última atividade
    meta.lastActive = Date.now();
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));

    return "valid";
  } catch {
    return "no_meta";
  }
}

/**
 * Limpa todos os metadados de sessão.
 * Deve ser chamado no logout.
 */
export function clearSessionMeta(): void {
  try {
    localStorage.removeItem(SESSION_META_KEY);
    localStorage.removeItem(FINGERPRINT_KEY);
  } catch {
    // silencioso
  }
}

/**
 * Retorna os metadados da sessão atual, ou null se não existirem.
 */
export function getSessionMeta(): SessionMeta | null {
  try {
    const raw = localStorage.getItem(SESSION_META_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionMeta;
  } catch {
    return null;
  }
}

/**
 * Retorna o timestamp de criação da sessão, ou null.
 * Usado para timeout absoluto.
 */
export function getSessionCreatedAt(): number | null {
  return getSessionMeta()?.createdAt ?? null;
}

/**
 * Retorna o timestamp da última atividade, ou null.
 * Usado para timeout por inatividade.
 */
export function getLastActiveAt(): number | null {
  return getSessionMeta()?.lastActive ?? null;
}

/**
 * Atualiza o timestamp de última atividade.
 * Deve ser chamado em eventos de interação do utilizador.
 */
export function touchLastActive(): void {
  try {
    const raw = localStorage.getItem(SESSION_META_KEY);
    if (!raw) return;
    const meta: SessionMeta = JSON.parse(raw);
    meta.lastActive = Date.now();
    localStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
  } catch {
    // silencioso
  }
}

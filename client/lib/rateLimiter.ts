/**
 * rateLimiter.ts — Rate limiting no frontend (sliding window)
 *
 * Previne brute force, credential stuffing e abuso de endpoints críticos.
 *
 * Estratégia: sliding window com contador em localStorage.
 * Se o localStorage não estiver disponível, usa um Map em memória.
 *
 * IMPORTANTE: Rate limiting no frontend é uma barreira de UX, não de segurança.
 * A proteção real deve existir no backend (Supabase Auth tem rate limiting nativo,
 * Edge Functions devem ter o seu próprio middleware).
 *
 * Limites configurados por ação:
 *   login          — 5 tentativas em 15 minutos
 *   signup         — 3 tentativas em 30 minutos
 *   reset_password — 3 tentativas em 60 minutos
 *   checkout       — 3 tentativas em 10 minutos
 *   otp            — 5 tentativas em 10 minutos
 */

interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number; // duração da janela em milissegundos
}

const LIMITS: Record<string, RateLimitConfig> = {
  login:          { maxAttempts: 5,  windowMs: 15 * 60 * 1000 },
  signup:         { maxAttempts: 3,  windowMs: 30 * 60 * 1000 },
  reset_password: { maxAttempts: 3,  windowMs: 60 * 60 * 1000 },
  checkout:       { maxAttempts: 3,  windowMs: 10 * 60 * 1000 },
  otp:            { maxAttempts: 5,  windowMs: 10 * 60 * 1000 },
};

interface WindowEntry {
  attempts: number[];  // timestamps das tentativas dentro da janela
}

// Fallback em memória quando localStorage não está disponível
const memoryStore = new Map<string, WindowEntry>();

function storageKey(action: string): string {
  return `rl_${action}`;
}

function getEntry(action: string): WindowEntry {
  try {
    const raw = localStorage.getItem(storageKey(action));
    if (raw) return JSON.parse(raw) as WindowEntry;
  } catch { /* usa memória */ }

  return memoryStore.get(action) ?? { attempts: [] };
}

function saveEntry(action: string, entry: WindowEntry): void {
  try {
    localStorage.setItem(storageKey(action), JSON.stringify(entry));
  } catch {
    memoryStore.set(action, entry);
  }
}

/**
 * Resultado de uma verificação de rate limit.
 */
export interface RateLimitResult {
  /** true = dentro do limite, pode prosseguir */
  allowed: boolean;
  /** Quantas tentativas restam nesta janela */
  remaining: number;
  /** Timestamp (ms) em que a janela reset — só presente quando blocked */
  resetAt: number | null;
  /** Mensagem human-readable para o utilizador */
  message: string | null;
}

/**
 * Verifica e regista uma tentativa para uma ação.
 *
 * @param action — chave da ação (ex: "login", "signup")
 * @returns RateLimitResult
 */
export function checkRateLimit(action: string): RateLimitResult {
  const config = LIMITS[action];
  if (!config) {
    // Ação desconhecida — permite por padrão (fail-open para não bloquear features)
    return { allowed: true, remaining: 999, resetAt: null, message: null };
  }

  const now = Date.now();
  const entry = getEntry(action);

  // Remove tentativas fora da janela deslizante
  entry.attempts = entry.attempts.filter(ts => now - ts < config.windowMs);

  if (entry.attempts.length >= config.maxAttempts) {
    // Bloqueado — calcula quando a janela vai reset
    const oldestAttempt = Math.min(...entry.attempts);
    const resetAt = oldestAttempt + config.windowMs;
    const secsLeft = Math.ceil((resetAt - now) / 1000);
    const minsLeft = Math.ceil(secsLeft / 60);

    saveEntry(action, entry);

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      message: secsLeft < 120
        ? `Demasiadas tentativas. Tente novamente em ${secsLeft} segundos.`
        : `Demasiadas tentativas. Tente novamente em ${minsLeft} minutos.`,
    };
  }

  // Regista esta tentativa
  entry.attempts.push(now);
  saveEntry(action, entry);

  return {
    allowed: true,
    remaining: config.maxAttempts - entry.attempts.length,
    resetAt: null,
    message: null,
  };
}

/**
 * Reseta o contador de uma ação (ex: após login bem-sucedido).
 */
export function resetRateLimit(action: string): void {
  try {
    localStorage.removeItem(storageKey(action));
  } catch {
    memoryStore.delete(action);
  }
}

/**
 * Retorna quantas tentativas restam sem registar uma nova tentativa.
 */
export function getRemainingAttempts(action: string): number {
  const config = LIMITS[action];
  if (!config) return 999;

  const now = Date.now();
  const entry = getEntry(action);
  const validAttempts = entry.attempts.filter(ts => now - ts < config.windowMs);
  return Math.max(0, config.maxAttempts - validAttempts.length);
}

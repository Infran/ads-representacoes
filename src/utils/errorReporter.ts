/**
 * errorReporter — leva erros de runtime até o registro de auditoria.
 *
 * Em produção o app é mudo: `logger` roda em nível `silent` e o `esbuild.drop`
 * remove `console` do bundle. Sem isto, "deu erro na hora de cadastrar" é tudo
 * que existe para investigar. O destino aqui é o Firestore, não o console.
 *
 * Três fontes: ErrorBoundary (render), handlers globais (`window.onerror` e
 * `unhandledrejection`) e o gancho no `notifyError` (erros já tratados).
 *
 * PROTEÇÕES OBRIGATÓRIAS — um coletor de erros sem elas vira um gerador de
 * custo. Um loop de render dispara centenas de erros por segundo, e o Firestore
 * é cobrado por escrita:
 *  - dedup por assinatura, 1 escrita a cada 10 min por assinatura;
 *  - teto de 25 escritas por sessão;
 *  - intervalo mínimo de 2s entre escritas;
 *  - estado em `sessionStorage`, porque o fallback oferece "Recarregar" e o
 *    ciclo crash → reload → crash burlaria qualquer guarda em memória;
 *  - trava de reentrância, para um erro dentro do coletor não se auto-alimentar.
 *
 * Sem amostragem: nesse volume, amostrar esconderia justamente o bug raro que
 * se está caçando.
 */
import { logAudit } from "../services/auditService";
import { logger } from "./logger";
import { getErrorMessage, registerErrorReporter } from "../ui/Feedback";

const DEDUP_WINDOW_MS = 10 * 60 * 1000;
const SESSION_CAP = 25;
const MIN_INTERVAL_MS = 2000;
const STORAGE_KEY = "ads_error_reporter";

/** Marca que já recarregamos por chunk obsoleto — impede loop de reload. */
const STALE_RELOAD_KEY = "ads_stale_chunk_reload";
/** Relato adiado do chunk obsoleto, gravado só depois do reload (ver abaixo). */
const STALE_PENDING_KEY = "ads_stale_chunk_pending";

export interface CapturedError {
  source: "render" | "window" | "promise" | "notify";
  error: unknown;
  /** Título do toast, quando veio de `notifyError`. */
  title?: string;
  componentStack?: string;
}

export interface ReporterHealth {
  written: number;
  suppressed: number;
  capped: boolean;
}

interface ReporterState {
  /** assinatura → { último envio, ocorrências acumuladas desde então } */
  fingerprints: Record<string, { last: number; pending: number }>;
  written: number;
  suppressed: number;
  lastWriteAt: number;
}

const emptyState = (): ReporterState => ({
  fingerprints: {},
  written: 0,
  suppressed: 0,
  lastWriteAt: 0,
});

// ============================================================================
// ESTADO (sessionStorage — sobrevive ao reload do fallback de erro)
// ============================================================================

const loadState = (): ReporterState => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...(JSON.parse(raw) as ReporterState) };
  } catch {
    return emptyState();
  }
};

const saveState = (state: ReporterState): void => {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Cota estourada ou storage indisponível: seguir em memória é aceitável.
  }
};

// ============================================================================
// ASSINATURA
// ============================================================================

/** djb2 — barato e suficiente para agrupar erros iguais. */
const hash = (input: string): string => {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
};

const firstLine = (message: string): string => message.split("\n")[0].slice(0, 200);

const currentRoute = (): string => {
  try {
    return window.location.pathname;
  } catch {
    return "";
  }
};

// ============================================================================
// CAPTURA
// ============================================================================

/** Trava de reentrância: um erro DENTRO do coletor não pode realimentá-lo. */
let reporting = false;

export const captureError = (captured: CapturedError): void => {
  if (reporting) return;
  reporting = true;

  try {
    const { source, error, title, componentStack } = captured;
    const e = error as {
      code?: string;
      cause?: { code?: string };
      message?: string;
      stack?: string;
    };

    const errorCode = e?.code ?? e?.cause?.code;
    // Mesma mensagem que o usuário viu na tela (tradutor pt-BR compartilhado).
    const errorMessage = getErrorMessage(error);
    const route = currentRoute();
    const fingerprint = hash(
      `${errorCode ?? ""}|${firstLine(e?.message ?? errorMessage)}|${route}`
    );

    const now = Date.now();
    const state = loadState();
    const seen = state.fingerprints[fingerprint] ?? { last: 0, pending: 0 };

    // Dedup: erro repetido dentro da janela só incrementa o contador.
    if (seen.last && now - seen.last < DEDUP_WINDOW_MS) {
      seen.pending += 1;
      state.fingerprints[fingerprint] = seen;
      state.suppressed += 1;
      saveState(state);
      return;
    }

    if (state.written >= SESSION_CAP) {
      state.suppressed += 1;
      saveState(state);
      return;
    }

    if (state.lastWriteAt && now - state.lastWriteAt < MIN_INTERVAL_MS) {
      state.suppressed += 1;
      saveState(state);
      return;
    }

    logAudit({
      action: "error",
      entity: "app",
      entityId: "",
      label: title ?? `Erro em ${route || "rota desconhecida"}`,
      status: "failure",
      errorCode,
      errorMessage,
      errorStack: e?.stack,
      componentStack,
      route,
      fingerprint,
      // +1 pela ocorrência atual, além das que foram suprimidas na janela.
      occurrences: seen.pending + 1,
    });

    state.fingerprints[fingerprint] = { last: now, pending: 0 };
    state.written += 1;
    state.lastWriteAt = now;
    saveState(state);

    logger.error(`[errorReporter] ${source}:`, error);
  } catch (failure) {
    // O coletor NUNCA propaga. E fala só pelo logger: chamar `notifyError`
    // aqui reentraria por cima do gancho que ele mesmo registrou.
    logger.error("[errorReporter] falha ao registrar erro:", failure);
  } finally {
    reporting = false;
  }
};

export const getReporterHealth = (): ReporterHealth => {
  const state = loadState();
  return {
    written: state.written,
    suppressed: state.suppressed,
    capped: state.written >= SESSION_CAP,
  };
};

// ============================================================================
// INSTALAÇÃO
// ============================================================================

let installed = false;

/**
 * Registra os handlers globais e liga o gancho do `notifyError`. Idempotente —
 * o StrictMode monta o Root duas vezes em dev.
 */
/**
 * Chunk obsoleto depois de um deploy.
 *
 * O `index.html` que a aba carregou aponta para `assets/Home-<hash>.js`. Um
 * deploy novo troca os hashes e apaga os arquivos antigos, então o import
 * dinâmico do `React.lazy` toma 404 e a tela quebra — para qualquer usuário
 * que estivesse com a aba aberta. Recarregar busca o `index.html` novo e
 * resolve, que é exatamente o que o usuário faz na mão hoje.
 *
 * O relato é ADIADO de propósito: gravar no Firestore é assíncrono e o reload
 * cancelaria a escrita no meio. Guardamos a intenção em sessionStorage e
 * registramos no carregamento seguinte, quando a página já está estável.
 */
const installStaleChunkRecovery = (): void => {
  // Vite dispara este evento quando um preload/import dinâmico falha.
  window.addEventListener("vite:preloadError", (event) => {
    const message =
      (event as unknown as { payload?: { message?: string } }).payload
        ?.message ?? "Falha ao carregar módulo da aplicação";

    // Só uma vez por sessão: se recarregar não resolveu, o problema é outro
    // (rede, arquivo realmente ausente) e um loop de reload esconderia isso.
    if (sessionStorage.getItem(STALE_RELOAD_KEY)) return;

    try {
      sessionStorage.setItem(STALE_RELOAD_KEY, "1");
      sessionStorage.setItem(STALE_PENDING_KEY, message);
    } catch {
      // Sem storage não dá para garantir o anti-loop — melhor não recarregar.
      return;
    }

    event.preventDefault();
    window.location.reload();
  });
};

/** Registra o chunk obsoleto da carga anterior, agora que a página está de pé. */
const reportPendingStaleChunk = (): void => {
  try {
    const pending = sessionStorage.getItem(STALE_PENDING_KEY);
    if (!pending) return;

    sessionStorage.removeItem(STALE_PENDING_KEY);
    captureError({
      source: "window",
      error: new Error(pending),
      title: "Versão desatualizada recarregada após deploy",
    });
  } catch {
    // Nada a fazer.
  }
};

export const installGlobalErrorHandlers = (): void => {
  if (installed) return;
  installed = true;

  installStaleChunkRecovery();
  reportPendingStaleChunk();

  // Erros assíncronos, que um ErrorBoundary estruturalmente não enxerga.
  window.addEventListener("error", (event) => {
    captureError({ source: "window", error: event.error ?? event.message });
  });

  window.addEventListener("unhandledrejection", (event) => {
    captureError({ source: "promise", error: event.reason });
  });

  // Erros já tratados: cobre os 12 pontos de escrita da UI sem tocar em nenhum.
  registerErrorReporter((title, error) => {
    captureError({ source: "notify", error, title });
  });
};

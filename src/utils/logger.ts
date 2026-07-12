/**
 * Logger por ambiente (EST F4.5 · resolve SEG-11 e PERF-12).
 *
 * Ponto único de log do app, substituindo os `console.*` espalhados. O nível é
 * controlado por ambiente:
 *   - desenvolvimento/teste: loga tudo (debug/info/warn/error);
 *   - produção: silencioso por padrão — sem ruído nem vazamento de dados
 *     (nomes de coleção, IDs, mensagens de erro do Firebase, etc.).
 *
 * O nível pode ser sobrescrito por `VITE_LOG_LEVEL`
 * ('debug' | 'info' | 'warn' | 'error' | 'silent') — útil para depurar um build
 * de produção pontualmente sem editar código.
 *
 * Complementa — não substitui — o `esbuild.drop: ['console']` do build de
 * produção (vite.config.ts): o drop remove fisicamente qualquer `console.*`
 * remanescente do bundle (defesa em profundidade); este logger garante o
 * comportamento correto também em dev/test e centraliza a decisão de logar.
 *
 * Importante: cada método chama `console.*` no momento da invocação (sem guardar
 * referência ao console), para que spies de teste (`vi.spyOn(console, ...)`) e o
 * `esbuild.drop` continuem funcionando.
 */

type LogLevel = "debug" | "info" | "warn" | "error" | "silent";

const RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 100,
};

const resolveLevel = (): LogLevel => {
  const override = import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined;
  if (override && override in RANK) return override;
  return import.meta.env.PROD ? "silent" : "debug";
};

const activeLevel = resolveLevel();

const enabled = (level: Exclude<LogLevel, "silent">): boolean =>
  RANK[level] >= RANK[activeLevel];

export const logger = {
  debug: (...args: unknown[]): void => {
    if (enabled("debug")) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (enabled("info")) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (enabled("warn")) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (enabled("error")) console.error(...args);
  },
};

export default logger;

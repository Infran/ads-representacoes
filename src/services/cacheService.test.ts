import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { Timestamp } from "firebase/firestore";
import {
  getCache,
  setCache,
  isExpired,
  invalidateCache,
  invalidateAllCache,
  addItemToCache,
  updateItemInCache,
  removeItemFromCache,
  filterCacheLocally,
} from "./cacheService";

// Characterization tests do cacheService (EST F1.2).
// Descrevem o comportamento ATUAL que as refatorações (EST F2) devem preservar:
// TTL de 5 min, espelho em localStorage e as operações add/update/remove.

type Row = { id: string; name: string };
const rows: Row[] = [
  { id: "1", name: "Alpha" },
  { id: "2", name: "Beta" },
];

beforeEach(() => {
  // Silencia os logs verbosos do cache para não poluir a saída dos testes.
  // O cache agora loga via `logger` (EST F4.5): debug p/ HIT/MISS/SET, error
  // p/ falhas — daí silenciar `console.debug`/`console.error`.
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  invalidateAllCache();
  localStorage.clear();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("cacheService — leitura/escrita básica", () => {
  it("retorna null quando não há nada em cache (MISS)", () => {
    expect(getCache<Row[]>("clients")).toBeNull();
  });

  it("grava e lê a mesma coleção da memória", () => {
    setCache("clients", rows);
    expect(getCache<Row[]>("clients")).toEqual(rows);
  });

  it("espelha a escrita no localStorage em uma chave por coleção (P1.3)", () => {
    setCache("products", rows);
    // Chave própria da coleção — não mais um blob único com as 4.
    const raw = localStorage.getItem("ads_representacoes_cache:products");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw as string);
    expect(parsed.data).toEqual(rows);
    expect(typeof parsed.expiresAt).toBe("number");
    // Mutar 'products' NÃO serializa as outras coleções.
    expect(localStorage.getItem("ads_representacoes_cache:clients")).toBeNull();
  });
});

describe("cacheService — TTL de 5 minutos", () => {
  it("considera o item válido antes de 5 min e expirado depois", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T00:00:00Z"));

    setCache("budgets", rows);
    expect(isExpired("budgets")).toBe(false);
    expect(getCache<Row[]>("budgets")).toEqual(rows);

    // 5 min - 1s: ainda válido
    vi.advanceTimersByTime(5 * 60 * 1000 - 1000);
    expect(isExpired("budgets")).toBe(false);

    // ultrapassa a janela de 5 min: expira
    vi.advanceTimersByTime(2000);
    expect(isExpired("budgets")).toBe(true);
    expect(getCache<Row[]>("budgets")).toBeNull();
  });

  it("respeita um TTL customizado passado ao setCache", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-11T00:00:00Z"));

    setCache("representatives", rows, 1000); // 1s
    expect(isExpired("representatives")).toBe(false);

    vi.advanceTimersByTime(1500);
    expect(isExpired("representatives")).toBe(true);
  });
});

describe("cacheService — mutações add/update/remove", () => {
  it("adiciona um item à coleção cacheada", () => {
    setCache("clients", rows);
    addItemToCache<Row>("clients", { id: "3", name: "Gamma" });
    expect(getCache<Row[]>("clients")).toHaveLength(3);
    expect(getCache<Row[]>("clients")?.[2]).toEqual({ id: "3", name: "Gamma" });
  });

  it("não adiciona quando a coleção não está cacheada (evita cache parcial)", () => {
    addItemToCache<Row>("clients", { id: "9", name: "Orphan" });
    expect(getCache<Row[]>("clients")).toBeNull();
  });

  it("atualiza um item existente pelo id, preservando os demais", () => {
    setCache("clients", rows);
    updateItemInCache<Row>("clients", { id: "1", name: "Alpha editado" });
    const result = getCache<Row[]>("clients");
    expect(result?.find((r) => r.id === "1")?.name).toBe("Alpha editado");
    expect(result?.find((r) => r.id === "2")?.name).toBe("Beta");
  });

  it("remove um item pelo id", () => {
    setCache("clients", rows);
    removeItemFromCache<Row>("clients", "1");
    const result = getCache<Row[]>("clients");
    expect(result).toHaveLength(1);
    expect(result?.[0].id).toBe("2");
  });

  it("filtra localmente sem alterar o cache", () => {
    setCache("clients", rows);
    const found = filterCacheLocally<Row>("clients", (r) => r.name === "Beta");
    expect(found).toEqual([{ id: "2", name: "Beta" }]);
    expect(getCache<Row[]>("clients")).toHaveLength(2);
  });
});

describe("cacheService — invalidação", () => {
  it("invalida uma coleção específica sem afetar as outras", () => {
    setCache("clients", rows);
    setCache("products", rows);
    invalidateCache("clients");
    expect(getCache<Row[]>("clients")).toBeNull();
    expect(getCache<Row[]>("products")).toEqual(rows);
  });

  it("invalida todo o cache (memória + localStorage)", () => {
    setCache("clients", rows);
    setCache("products", rows);
    invalidateAllCache();
    expect(getCache<Row[]>("clients")).toBeNull();
    expect(getCache<Row[]>("products")).toBeNull();
    expect(localStorage.getItem("ads_representacoes_cache:clients")).toBeNull();
    expect(localStorage.getItem("ads_representacoes_cache:products")).toBeNull();
  });
});

describe("cacheService — Timestamps sobrevivem ao localStorage", () => {
  // Regressão: `JSON.stringify` achata um Timestamp em `{seconds, nanoseconds}`.
  // Sem reidratar na leitura, o objeto volta sem `.toDate()` e o primeiro
  // consumidor que chamar esse método (o PDF do orçamento) estoura em runtime.
  //
  // Só reproduz na leitura vinda do STORAGE — quando os dados acabaram de ser
  // buscados do Firestore e ainda estão em memória, o objeto é o original. Daí
  // semear o localStorage direto: é exatamente o estado após um reload.
  const semearStorage = (key: string, data: unknown) =>
    localStorage.setItem(
      `ads_representacoes_cache:${key}`,
      JSON.stringify({
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + 5 * 60 * 1000,
      })
    );

  it("devolve um Timestamp de verdade ao ler do storage", () => {
    const createdAt = Timestamp.fromDate(new Date("2026-07-20T12:00:00Z"));
    semearStorage("budgets", [{ id: "1", createdAt }]);

    const lido = getCache<{ id: string; createdAt: Timestamp }[]>("budgets");
    const lidoCreatedAt = lido?.[0].createdAt;

    expect(lidoCreatedAt).toBeInstanceOf(Timestamp);
    expect(typeof lidoCreatedAt?.toDate).toBe("function");
    expect(lidoCreatedAt?.toDate().toISOString()).toBe(
      "2026-07-20T12:00:00.000Z"
    );
  });

  it("reidrata Timestamps aninhados (snapshots embutidos)", () => {
    const createdAt = Timestamp.fromDate(new Date("2026-01-02T03:04:05Z"));
    semearStorage("budgets", [{ id: "1", client: { id: "9", createdAt } }]);

    const lido =
      getCache<{ id: string; client: { createdAt: Timestamp } }[]>("budgets");

    expect(lido?.[0].client.createdAt).toBeInstanceOf(Timestamp);
  });

  it("não confunde um objeto comum de duas chaves numéricas com Timestamp", () => {
    semearStorage("products", [{ id: "1", medidas: { largura: 10, altura: 20 } }]);

    const lido =
      getCache<{ id: string; medidas: Record<string, number> }[]>("products");

    expect(lido?.[0].medidas).toEqual({ largura: 10, altura: 20 });
    expect(lido?.[0].medidas).not.toBeInstanceOf(Timestamp);
  });
});

describe("cacheService — QuotaExceededError (P1.3)", () => {
  it("não lança e mantém o cache em memória quando a quota estoura", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const quotaErr = new DOMException("cheio", "QuotaExceededError");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw quotaErr;
    });

    // setCache persiste no localStorage; a quota estoura mas não deve propagar.
    expect(() => setCache("budgets", rows)).not.toThrow();
    // O cache em memória segue válido mesmo sem persistência.
    expect(getCache<Row[]>("budgets")).toEqual(rows);
    expect(warn).toHaveBeenCalled();
  });
});

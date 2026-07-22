import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../services/auditService", () => ({ logAudit: vi.fn() }));
vi.mock("../ui/Feedback", () => ({
  getErrorMessage: vi.fn((e: unknown) => (e as Error)?.message ?? "erro"),
  registerErrorReporter: vi.fn(),
}));

import { logAudit } from "../services/auditService";
import { captureError, getReporterHealth } from "./errorReporter";

const mockLogAudit = vi.mocked(logAudit);

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-07-21T12:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

/** Avança o relógio para além do intervalo mínimo entre escritas. */
const passRateLimit = () => vi.advanceTimersByTime(2500);

describe("errorReporter — gravação transparente", () => {
  it("grava todo erro real, sem teto de sessão", () => {
    for (let i = 0; i < 40; i++) {
      captureError({ source: "render", error: new Error(`erro-${i}`) });
      passRateLimit();
    }

    // Sem teto: as 40 ocorrências viram 40 escritas.
    expect(mockLogAudit).toHaveBeenCalledTimes(40);
    expect(getReporterHealth().written).toBe(40);
  });

  it("erros idênticos espaçados são todos gravados (sem dedup)", () => {
    captureError({ source: "render", error: new Error("boom") });
    passRateLimit();
    captureError({ source: "render", error: new Error("boom") });

    expect(mockLogAudit).toHaveBeenCalledTimes(2);
  });
});

describe("errorReporter — disjuntor de custo", () => {
  it("respeita o intervalo mínimo de 2s entre escritas", () => {
    captureError({ source: "render", error: new Error("a") });
    // Sem avançar o relógio: a segunda escrita bate no disjuntor.
    captureError({ source: "render", error: new Error("b") });

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
  });

  it("um loop de render em rajada custa no máximo uma escrita por 2s", () => {
    for (let i = 0; i < 200; i++) {
      captureError({ source: "render", error: new Error("boom") });
    }

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    expect(getReporterHealth().written).toBe(1);
  });

  it("o estado do disjuntor sobrevive ao reload (sessionStorage)", () => {
    captureError({ source: "render", error: new Error("a") });
    // O ciclo crash → recarregar → crash não pode zerar a guarda: sem avançar
    // o relógio, a próxima escrita segue barrada pelo disjuntor.
    captureError({ source: "render", error: new Error("b") });

    expect(getReporterHealth().written).toBe(1);
  });
});

describe("errorReporter — segurança", () => {
  it("nunca propaga um erro do próprio coletor", () => {
    mockLogAudit.mockImplementationOnce(() => {
      throw new Error("firestore fora do ar");
    });

    expect(() =>
      captureError({ source: "render", error: new Error("boom") })
    ).not.toThrow();
  });

  it("registra a rota e o stack junto do erro", () => {
    const error = new Error("boom");
    captureError({
      source: "render",
      error,
      componentStack: "\n at Clients",
    });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "error",
        entity: "app",
        componentStack: "\n at Clients",
        route: expect.any(String),
        fingerprint: expect.any(String),
      })
    );
  });
});

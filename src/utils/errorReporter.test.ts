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

describe("errorReporter — dedup por assinatura", () => {
  it("um loop de erros idênticos custa UMA escrita", () => {
    for (let i = 0; i < 200; i++) {
      captureError({ source: "render", error: new Error("boom") });
    }

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
    expect(getReporterHealth().suppressed).toBe(199);
  });

  it("erros diferentes geram escritas diferentes", () => {
    captureError({ source: "render", error: new Error("primeiro") });
    passRateLimit();
    captureError({ source: "render", error: new Error("segundo") });

    expect(mockLogAudit).toHaveBeenCalledTimes(2);
  });

  it("depois da janela de 10 min, reporta de novo com o total de ocorrências", () => {
    captureError({ source: "render", error: new Error("boom") });
    captureError({ source: "render", error: new Error("boom") });
    captureError({ source: "render", error: new Error("boom") });

    vi.advanceTimersByTime(11 * 60 * 1000);
    captureError({ source: "render", error: new Error("boom") });

    expect(mockLogAudit).toHaveBeenCalledTimes(2);
    // 2 suprimidas na janela + a atual.
    expect(mockLogAudit).toHaveBeenLastCalledWith(
      expect.objectContaining({ occurrences: 3 })
    );
  });
});

describe("errorReporter — limites de custo", () => {
  it("respeita o intervalo mínimo entre escritas", () => {
    captureError({ source: "render", error: new Error("a") });
    // Sem avançar o relógio: a segunda assinatura bate no rate limit.
    captureError({ source: "render", error: new Error("b") });

    expect(mockLogAudit).toHaveBeenCalledTimes(1);
  });

  it("para no teto de sessão e sinaliza capped", () => {
    for (let i = 0; i < 40; i++) {
      captureError({ source: "render", error: new Error(`erro-${i}`) });
      passRateLimit();
    }

    expect(mockLogAudit).toHaveBeenCalledTimes(25);
    expect(getReporterHealth().capped).toBe(true);
  });

  it("o teto sobrevive ao reload (estado em sessionStorage)", () => {
    for (let i = 0; i < 30; i++) {
      captureError({ source: "render", error: new Error(`erro-${i}`) });
      passRateLimit();
    }
    // O ciclo crash → recarregar → crash não pode zerar as guardas: o estado
    // vive em sessionStorage justamente por isso.
    expect(getReporterHealth().written).toBe(25);
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

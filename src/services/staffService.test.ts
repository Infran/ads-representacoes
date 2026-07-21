import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetDoc = vi.fn();
vi.mock("../firebase", () => ({ db: {}, auth: {} }));
vi.mock("firebase/firestore", () => ({
  doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}` })),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
}));

import {
  resolveRole,
  getCachedRole,
  setCachedRole,
  clearCachedRole,
} from "./staffService";

const snapshot = (data: Record<string, unknown> | null) => ({
  exists: () => data !== null,
  id: "u1",
  data: () => data,
});

beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe("staffService — cache de papel", () => {
  it("lê do Firestore uma vez e serve o resto da sessão do cache", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ role: "admin" }));

    expect(await resolveRole("u1")).toBe("admin");
    expect(await resolveRole("u1")).toBe("admin");
    expect(await resolveRole("u1")).toBe("admin");

    // O ganho principal: o boot de uma aba recarregada não paga round trip,
    // e o login não consulta duas vezes (login + onAuthStateChanged).
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it("NÃO serve o papel em cache para outro uid", async () => {
    setCachedRole("u1", "admin");
    mockGetDoc.mockResolvedValue(snapshot({ role: "staff" }));

    expect(getCachedRole("u2")).toBeNull();
    // Trocar de conta na mesma aba precisa reconsultar, senão o segundo
    // usuário herdaria o painel de administração do primeiro.
    expect(await resolveRole("u2")).toBe("staff");
    expect(mockGetDoc).toHaveBeenCalledTimes(1);
  });

  it("o logout limpa o cache", () => {
    setCachedRole("u1", "admin");
    clearCachedRole();
    expect(getCachedRole("u1")).toBeNull();
  });

  it("degrada para staff quando não há doc de allowlist", async () => {
    mockGetDoc.mockResolvedValue(snapshot(null));
    expect(await resolveRole("u1")).toBe("staff");
  });

  it("degrada para staff quando a leitura falha, sem lançar", async () => {
    mockGetDoc.mockRejectedValue(new Error("permission-denied"));
    // Fail-open para o app, fail-closed para admin: um atraso no deploy das
    // regras não pode travar quem só quer trabalhar.
    expect(await resolveRole("u1")).toBe("staff");
  });

  it("qualquer valor diferente de admin vira staff", async () => {
    mockGetDoc.mockResolvedValue(snapshot({ role: "superadmin" }));
    expect(await resolveRole("u1")).toBe("staff");
  });

  it("ignora cache corrompido em vez de quebrar o boot", async () => {
    sessionStorage.setItem("ads_staff_role", "{ não é json");
    mockGetDoc.mockResolvedValue(snapshot({ role: "admin" }));

    expect(getCachedRole("u1")).toBeNull();
    expect(await resolveRole("u1")).toBe("admin");
  });
});

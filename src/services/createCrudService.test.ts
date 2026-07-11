import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo firebase/firestore ANTES de importar o factory.
vi.mock("../firebase", () => ({ db: {} }));
vi.mock("firebase/firestore", () => ({
  collection: vi.fn((_db, name) => ({ __collection: name })),
  doc: vi.fn((_db, coll, id) => ({ path: `${coll}/${id}` })),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(async () => undefined),
  deleteDoc: vi.fn(async () => undefined),
  Timestamp: { now: () => ({ __ts: true }) },
  runTransaction: vi.fn(),
  query: vi.fn((...args) => ({ __query: args })),
  orderBy: vi.fn((field, dir) => ({ __orderBy: [field, dir] })),
  limit: vi.fn((n) => ({ __limit: n })),
  startAfter: vi.fn((cursor) => ({ __startAfter: cursor })),
  DocumentData: undefined,
}));

import { runTransaction, updateDoc, getDocs } from "firebase/firestore";
import { createCrudService } from "./createCrudService";

type Row = { id: string; name: string; createdAt?: unknown; updatedAt?: unknown };

const svc = createCrudService<Row>({
  collectionName: "test",
  metaIdDoc: "lastTestId",
});

const mockRunTransaction = vi.mocked(runTransaction);
const mockUpdateDoc = vi.mocked(updateDoc);
const mockGetDocs = vi.mocked(getDocs);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCrudService.add — criação atômica (SEG S2.1)", () => {
  it("incrementa o contador E grava o doc na MESMA transação", async () => {
    const tx = {
      get: vi.fn(async () => ({ exists: () => true, data: () => ({ id: 5 }) })),
      set: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRunTransaction.mockImplementation(async (_db: any, cb: any) => cb(tx));

    const created = await svc.add({ name: "Novo" } as Omit<
      Row,
      "id" | "createdAt" | "updatedAt"
    >);

    // Ambas as escritas passaram pelo MESMO objeto de transação (tx.set).
    expect(tx.set).toHaveBeenCalledTimes(2);
    // 1ª: incremento do contador de 5 -> 6 em meta/lastTestId
    expect(tx.set).toHaveBeenNthCalledWith(
      1,
      { path: "meta/lastTestId" },
      { id: 6 }
    );
    // 2ª: o novo doc em test/6
    expect(tx.set).toHaveBeenNthCalledWith(
      2,
      { path: "test/6" },
      expect.objectContaining({ id: "6", name: "Novo" })
    );
    expect(created).toMatchObject({ id: "6", name: "Novo" });
  });

  it("começa o contador em 1 quando meta ainda não existe", async () => {
    const tx = {
      get: vi.fn(async () => ({ exists: () => false, data: () => undefined })),
      set: vi.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRunTransaction.mockImplementation(async (_db: any, cb: any) => cb(tx));

    const created = await svc.add({ name: "Primeiro" } as Omit<
      Row,
      "id" | "createdAt" | "updatedAt"
    >);

    expect(tx.set).toHaveBeenNthCalledWith(
      1,
      { path: "meta/lastTestId" },
      { id: 1 }
    );
    expect(created.id).toBe("1");
  });

  it("propaga a falha do set do doc (transação inteira falha, sem buraco no contador)", async () => {
    const tx = {
      get: vi.fn(async () => ({ exists: () => true, data: () => ({ id: 9 }) })),
      set: vi.fn((ref: { path: string }) => {
        // Simula falha ao gravar o documento (após o incremento do contador).
        if (ref.path === "test/10") throw new Error("set falhou");
      }),
    };
    // runTransaction real reverteria TUDO; aqui o mock apenas propaga o throw
    // do callback, provando que a falha do doc aborta a transação inteira.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockRunTransaction.mockImplementation(async (_db: any, cb: any) => cb(tx));

    await expect(
      svc.add({ name: "Falha" } as Omit<Row, "id" | "createdAt" | "updatedAt">)
    ).rejects.toThrow("set falhou");
  });
});

describe("createCrudService — validação e update", () => {
  it("chama validate antes de add e propaga o erro (não abre transação)", async () => {
    const validated = createCrudService<Row>({
      collectionName: "test",
      metaIdDoc: "lastTestId",
      validate: (data) => {
        if (!data.name) throw new Error("nome obrigatório");
      },
    });

    await expect(
      validated.add({} as Omit<Row, "id" | "createdAt" | "updatedAt">)
    ).rejects.toThrow("nome obrigatório");
    expect(mockRunTransaction).not.toHaveBeenCalled();
  });

  it("update grava updatedAt e limpa campos undefined", async () => {
    await svc.update("7", { name: "Editado", createdAt: undefined });

    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    const [ref, payload] = mockUpdateDoc.mock.calls[0];
    expect(ref).toEqual({ path: "test/7" });
    expect(payload).toEqual({ name: "Editado", updatedAt: { __ts: true } });
    expect(payload).not.toHaveProperty("createdAt");
  });
});

describe("createCrudService.getPage — paginação por cursor (P1.2)", () => {
  it("mapeia items, expõe lastDoc e hasMore=true quando a página vem cheia", async () => {
    const docs = [
      { id: "3", data: () => ({ name: "C" }) },
      { id: "2", data: () => ({ name: "B" }) },
    ];
    mockGetDocs.mockResolvedValue({ docs } as never);

    const page = await svc.getPage(2);

    expect(page.items).toEqual([
      { id: "3", name: "C" },
      { id: "2", name: "B" },
    ]);
    expect(page.lastDoc).toBe(docs[1]);
    expect(page.hasMore).toBe(true); // veio cheia (2 de 2)
  });

  it("hasMore=false quando a página vem incompleta", async () => {
    const docs = [{ id: "1", data: () => ({ name: "A" }) }];
    mockGetDocs.mockResolvedValue({ docs } as never);

    const page = await svc.getPage(5);

    expect(page.items).toHaveLength(1);
    expect(page.hasMore).toBe(false); // 1 de 5
  });
});

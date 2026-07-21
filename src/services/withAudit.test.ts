import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks ANTES de importar o decorator.
vi.mock("./auditService", () => ({
  logAudit: vi.fn(),
  getAuditActor: vi.fn(() => ({ uid: "u1", email: "u1@ads.com" })),
  diffFields: vi.fn((before, after) =>
    Object.keys(after).filter(
      (k) => JSON.stringify(before?.[k]) !== JSON.stringify(after[k])
    )
  ),
  pickFields: vi.fn((source, keys: string[]) => {
    const out: Record<string, unknown> = {};
    if (!source) return out;
    for (const k of keys) if (k in source) out[k] = source[k];
    return out;
  }),
  capDiffPayload: vi.fn((before, after) => ({ before, after })),
}));
vi.mock("./binService", () => ({ moveToBin: vi.fn(async () => "bin-abc") }));

import { logAudit } from "./auditService";
import { moveToBin } from "./binService";
import { withAudit } from "./withAudit";
import { CrudService } from "./createCrudService";

type Row = { id: string; name: string };

const mockLogAudit = vi.mocked(logAudit);
const mockMoveToBin = vi.mocked(moveToBin);

/** CrudService falso, com cada método espionável. */
const makeCrud = (overrides: Partial<CrudService<Row>> = {}) =>
  ({
    getAll: vi.fn(async () => []),
    getById: vi.fn(async () => ({ id: "1", name: "Antigo" })),
    getNextId: vi.fn(async () => 2),
    getPage: vi.fn(async () => ({ items: [], hasMore: false })),
    add: vi.fn(async (data) => ({ id: "1", ...data })),
    update: vi.fn(async () => undefined),
    remove: vi.fn(async () => undefined),
    ...overrides,
  }) as unknown as CrudService<Row>;

const wrap = (crud: CrudService<Row>) =>
  withAudit(crud, { entity: "clients", label: (r) => r?.name ?? "sem nome" });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("withAudit — passagem direta das leituras", () => {
  it("não envolve getAll/getById/getNextId/getPage", () => {
    const crud = makeCrud();
    const wrapped = wrap(crud);

    expect(wrapped.getAll).toBe(crud.getAll);
    expect(wrapped.getById).toBe(crud.getById);
    expect(wrapped.getNextId).toBe(crud.getNextId);
    expect(wrapped.getPage).toBe(crud.getPage);
  });
});

describe("withAudit — o negócio nunca depende da auditoria", () => {
  // Regressão: com o log de sucesso DENTRO do try, um logAudit que lançasse
  // fazia a criação bem-sucedida cair no catch — gravando uma entrada de
  // falha mentirosa e propagando o erro para a UI. O usuário via "erro ao
  // cadastrar" num registro que tinha sido criado. É exatamente o sintoma
  // que esta feature existe para diagnosticar.
  it("a criação resolve mesmo se a gravação do log explodir", async () => {
    mockLogAudit.mockImplementationOnce(() => {
      throw new Error("firestore fora do ar");
    });

    const created = await wrap(makeCrud()).add({ name: "Novo" } as never);
    expect(created).toMatchObject({ id: "1", name: "Novo" });
  });

  it("a edição resolve mesmo se a gravação do log explodir", async () => {
    mockLogAudit.mockImplementationOnce(() => {
      throw new Error("firestore fora do ar");
    });

    await expect(
      wrap(makeCrud()).update("1", { name: "Novo" })
    ).resolves.toBeUndefined();
  });

  it("a exclusão resolve mesmo se a gravação do log explodir", async () => {
    mockLogAudit.mockImplementationOnce(() => {
      throw new Error("firestore fora do ar");
    });

    await expect(wrap(makeCrud()).remove("1")).resolves.toBeUndefined();
    expect(mockMoveToBin).toHaveBeenCalled();
  });
});

describe("withAudit — exclusão vai para a lixeira", () => {
  it("move o documento em vez de apagar, e registra o binItemId", async () => {
    const crud = makeCrud();
    await wrap(crud).remove("1");

    expect(mockMoveToBin).toHaveBeenCalledWith(
      "clients",
      "1",
      { id: "1", name: "Antigo" },
      "Antigo",
      { uid: "u1", email: "u1@ads.com" }
    );
    // O `remove` original (deleteDoc puro) NÃO é chamado quando há doc.
    expect(crud.remove).not.toHaveBeenCalled();
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete",
        status: "success",
        binItemId: "bin-abc",
      })
    );
  });

  it("recusa excluir se não conseguir ler o documento (sem rede de segurança)", async () => {
    const crud = makeCrud({
      getById: vi.fn(async () => {
        throw new Error("permission-denied");
      }),
    } as never);

    await expect(wrap(crud).remove("1")).rejects.toThrow("permission-denied");
    expect(mockMoveToBin).not.toHaveBeenCalled();
    expect(crud.remove).not.toHaveBeenCalled();
  });

  it("permanece idempotente quando o documento já não existe", async () => {
    const crud = makeCrud({ getById: vi.fn(async () => null) } as never);
    await wrap(crud).remove("9");

    expect(mockMoveToBin).not.toHaveBeenCalled();
    expect(crud.remove).toHaveBeenCalledWith("9");
  });

  // Regressão da janela de deploy: com o bundle novo publicado e as regras
  // antigas ainda no ar, `bin/**` cai no catch-all deny e a batch inteira é
  // negada. Sem este fallback, o app perde a capacidade de excluir qualquer
  // registro, em todas as entidades, até alguém rodar o deploy de regras.
  it("exclui direto quando as regras negam a lixeira, e marca binUnavailable", async () => {
    const denied = Object.assign(new Error("Missing or insufficient permissions."), {
      code: "permission-denied",
    });
    mockMoveToBin.mockRejectedValueOnce(denied);

    const crud = makeCrud();
    await expect(wrap(crud).remove("1")).resolves.toBeUndefined();

    expect(crud.remove).toHaveBeenCalledWith("1");
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "delete",
        // `failure` mesmo tendo excluído: o que falhou foi a recuperabilidade.
        status: "failure",
        binUnavailable: true,
        errorCode: "permission-denied",
      })
    );
  });

  // O fallback é ESTRITO ao permission-denied. Uma falha de rede derrubaria o
  // deleteDoc igual, então cair para ele não ajudaria — e apagar sem rede de
  // segurança por um erro transitório é exatamente o que a lixeira evita.
  it("aborta (sem excluir) quando a lixeira falha por outro motivo", async () => {
    mockMoveToBin.mockRejectedValueOnce(
      Object.assign(new Error("backend indisponível"), { code: "unavailable" })
    );

    const crud = makeCrud();
    await expect(wrap(crud).remove("1")).rejects.toThrow("backend indisponível");
    expect(crud.remove).not.toHaveBeenCalled();
  });
});

describe("withAudit — edição registra só o que mudou", () => {
  it("guarda changedFields e o par before/after recortado", async () => {
    await wrap(makeCrud()).update("1", { name: "Novo" });

    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        status: "success",
        changedFields: ["name"],
        before: { name: "Antigo" },
        after: { name: "Novo" },
      })
    );
  });

  it("emite entrada de falha com o payload que não gravou, e re-lança", async () => {
    const crud = makeCrud({
      update: vi.fn(async () => {
        throw new Error("permission-denied");
      }),
    } as never);

    await expect(wrap(crud).update("1", { name: "Novo" })).rejects.toThrow(
      "permission-denied"
    );
    expect(mockLogAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update",
        status: "failure",
        after: { name: "Novo" },
        errorMessage: "permission-denied",
      })
    );
  });
});

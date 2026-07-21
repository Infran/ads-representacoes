import { readFileSync } from "fs";
import { resolve } from "path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";

// Testes das firestore.rules no emulador (SEG S3.1).
// Validam o perímetro publicado em dev/prod: deny-by-default, allowlist
// `staff/{uid}`, integridade de `budgets` e proteção da coleção `staff`.
// Rodam via `npm run test:rules` (firebase emulators:exec injeta
// FIRESTORE_EMULATOR_HOST). Espelham o firestore.rules VERSIONADO — as
// coleções clients/products/representatives são staff-only SEM validação de
// campo (desvio deliberado de S0.1); só `budgets` tem asserção de tipo.

const PROJECT_ID = "demo-ads-rules";
const rules = readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8");

let testEnv: RulesTestEnvironment;

// Helpers de contexto.
// `staff1` tem `role: "admin"`; `staff2` é staff comum. `staff()` aponta para o
// COMUM de propósito: assim os testes de CRUD de negócio provam que um usuário
// sem admin continua fazendo tudo que sempre fez (admin herda staff, não o
// contrário), e as asserções de negação de admin não passam por acidente.
const anon = () => testEnv.unauthenticatedContext().firestore();
const nonStaff = () => testEnv.authenticatedContext("intruder").firestore();
const staff = () => testEnv.authenticatedContext("staff2").firestore();
const admin = () => testEnv.authenticatedContext("staff1").firestore();

const validBudget = { totalValue: 500, selectedProducts: [] };

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules },
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();
  // Seed com as regras DESLIGADAS: allowlist + docs existentes para
  // testar read/update/delete.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "staff/staff1"), { role: "admin" });
    await setDoc(doc(db, "staff/staff2"), { role: "staff" });
    await setDoc(doc(db, "clients/c1"), { name: "Cliente Existente" });
    await setDoc(doc(db, "products/p1"), { name: "Produto", unitValue: 1000 });
    await setDoc(doc(db, "representatives/r1"), { name: "Rep" });
    await setDoc(doc(db, "budgets/b1"), validBudget);
    await setDoc(doc(db, "meta/lastBudgetId"), { value: 5 });
    await setDoc(doc(db, "auditLogs/a1"), {
      at: Timestamp.now(),
      actorUid: "staff2",
      action: "create",
      entity: "clients",
    });
    await setDoc(doc(db, "bin/clients/items/bin1"), {
      entity: "clients",
      originalId: "c9",
      deletedAt: Timestamp.now(),
      data: { name: "Excluído" },
    });
  });
});

describe("anônimo (não autenticado) — negado em tudo", () => {
  it("não lê nenhuma coleção de negócio", async () => {
    const db = anon();
    await assertFails(getDoc(doc(db, "clients/c1")));
    await assertFails(getDoc(doc(db, "products/p1")));
    await assertFails(getDoc(doc(db, "representatives/r1")));
    await assertFails(getDoc(doc(db, "budgets/b1")));
    await assertFails(getDoc(doc(db, "meta/lastBudgetId")));
  });

  it("não escreve em nenhuma coleção de negócio", async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, "clients/c2"), { name: "X" }));
    await assertFails(setDoc(doc(db, "products/p2"), { name: "X" }));
    await assertFails(setDoc(doc(db, "representatives/r2"), { name: "X" }));
    await assertFails(setDoc(doc(db, "budgets/b2"), validBudget));
    await assertFails(setDoc(doc(db, "meta/lastBudgetId"), { value: 6 }));
  });
});

describe("autenticado fora da allowlist (sem staff/{uid}) — negado", () => {
  it("não lê nem escreve, mesmo autenticado", async () => {
    const db = nonStaff();
    await assertFails(getDoc(doc(db, "clients/c1")));
    await assertFails(setDoc(doc(db, "clients/c2"), { name: "X" }));
    await assertFails(getDoc(doc(db, "budgets/b1")));
    await assertFails(setDoc(doc(db, "budgets/b2"), validBudget));
    await assertFails(getDoc(doc(db, "meta/lastBudgetId")));
  });
});

describe("staff (na allowlist) — CRUD liberado", () => {
  it("faz CRUD em clients/products/representatives", async () => {
    const db = staff();
    await assertSucceeds(getDoc(doc(db, "clients/c1")));
    await assertSucceeds(setDoc(doc(db, "clients/c2"), { name: "Novo" }));
    await assertSucceeds(deleteDoc(doc(db, "clients/c1")));

    await assertSucceeds(setDoc(doc(db, "products/p2"), { name: "Novo" }));
    await assertSucceeds(setDoc(doc(db, "representatives/r2"), { name: "Novo" }));
  });

  it("lê e incrementa os contadores em meta", async () => {
    const db = staff();
    await assertSucceeds(getDoc(doc(db, "meta/lastBudgetId")));
    await assertSucceeds(setDoc(doc(db, "meta/lastBudgetId"), { value: 6 }));
  });
});

describe("budgets — integridade mínima (staff)", () => {
  it("aceita orçamento válido (totalValue número >= 0, selectedProducts lista)", async () => {
    const db = staff();
    await assertSucceeds(setDoc(doc(db, "budgets/b2"), validBudget));
    await assertSucceeds(getDoc(doc(db, "budgets/b1")));
    await assertSucceeds(deleteDoc(doc(db, "budgets/b1")));
  });

  it("rejeita totalValue string", async () => {
    const db = staff();
    await assertFails(
      setDoc(doc(db, "budgets/b3"), { totalValue: "500", selectedProducts: [] })
    );
  });

  it("rejeita totalValue negativo", async () => {
    const db = staff();
    await assertFails(
      setDoc(doc(db, "budgets/b4"), { totalValue: -1, selectedProducts: [] })
    );
  });

  it("rejeita selectedProducts que não é lista", async () => {
    const db = staff();
    await assertFails(
      setDoc(doc(db, "budgets/b5"), { totalValue: 500, selectedProducts: "x" })
    );
  });
});

describe("auditLogs — append-only, escrita por staff, leitura só por admin", () => {
  // `at` tem que ser o relógio do SERVIDOR: as regras exigem
  // `at == request.time`, para que ninguém possa datar uma entrada como quiser.
  const entry = (actorUid: string) => ({
    at: serverTimestamp(),
    actorUid,
    action: "create",
    entity: "clients",
  });

  it("staff comum grava (é o que instrumenta o CRUD)", async () => {
    await assertSucceeds(
      setDoc(doc(staff(), "auditLogs/novo1"), entry("staff2"))
    );
  });

  it("não dá para forjar o horário de uma entrada", async () => {
    await assertFails(
      setDoc(doc(staff(), "auditLogs/backdated"), {
        ...entry("staff2"),
        at: Timestamp.fromMillis(Date.now() - 90 * 24 * 60 * 60 * 1000),
      })
    );
  });

  it("não dá para forjar a identidade de outro usuário", async () => {
    await assertFails(
      setDoc(doc(staff(), "auditLogs/forjado"), entry("staff1"))
    );
  });

  it("quem está fora da allowlist não grava", async () => {
    await assertFails(
      setDoc(doc(nonStaff(), "auditLogs/x"), entry("intruder"))
    );
    await assertFails(setDoc(doc(anon(), "auditLogs/y"), entry("anon")));
  });

  it("só admin lê o registro", async () => {
    await assertSucceeds(getDoc(doc(admin(), "auditLogs/a1")));
    await assertFails(getDoc(doc(staff(), "auditLogs/a1")));
    await assertFails(getDoc(doc(nonStaff(), "auditLogs/a1")));
  });

  it("é append-only: nem admin edita uma entrada existente", async () => {
    await assertFails(
      setDoc(doc(admin(), "auditLogs/a1"), { ...entry("staff1"), action: "delete" })
    );
  });

  it("só admin expurga", async () => {
    await assertFails(deleteDoc(doc(staff(), "auditLogs/a1")));
    await assertSucceeds(deleteDoc(doc(admin(), "auditLogs/a1")));
  });
});

describe("bin (lixeira) — staff exclui, só admin lê/restaura", () => {
  const binDoc = {
    entity: "clients",
    originalId: "c1",
    deletedAt: Timestamp.now(),
    data: { name: "Cliente Existente" },
  };

  it("staff move para a lixeira ao excluir", async () => {
    await assertSucceeds(
      setDoc(doc(staff(), "bin/clients/items/novo1"), binDoc)
    );
  });

  it("quem está fora da allowlist não escreve na lixeira", async () => {
    await assertFails(setDoc(doc(nonStaff(), "bin/clients/items/x"), binDoc));
    await assertFails(setDoc(doc(anon(), "bin/clients/items/y"), binDoc));
  });

  it("a entidade do path é restrita à lista conhecida", async () => {
    await assertFails(
      setDoc(doc(staff(), "bin/qualquerCoisa/items/x"), {
        ...binDoc,
        entity: "qualquerCoisa",
      })
    );
  });

  it("o envelope tem que declarar a mesma entidade do path", async () => {
    await assertFails(
      setDoc(doc(staff(), "bin/clients/items/x"), {
        ...binDoc,
        entity: "budgets",
      })
    );
  });

  it("só admin lê a lixeira — staff comum não vê o que foi excluído", async () => {
    await assertSucceeds(getDoc(doc(admin(), "bin/clients/items/bin1")));
    await assertFails(getDoc(doc(staff(), "bin/clients/items/bin1")));
    await assertFails(getDocs(collection(staff(), "bin/clients/items")));
  });

  it("entrada da lixeira é imutável", async () => {
    await assertFails(
      setDoc(doc(admin(), "bin/clients/items/bin1"), {
        ...binDoc,
        originalId: "outro",
      })
    );
  });

  it("só admin remove da lixeira (restaurar/descartar)", async () => {
    await assertFails(deleteDoc(doc(staff(), "bin/clients/items/bin1")));
    await assertSucceeds(deleteDoc(doc(admin(), "bin/clients/items/bin1")));
  });
});

describe("coleção staff e desconhecidas — deny-by-default", () => {
  it("nem o staff consegue escrever na coleção staff (só via Console/Admin)", async () => {
    const db = staff();
    await assertFails(setDoc(doc(db, "staff/hacker"), { role: "admin" }));
  });

  it("cada um lê o PRÓPRIO doc de staff (necessário para descobrir o papel)", async () => {
    await assertSucceeds(getDoc(doc(staff(), "staff/staff2")));
    await assertSucceeds(getDoc(doc(admin(), "staff/staff1")));
  });

  it("ninguém lê o doc de staff de outro uid", async () => {
    await assertFails(getDoc(doc(staff(), "staff/staff1")));
    await assertFails(getDoc(doc(admin(), "staff/staff2")));
    await assertFails(getDoc(doc(nonStaff(), "staff/staff1")));
    await assertFails(getDoc(doc(anon(), "staff/staff1")));
  });

  it("a allowlist não pode ser enumerada, nem por admin", async () => {
    await assertFails(getDocs(collection(staff(), "staff")));
    await assertFails(getDocs(collection(admin(), "staff")));
  });

  it("coleção não mapeada cai no deny-by-default", async () => {
    const db = staff();
    await assertFails(getDoc(doc(db, "secrets/x")));
    await assertFails(setDoc(doc(db, "secrets/x"), { a: 1 }));
  });
});

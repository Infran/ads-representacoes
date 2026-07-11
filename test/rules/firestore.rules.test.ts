import { readFileSync } from "fs";
import { resolve } from "path";
import { beforeAll, afterAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";

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

// Helpers de contexto
const anon = () => testEnv.unauthenticatedContext().firestore();
const nonStaff = () => testEnv.authenticatedContext("intruder").firestore();
const staff = () => testEnv.authenticatedContext("staff1").firestore();

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
    await setDoc(doc(db, "clients/c1"), { name: "Cliente Existente" });
    await setDoc(doc(db, "products/p1"), { name: "Produto", unitValue: 1000 });
    await setDoc(doc(db, "representatives/r1"), { name: "Rep" });
    await setDoc(doc(db, "budgets/b1"), validBudget);
    await setDoc(doc(db, "meta/lastBudgetId"), { value: 5 });
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

describe("coleção staff e desconhecidas — deny-by-default", () => {
  it("nem o staff consegue escrever na coleção staff (só via Console/Admin)", async () => {
    const db = staff();
    await assertFails(setDoc(doc(db, "staff/hacker"), { role: "admin" }));
  });

  it("leitura direta de staff/{uid} é negada (allowlist só via exists() server-side)", async () => {
    const db = staff();
    await assertFails(getDoc(doc(db, "staff/staff1")));
  });

  it("coleção não mapeada cai no deny-by-default", async () => {
    const db = staff();
    await assertFails(getDoc(doc(db, "secrets/x")));
    await assertFails(setDoc(doc(db, "secrets/x"), { a: 1 }));
  });
});

# REPORTE_SEGURANCA.md — FASE 2: Segurança e Integridade de Dados

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase Auth/Firestore)
**Data da análise:** 2026-07-09
**Escopo:** fluxos de autenticação, autorização, camada de acesso a dados (`services/*`), entrada de dados (URL, formulários), configuração de deploy.
**Modelo de ameaça:** SPA client-only servida em Firebase Hosting. **Todo o código roda no navegador do usuário** — nenhuma lógica é confiável no cliente. A única fronteira de segurança real é o **Firestore Security Rules** + configuração do Firebase Auth (console).
**Plano consolidado em:** 2026-07-09 (revisado após verificação do código-fonte)

> **Status deste documento:** deixou de ser apenas um diagnóstico com backlog solto.
> As seções **§1–§3** permanecem como base de evidência e especificação técnica (antes/depois).
> O antigo "§4 Backlog" foi substituído por um **§4 Plano de Implementação Consolidado**
> (fases S0–S3, dono único por item, critérios de aceite e dependências com as demais trilhas).
> A execução detalhada (checklists + log do que foi feito e por quê) fica em
> [`PLANO_EXECUCAO_SEGURANCA.md`](./PLANO_EXECUCAO_SEGURANCA.md).
> O sequenciamento global entre as 4 auditorias está no [Plano Diretor](../SUMARIO_CONSOLIDADO.md).

---

## 1. Sumário Executivo

O ponto mais grave **não está no código-fonte, mas na sua ausência**: **não existe arquivo `firestore.rules` no repositório** e o `firebase.json` **só faz deploy de `hosting`**. Isso significa que as regras de segurança do banco não são versionadas, não passam por revisão e não fazem parte do CI/CD. Em um app client-only, as regras são o **único** mecanismo que impede que qualquer pessoa — de posse da configuração pública do Firebase (que é embarcada no bundle JS entregue ao navegador) — leia, altere ou apague **toda a base** (clientes, orçamentos com precificação, representantes).

Toda a "autorização" da aplicação (`ProtectedRoutes`, `Router`) é **puramente client-side** e apenas esconde a UI; um atacante ignora completamente o React e fala direto com a API do Firestore usando o SDK.

| Severidade | Qtde | Itens |
|---|---|---|
| 🔴 **Crítica** | 1 | SEG-01 (regras Firestore ausentes/não versionadas) |
| 🟠 **Alta** | 3 | SEG-02 (autz client-side + signup aberto), SEG-03 (sessão de ~30h por bug), SEG-04 (integridade de escrita sem enforcement) |
| 🟡 **Média** | 5 | SEG-05 (criação não-atômica), SEG-06 (`updateBudget` sem validação), SEG-07 (ID de doc via URL sem sanitização), SEG-08 (sem validação real de CNPJ/CPF), SEG-09 (`.firebaserc` com aliases invertidos) |
| ⚪ **Baixa/Info** | 5 | SEG-10 (login sem feedback/validação), SEG-11 (`console.*` vaza info), SEG-12 (`document.write`/`ReactDOM.render` legado), SEG-13 (persistência inconsistente), SEG-14 (config no bundle — informativo) |

---

## 2. Inventário Exaustivo de Riscos

### 🔴 SEG-01 — [CRÍTICA] Regras do Firestore ausentes do repositório e do pipeline de deploy
**OWASP:** A01 Broken Access Control · A05 Security Misconfiguration
**Evidência:**
- `find . -name '*.rules'` → **nenhum resultado**. Não há `firestore.rules`.
- [firebase.json](firebase.json) contém **apenas** o bloco `hosting`; nenhum `firestore.rules`/`firestore.indexes`.
- `firebase deploy` (usado no CI `.github/workflows/deploy.yaml`) portanto **nunca aplica regras** — elas vivem só no console (estado desconhecido/não auditável).
- A configuração do Firebase (`apiKey`, `projectId`, etc.) é embarcada no bundle via `import.meta.env.VITE_*` ([firebase.ts:12-20](src/firebase.ts#L12)) — pública por natureza.

**Cenário de ataque:** um atacante abre o DevTools em qualquer navegador, extrai `firebaseConfig` do bundle, instancia o SDK e executa `getDocs(collection(db,'clients'))` / `deleteDoc(...)`. Se as regras estiverem em modo de teste (`allow read, write: if true`) ou permissivas, ele **lê e destrói toda a base** sem nunca tocar a UI.

**Impacto:** vazamento total de dados de clientes/representantes/orçamentos (precificação comercial sensível), adulteração e destruição de dados, exaustão de quota (custo).

---

### 🟠 SEG-02 — [ALTA] Autorização apenas client-side, sem RBAC, com cadastro (signup) potencialmente aberto
**OWASP:** A01 Broken Access Control · A07 Identification & Authentication Failures
**Evidência:**
- [ProtectedRoutes.tsx:5-8](src/utils/ProtectedRoutes.tsx#L5): `user ? <Outlet/> : <Navigate to="/Login"/>` — só controla renderização.
- [Router.tsx:16-27](src/Router.tsx#L16): decisão de montar app vs login é 100% no cliente.
- Não há noção de papéis/permissões: **qualquer usuário autenticado tem acesso total** a todas as coleções e operações.
- O provedor Email/Senha do Firebase permite `createUserWithEmailAndPassword` **a partir do cliente** com a API key pública, **a menos que o cadastro seja desabilitado no console**. Se as regras forem `if request.auth != null`, um atacante que se auto-cadastra ganha acesso completo.

**Impacto:** guardas de rota são contornáveis; a proteção depende inteiramente de regras que hoje não existem no repo (SEG-01).

---

### 🟠 SEG-03 — [ALTA] Bug no timer de auto-logout: sessão dura ~30 horas em vez de 2
**OWASP:** A07 Authentication Failures (Session Management)
**Evidência:** [ContextAuth.tsx:70](src/context/ContextAuth.tsx#L70)
```ts
const timeRemaining = 6 * 60 * 60 * 5000 - elapsedTime; // 2 horas em milissegundos
```
`6 * 60 * 60 * 5000 = 108.000.000 ms ≈ 30 horas` — o comentário diz "2 horas", mas a expressão correta seria `2 * 60 * 60 * 1000`. Além disso o `setTimeout` **nunca é limpo** (não há `clearTimeout` no unmount nem em novo login) → timers empilham.

**Impacto:** janela de sessão ~15× maior que a pretendida em máquinas compartilhadas (risco de sequestro de sessão); comportamento imprevisível de logout com múltiplos timers.

---

### 🟠 SEG-04 — [ALTA] Integridade de escrita sem enforcement do lado servidor
**OWASP:** A08 Software & Data Integrity Failures
**Evidência:** todas as validações (`validateBudget`, `validateClient`, `validateRepresentative`) rodam **no cliente**, antes do `setDoc`/`updateDoc`. Sem regras (SEG-01), nada impede um cliente adulterado de gravar `totalValue` arbitrário, `customUnitValue` negativo, ou sobrescrever o contador `meta/lastBudgetId`.
**Impacto:** corrupção de dados comerciais, fraude de preços, quebra da geração de IDs.

---

### 🟡 SEG-05 — [MÉDIA] Criação de documentos não-atômica (contador + `setDoc` em passos separados)
**OWASP:** A04 Insecure Design (integridade)
**Evidência:** [budgetServices.ts:135-149](src/services/budgetServices.ts#L135) (e equivalente em client/product/representative):
```ts
const id = await getNextBudgetId();     // transação: incrementa meta/lastBudgetId
...
const docRef = doc(db, "budgets", id.toString());
await setDoc(docRef, newBudget);        // 2ª operação, FORA da transação
```
Se o `setDoc` falhar (rede, permissão), o contador já foi incrementado → **buraco de ID** e documento inexistente. Não há colisão de ID (a transação garante unicidade), mas a operação de negócio "criar orçamento" não é atômica.
**Impacto:** inconsistência entre contador e coleção; orçamentos "fantasma" no contador.

---

### 🟡 SEG-06 — [MÉDIA] `updateBudget` não valida os dados (inconsistente com as demais entidades)
**Evidência:** [budgetServices.ts:160-175](src/services/budgetServices.ts#L160) — `updateBudget` **não** chama `validateBudget`, enquanto `updateClient` ([clientServices.ts:162](src/services/clientServices.ts#L162)) e `updateRepresentative` chamam a validação.
**Impacto:** atualização pode gravar orçamento sem representante/produtos/prazo; superfície para dados inválidos.

---

### 🟡 SEG-07 — [MÉDIA] ID de documento vindo da URL sem sanitização (path de documento)
**OWASP:** A03 Injection (NoSQL/path)
**Evidência:** rota `Orcamentos/Editar/:id` → `useParams()` → `getBudgetById(budgetId)` → `doc(db, "budgets", budgetId)` ([budgetServices.ts:48](src/services/budgetServices.ts#L48)). O `budgetId` é controlado pelo usuário e não é validado como numérico. Um valor com `/` altera a estrutura do path do Firestore (segmentos de sub-coleção).
**Impacto:** majoritariamente erros/exceções (paths inválidos), mas é entrada não-validada chegando à camada de dados — deve ser restringida a `^\d+$`.

---

### 🟡 SEG-08 — [MÉDIA] Ausência de validação real de CNPJ/CPF (apenas máscara visual)
**OWASP:** A04 Insecure Design (validação de entrada)
**Evidência:** [Masks.ts:1-55](src/utils/Masks.ts) — `cnpjMask`/`cpfMask` apenas **formatam**; não validam dígitos verificadores (módulo-11). Documentos inválidos são aceitos e persistidos.
**Impacto:** integridade de dados fiscais/cadastrais (documentos inválidos em orçamentos/clientes).

---

### 🟡 SEG-09 — [MÉDIA] `.firebaserc` com aliases invertidos (risco de deploy no ambiente errado)
**Evidência:** [.firebaserc](.firebaserc): `default`/`production` → `ads-representacoes-dev`, mas `development` → `ads-representacoes` (prod real). O próprio `CLAUDE.md` alerta sobre isso; o arquivo aparece **modificado** no `git status`.
**Impacto:** `firebase deploy --project=production` publica em DEV e `--project=development` publica em PROD — risco de sobrescrever/expor produção por engano.

---

### ⚪ SEG-10 a SEG-14 — [BAIXA/INFO]

| # | Item | Evidência | Impacto |
|---|---|---|---|
| SEG-10 | Login sem feedback de erro nem validação | [Login.tsx:23-31](src/components/Login/Login.tsx#L23) só faz `console.error`; `noValidate`; botão não desabilita durante submit; handlers `event` sem tipo (`any`) | UX ruim; erro só no console; duplo submit possível. (Firebase já faz throttling server-side.) |
| SEG-11 | Vazamento de informação por `console.*` em produção | 83 ocorrências / 27 arquivos (ex.: `ContextAuth.tsx:60` loga `error.code`/`message`; `cacheService` loga chaves/estado) | Exposição de detalhes internos no console do navegador; ruído. |
| SEG-12 | `document.write` + `ReactDOM.render` (API legada) para PDF | [Budgets.tsx:158](src/pages/Budgets/Budgets.tsx#L158) e [RecentBudgets.tsx:44](src/components/Dashboard/RecentBudgets.tsx#L44) | **Não é XSS** (o template é estático; os dados do orçamento passam por `ReactDOM.render`, que escapa). Porém é padrão frágil/legado e **duplicado**. Defensivamente, migrar para rota React. |
| SEG-13 | Persistência de sessão inconsistente | [firebase.ts:4](src/firebase.ts#L4) importa `browserLocalPersistence`/`setPersistence` **sem usar**; [ContextAuth.tsx:44](src/context/ContextAuth.tsx#L44) usa `browserSessionPersistence` | Confusão sobre tempo de vida da sessão; imports mortos. |
| SEG-14 | Config do Firebase no bundle | `firebase.ts` | **Informativo** — esperado em apps web Firebase (a API key é identificador, não segredo). `.env*` estão **gitignored** (✅ verificado). O controle real são as regras (SEG-01). |

---

## 3. Código Atual vs. Código Corrigido

### 3.1 SEG-01 — Criar e versionar `firestore.rules` + deployá-las via `firebase.json`

**Criar `firestore.rules` (exemplo de baseline com validação e negação por padrão):**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Somente usuários autenticados e explicitamente autorizados (allowlist).
    function isStaff() {
      return request.auth != null
        && exists(/databases/$(database)/documents/staff/$(request.auth.uid));
    }

    // Coleções de negócio: leitura/escrita apenas para staff, com validações.
    match /clients/{id} {
      allow read: if isStaff();
      allow create, update: if isStaff()
        && request.resource.data.name is string
        && request.resource.data.name.size() > 0;
      allow delete: if isStaff();
    }

    match /budgets/{id} {
      allow read: if isStaff();
      allow create, update: if isStaff()
        && request.resource.data.totalValue is number
        && request.resource.data.totalValue >= 0
        && request.resource.data.selectedProducts is list;
      allow delete: if isStaff();
    }

    match /representatives/{id} { allow read, write: if isStaff(); }

    // Contadores atômicos: só staff pode incrementar.
    match /meta/{doc} { allow read, write: if isStaff(); }

    // Nega tudo o que não foi explicitamente permitido.
    match /{document=**} { allow read, write: if false; }
  }
}
```
> A coleção `staff/{uid}` funciona como allowlist e neutraliza o cadastro aberto (SEG-02): auto-registrar-se no Auth não basta — é preciso um doc em `staff` criado por um admin. Alternativa: usar **custom claims** (`request.auth.token.staff == true`).

**Atualizar `firebase.json` para publicar as regras:**
```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "hosting": { "public": "dist", "...": "..." }
}
```

### 3.2 SEG-03 — Corrigir o timer de auto-logout (2h) e limpar o `setTimeout`
```ts
// ANTES (ContextAuth.tsx:70)
const timeRemaining = 6 * 60 * 60 * 5000 - elapsedTime; // "2 horas" (na verdade ~30h)
if (timeRemaining > 0) {
  setTimeout(() => { logout(); }, timeRemaining);
}

// DEPOIS
const SESSION_TTL_MS = 2 * 60 * 60 * 1000; // 2 horas
const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleAutoLogout = () => {
  const loginTime = Number(sessionStorage.getItem("loginTime")) || Date.now();
  const timeRemaining = SESSION_TTL_MS - (Date.now() - loginTime);
  if (logoutTimer.current) clearTimeout(logoutTimer.current); // evita empilhar
  if (timeRemaining <= 0) return logout();
  logoutTimer.current = setTimeout(logout, timeRemaining);
};
// e no cleanup do useEffect: if (logoutTimer.current) clearTimeout(logoutTimer.current);
```

### 3.3 SEG-05 — Tornar a criação atômica (contador + documento na mesma transação)
```ts
// DEPOIS — addBudget dentro de uma única transação
export const addBudget = async (budget): Promise<IBudget> => {
  validateBudget(budget);
  return runTransaction(db, async (tx) => {
    const metaRef = doc(db, "meta", "lastBudgetId");
    const snap = await tx.get(metaRef);
    const nextId = (snap.exists() ? snap.data().id : 0) + 1;
    tx.set(metaRef, { id: nextId });

    const newBudget = removeUndefinedFields({
      ...budget, id: String(nextId),
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    }) as IBudget;
    tx.set(doc(db, "budgets", String(nextId)), newBudget);
    return newBudget;
  });
};
```

### 3.4 SEG-06 — Validar em `updateBudget`
```ts
export const updateBudget = async (budgetId: string, budget: Partial<IBudget>) => {
  if (!budgetId) throw new Error("ID do orçamento é obrigatório para atualização");
  validateBudget(budget); // <-- faltando hoje
  const cleaned = removeUndefinedFields({ ...budget, updatedAt: Timestamp.now() });
  await updateDoc(doc(db, "budgets", budgetId), cleaned);
};
```

### 3.5 SEG-07 — Sanitizar o ID vindo da URL
```ts
export const getBudgetById = async (budgetId: string): Promise<IBudget | null> => {
  if (!/^\d+$/.test(budgetId)) {   // whitelist: apenas dígitos
    console.warn("ID de orçamento inválido:", budgetId);
    return null;
  }
  // ... resto igual
};
```

### 3.6 SEG-08 — Validar dígitos verificadores de CNPJ/CPF
```ts
// utils/validators.ts (novo) — validação real, separada da máscara visual
export const isValidCnpj = (raw: string): boolean => {
  const c = raw.replace(/\D/g, "");
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (base: string) => {
    let sum = 0, pos = base.length - 7;
    for (let i = 0; i < base.length; i++) {
      sum += Number(base[i]) * pos--; if (pos < 2) pos = 9;
    }
    const r = sum % 11; return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(c.slice(0, 12));
  const d2 = calc(c.slice(0, 12) + d1);
  return c.endsWith(`${d1}${d2}`);
};
// Chamar em validateClient antes do setDoc quando cnpj for informado.
```

---

## 4. Plano de Implementação Consolidado de Segurança

> Esta seção substitui o antigo backlog SEC-01..SEC-12. Define fases (S0–S3), **dono único** por item
> (nenhum item é implementado em duas trilhas), critérios de aceite e dependências.
> Checklists operacionais e log de execução: [`PLANO_EXECUCAO_SEGURANCA.md`](./PLANO_EXECUCAO_SEGURANCA.md).

### 4.0 Verificação do diagnóstico contra o código-fonte (2026-07-09)

Todos os achados-chave foram **reconfirmados no código atual** antes de planejar:

| Achado | Verificação |
|---|---|
| SEG-01 | ✅ Confirmado — `Glob **/*.rules` → 0 arquivos; `firebase.json` contém **apenas** o bloco `hosting`. |
| SEG-03 | ✅ Confirmado — `ContextAuth.tsx:70` = `6 * 60 * 60 * 5000` (≈30 h); **nenhum** `clearTimeout` no arquivo; `scheduleAutoLogout()` é chamado no `login` (l.56) **e** no `onAuthStateChanged` (l.98) → timers empilham. |
| SEG-09 | ✅ Confirmado no estado atual (o arquivo consta como modificado no git): `default`/`production` → `ads-representacoes-dev` e `development` → `ads-representacoes` (prod real). **Nuance:** o CI usa `--project=<id>` direto (não aliases), então o risco concreto é o **deploy manual** por alias. |
| SEG-13 | ✅ Confirmado — `firebase.ts:4` importa `browserLocalPersistence`/`setPersistence` **sem usar**; adicionalmente `ContextAuth.tsx` importa `updateProfile`/`UserCredential` sem uso. |
| SEG-10 | ✅ Confirmado — `Login.tsx:23-31` engole o erro (`console.error`), handlers sem tipo, botão sem estado de loading/disabled. |
| SEG-05/06/07 | ✅ Confirmados em `budgetServices.ts` (add em 2 passos; `updateBudget` sem `validateBudget`; `getBudgetById` sem whitelist `^\d+$`). |

### 4.1 Princípios de sequenciamento

1. **Perímetro primeiro (S0).** Regras do Firestore são a única fronteira real (modelo de ameaça). Nada de novo deploy de produção antes de S0. Itens de S0 não dependem de nenhuma outra trilha.
2. **Não migrar o mesmo código duas vezes.** SEG-06 (validação no update) e SEG-07 (sanitizar ID) são pontuais e entram **já** — a refatoração EST F2.1 (factory de services) tem como requisito **preservá-los**. Já SEG-05 (atomicidade do add) é estrutural: em vez de reescrever os 4 services agora e de novo no factory, a atomicidade vira **requisito de design do factory EST F2.1**; a trilha SEG especifica (§3.3) e **valida** o resultado.
3. **Dono único para itens compartilhados.** SEG-11 (`console.*`) → executado por **EST F4.5** (logger) + **PERF** (`esbuild.drop` no build). SEG-12 (PDF legado) → executado por **EST F4.3** (rota React, cobrindo os 2 call sites: `Budgets.tsx` e `RecentBudgets.tsx`). SEG-14 é informativo (sem ação).

### 4.2 Roadmap por fases

| Fase | Tema | Itens (achados) | Pré-requisito |
|---|---|---|---|
| **S0** | Perímetro crítico (antes de qualquer deploy) | SEG-01, SEG-02, SEG-04(servidor), SEG-03, SEG-09 | — |
| **S1** | Endurecimento do app | SEG-06, SEG-07, SEG-10, SEG-13 | — |
| **S2** | Integridade de dados | SEG-05 (via EST F2.1), SEG-08 | EST F2.1 (para SEG-05) |
| **S3** | Governança e testes de regras | testes de `firestore.rules` no emulador + CI | S0 |
| — | Referenciados (dono em outra trilha) | SEG-11 → EST F4.5 + PERF P0.2 · SEG-12 → EST F4.3 · SEG-14 info | — |

### 4.3 Especificação por item

- **S0.1 · Versionar e publicar `firestore.rules` (deny-by-default + allowlist `staff`)** — *SEG-01, SEG-02, SEG-04.*
  Criar `firestore.rules` conforme baseline do §3.1 (função `isStaff()`, validações de tipo em `create/update`, `match /{document=**} { allow read, write: if false; }`), criar `firestore.indexes.json`, adicionar o bloco `firestore` ao `firebase.json` e garantir que o CI (`deploy.yaml`) publica as regras. Conferir no console que o banco **não** está em modo teste e alinhar o estado do console com o arquivo versionado.
  **Aceite:** `firebase deploy` aplica as regras; um cliente SDK **não autenticado** e um autenticado **fora da allowlist** recebem `permission-denied` em leitura e escrita de todas as coleções; o app segue funcionando para usuários staff.

- **S0.2 · Neutralizar o signup aberto** — *SEG-02.*
  Provisionar a coleção `staff/{uid}` para os usuários legítimos (ou custom claims). Com as regras de S0.1, auto-cadastro no Auth deixa de dar acesso a dados. Adicionalmente, desabilitar/restringir o provedor Email/Senha para novos cadastros no console, se o negócio não exige signup.
  **Aceite:** conta recém-criada via `createUserWithEmailAndPassword` (fora da allowlist) não lê nenhuma coleção.

- **S0.3 · Corrigir o timer de auto-logout (2h) + `clearTimeout`** — *SEG-03 (= PERF-15; dono: SEG).*
  Implementar conforme §3.2: constante `SESSION_TTL_MS = 2*60*60*1000`, id do timer em `useRef`, `clearTimeout` antes de reagendar e no cleanup do `useEffect`. Aproveitar para remover os imports mortos de `ContextAuth.tsx` (`updateProfile`, `UserCredential`).
  **Aceite:** sessão expira em ~2 h; múltiplos eventos de auth não acumulam timers (verificável com fake timers no teste).

- **S0.4 · Corrigir aliases do `.firebaserc` + trava de deploy manual** — *SEG-09.*
  Alinhar aliases à semântica real (`default`/`development` → `ads-representacoes-dev`; `production` → `ads-representacoes`) e atualizar a nota do `CLAUDE.md` que documenta a inversão. CI permanece com `--project=<id>` explícito.
  **Aceite:** `firebase use production` aponta para o projeto de produção real; documentação coerente.

- **S1.1 · `validateBudget` em `updateBudget`** — *SEG-06.* Conforme §3.4; atenção ao caso `Partial<IBudget>` (validar os campos presentes/exigidos pelo fluxo de edição). **Aceite:** update sem representante/produtos/prazo é rejeitado com erro claro; **EST F2.1 preserva** a validação ao migrar para factory.

- **S1.2 · Sanitizar IDs vindos da URL (`^\d+$`)** — *SEG-07.* Conforme §3.5, em `getBudgetById` (e o padrão vale para os demais `get*ById`). **Aceite:** `/Orcamentos/Editar/abc%2Fx` não chega ao Firestore; usuário vê "não encontrado".

- **S1.3 · Feedback e endurecimento do Login** — *SEG-10 (dono: SEG; UI apenas re-estiliza depois).*
  Mapear `error.code` → mensagem amigável em pt-BR, exibir no form, desabilitar o botão durante submit (evita duplo submit), tipar os handlers.
  **Aceite:** credencial errada mostra mensagem visível; duplo clique não dispara 2 logins.

- **S1.4 · Unificar persistência de sessão e limpar imports mortos** — *SEG-13.*
  Remover `browserLocalPersistence`/`setPersistence` de `firebase.ts` (a persistência de sessão é definida em `ContextAuth.tsx:44`); documentar a decisão (`browserSessionPersistence`).
  **Aceite:** uma única estratégia declarada; lint verde.

- **S2.1 · Criação atômica (contador + doc na mesma transação)** — *SEG-05; implementado via EST F2.1.*
  O factory `createCrudService` **deve** implementar `add` conforme §3.3 (contador e `set` do doc na mesma `runTransaction`). SEG valida com teste (falha simulada não incrementa contador).
  **Aceite:** falha no `set` não deixa "buraco" no contador.

- **S2.2 · Validação real de CNPJ/CPF** — *SEG-08.*
  Criar `src/utils/validators.ts` (§3.6, módulo-11), integrar em `validateClient`/`validateRepresentative` e exibir erro no form. Máscaras de `Masks.ts` continuam só formatando.
  **Aceite:** CNPJ com dígito verificador inválido é rejeitado no submit com mensagem clara.

- **S3.1 · Testes das regras no emulador + CI** — *(novo; rede de segurança da trilha SEG).*
  Usar `@firebase/rules-unit-testing` + Firestore Emulator: casos "anônimo negado", "autenticado não-staff negado", "staff CRUD ok", "escrita inválida negada". Rodar no CI antes do deploy.
  **Aceite:** suíte de regras verde no CI; mudança de regra sem teste quebra o pipeline.

### 4.4 Dependências entre trilhas

| Item SEG | Relação |
|---|---|
| S0.3 (timer) | Mesmo código que **PERF-15** — dono SEG; PERF apenas referencia. |
| S2.1 (atomicidade) | Implementado dentro do factory **EST F2.1**; SEG especifica e valida. |
| S1.1/S1.2 | Feitos antes de EST F2.1; o factory **preserva** validação e sanitização. |
| SEG-11 (`console.*`) | Dono **EST F4.5** (logger) + **PERF P0.2** (`esbuild.drop` em prod). |
| SEG-12 (PDF legado) | Dono **EST F4.3** — rota React cobrindo `Budgets.tsx` **e** `RecentBudgets.tsx`. |
| S1.3 (Login) | UI/UX referencia (não reimplementa); re-estilização visual só na fase de tokens da trilha UI. |

---

_Fim da FASE 2. Este documento passou de diagnóstico com backlog para **diagnóstico + plano consolidado**. Nenhuma alteração de código de produção foi realizada até aqui. Observação: a confirmação do estado real das regras no **console do Firebase** continua pendente (fora do alcance da análise estática) — os itens S0 assumem o pior caso até que se prove o contrário._

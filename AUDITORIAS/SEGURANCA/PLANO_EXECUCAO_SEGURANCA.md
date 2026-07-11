# PLANO_EXECUCAO_SEGURANCA.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase Auth/Firestore)
**Origem:** consolida o §4 de [`REPORTE_SEGURANCA.md`](./REPORTE_SEGURANCA.md)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-10

---

## Como usar este documento

- Cada fase tem **checklist de execução** com passos concretos e **critério de aceite**. Marque `[x]` ao concluir.
- **S0 vem antes de qualquer novo deploy de produção.** Não pule a ordem.
- Itens marcados **[REF]** são de **dono de outra trilha** — aqui só se **verifica** o resultado; não há implementação duplicada (regra de dono único do Plano Diretor).
- Ao concluir qualquer item, **registre no §Log de Execução**: o quê foi feito e **por quê**.
- Especificações técnicas (antes/depois de código): §3 do reporte.

### Portões de qualidade
- [x] `npm run build` (tsc + vite) **verde** após S0/S1 (2026-07-10).
- [~] `npm run lint --max-warnings 0`: os 4 arquivos alterados **não introduzem nenhum problema novo** (`Login.tsx`/`firebase.ts` limpos; os 4 avisos em `ContextAuth.tsx`/`budgetServices.ts` são **pré-existentes**). O gate global segue vermelho por **código morto pré-existente** de outras trilhas (unused imports em ~15 arquivos) — dono: **EST F0**.
- [ ] (quando EST F1 existir) `npm run test` verde
- [x] Nenhum segredo committed: `.env*` permanecem gitignored.

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **S0** | Perímetro crítico (bloqueia deploy) | 4 | 🟡 Código feito · **ações de Console/deploy pendentes** (publicar regras, provisionar `staff`, desabilitar signup) |
| **S1** | Endurecimento do app | 4 | ✅ Concluído (código) |
| **S2** | Integridade de dados | 2 | ⬜ Pendente (S2.1 ⛔ espera EST F2.1) |
| **S3** | Governança e testes de regras | 1 | ⬜ Pendente |

---

## Fase S0 — Perímetro crítico (fazer JÁ, antes de qualquer deploy)

### S0.1 — Versionar e publicar `firestore.rules` (SEG-01, SEG-02, SEG-04) 🟡 código feito · Console pendente
Verificado: não existe nenhum `*.rules` no repo e [firebase.json](../../firebase.json) só tem `hosting`.
- [x] Criar `firestore.rules` na raiz: `isStaff()` via `staff/{uid}`, `meta/{doc}` só staff, integridade em `budgets` (`totalValue is number && >= 0`, `selectedProducts is list`), e **deny-by-default** (`match /{document=**} { allow read, write: if false; }`). **Desvio deliberado:** validação de campo aplicada só a `budgets` (schema confirmado em `IBudget`); `clients`/`products`/`representatives` ficam `isStaff()`-only por ora — asserções de campo (ex.: `name is string`) só entram com os testes de emulador de S3.1, para não arriscar rejeitar gravações legítimas.
- [x] Criar `firestore.indexes.json` (vazio: `{"indexes":[],"fieldOverrides":[]}`).
- [x] Adicionar ao `firebase.json`: `"firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" }`.
- [x] Confirmado que `.github/workflows/deploy.yaml` executa `firebase deploy` sem `--only hosting` → passará a publicar as regras automaticamente no próximo push.
- [ ] **Console (você):** provisionar `staff/{uid}` dos usuários reais **antes** de publicar (senão lockout), exportar/anotar as regras atuais, comparar e publicar (dev → prod). Confirmar que o banco NÃO está em modo teste.
- **Aceite:** SDK não autenticado e autenticado fora da allowlist recebem `permission-denied` em `read`/`write` de `clients`, `budgets`, `products`, `representatives`, `meta`; app segue funcional para staff.

### S0.2 — Neutralizar signup aberto (SEG-02) 🟡 sem código no app · Console pendente
Verificado: **não há** `createUserWithEmailAndPassword` em `src/` — não existe fluxo de signup no código. O risco é o provedor Email/Senha aceitar cadastro via API key pública. Resolução é 100% de Console + a allowlist `staff` (S0.1).
- [ ] **Console (você):** provisionar `staff/{uid}` para cada usuário legítimo (é a allowlist consumida pelas regras).
- [ ] **Console (você):** desabilitar/restringir criação de novas contas Email/Senha (ou aceitar signup mas sem acesso, já garantido pelas regras).
- **Aceite:** conta nova criada via `createUserWithEmailAndPassword` (não-staff) não consegue ler nenhuma coleção.

### S0.3 — Timer de auto-logout: 2h de verdade + `clearTimeout` (SEG-03 = PERF-15) ✅
Verificado: [ContextAuth.tsx:70](../../src/context/ContextAuth.tsx#L70) usava `6 * 60 * 60 * 5000` (≈30 h) e não havia `clearTimeout`; `scheduleAutoLogout` roda no `login` **e** em cada `onAuthStateChanged` → timers empilhavam.
- [x] Extraída constante de módulo `SESSION_TTL_MS = 2 * 60 * 60 * 1000`.
- [x] Id do timer guardado em `useRef`; `clearTimeout` antes de reagendar, no `logout` e no cleanup do `useEffect`.
- [x] Removidos imports mortos de `ContextAuth.tsx` (`updateProfile`, `UserCredential`).
- **Aceite:** sessão expira em ~2 h; múltiplas transições de auth não acumulam timers. ✔ (build verde; validação em runtime — timer de 2h — depende de teste com fake timers em EST F1).

### S0.4 — Aliases do `.firebaserc` (SEG-09) ✅
Verificado (estado anterior): `default`/`production` → `ads-representacoes-dev`; `development` → `ads-representacoes` (prod real). O CI usa `--project=<id>` direto — o risco era o **deploy manual** por alias.
- [x] Corrigido para: `default` → `ads-representacoes-dev`, `development` → `ads-representacoes-dev`, `production` → `ads-representacoes`.
- [x] Atualizada a nota do `CLAUDE.md` que documentava a inversão (agora descreve o mapeamento correto).
- **Aceite:** `firebase use production` seleciona o projeto de produção real; docs coerentes. ✔

---

## Fase S1 — Endurecimento do app

### S1.1 — `validateBudget` em `updateBudget` (SEG-06) ✅
- [x] Em [budgetServices.ts](../../src/services/budgetServices.ts): `updateBudget` agora chama `validateBudget(budget)` após a checagem de `budgetId`. Confirmado que o fluxo de edição ([BudgetFormPage.tsx:127](../../src/pages/BudgetFormPage/BudgetFormPage.tsx#L127)) envia `form.budget` completo — o mesmo objeto que `addBudget` já validava — então não quebra em update parcial.
- [ ] Nota de coesão: **EST F2.1 (factory) deve preservar** esta validação ao migrar os services.
- **Aceite:** update sem representante/produtos/prazo é rejeitado com mensagem clara. ✔

### S1.2 — Sanitizar IDs de URL (`^\d+$`) (SEG-07) ✅
- [x] Em `getBudgetById`: substituída a checagem `typeof` por whitelist `if (!/^\d+$/.test(budgetId)) { console.warn(...); return null; }`. Cobre também `undefined`/`null` (coerção falha o teste). É o único `get*ById` alimentado por parâmetro de URL (`Orcamentos/Editar/:id`); os demais recebem IDs de dados já em cache.
- **Aceite:** id não-numérico na URL não chega ao Firestore; UI mostra "não encontrado". ✔

### S1.3 — Feedback e endurecimento do Login (SEG-10) ✅
Verificado: [Login.tsx:23-31](../../src/components/Login/Login.tsx#L23) engolia o erro; handlers sem tipo; sem loading/disabled.
- [x] `getLoginErrorMessage(code)` mapeia `error.code` → mensagens pt-BR (`auth/invalid-credential`, `auth/too-many-requests`, `auth/network-request-failed`, etc.) e exibe via `<Alert severity="error">` (estado `error`).
- [x] Estado `submitting` desabilita o botão durante o login (guarda `if (submitting) return`) e reseta no `finally`; label vira "Entrando...".
- [x] Handlers tipados (`React.ChangeEvent<HTMLInputElement>` / `React.FormEvent`).
- [ ] **[REF UI]** Re-estilização visual (paleta/tokens) fica com a trilha UI/UX (U2) — aqui foi só o comportamento.
- **Aceite:** credencial errada mostra mensagem visível; duplo clique não dispara 2 logins. ✔ (build verde; smoke-test em runtime pende de credenciais Firebase.)

### S1.4 — Persistência de sessão única + imports mortos (SEG-13) ✅
Verificado: [firebase.ts:4](../../src/firebase.ts#L4) importava `browserLocalPersistence`/`setPersistence` sem usar.
- [x] Removidos os imports mortos de `firebase.ts` (restou só `getAuth`).
- [x] Comentário documentando a decisão: persistência é `browserSessionPersistence`, definida no login (`ContextAuth.tsx`).
- **Aceite:** uma única estratégia declarada; `firebase.ts` sem lint. ✔

---

## Fase S2 — Integridade de dados

### S2.1 — Criação atômica de documentos (SEG-05) ⛔ implementação via EST F2.1 ⬜
**Dono da implementação: EST F2.1 (factory de services).** SEG especifica e valida.
- [ ] Garantir que o design do `createCrudService` implementa `add` = contador + `set` do doc **na mesma** `runTransaction` (§3.3 do reporte).
- [ ] Validar: simular falha após o incremento (teste/emulador) → contador **não** avança.
- **Aceite:** falha no `set` não deixa buraco no contador; teste de regressão verde.

### S2.2 — Validação real de CNPJ/CPF (SEG-08) ⬜
- [ ] Criar `src/utils/validators.ts` com `isValidCnpj`/`isValidCpf` (módulo-11, §3.6; rejeitar sequências repetidas).
- [ ] Integrar em `validateClient` (e representante, se aplicável) — máscara continua só formatando.
- [ ] Exibir o erro no formulário (Create/Edit ClientModal) — mensagem pt-BR.
- **Aceite:** CNPJ/CPF com dígito verificador inválido é rejeitado no submit com mensagem clara; testes unitários dos validadores verdes (usa infra EST F1).

---

## Fase S3 — Governança e testes de regras

### S3.1 — Testes de `firestore.rules` no emulador + CI ⬜
- [ ] Adicionar `@firebase/rules-unit-testing` + script com Firestore Emulator.
- [ ] Casos mínimos: anônimo negado (read/write, todas as coleções); autenticado não-staff negado; staff CRUD ok; escrita com tipo inválido (`totalValue` string/negativo) negada; `meta` só staff.
- [ ] Integrar ao CI antes do `firebase deploy`.
- **Aceite:** suíte de regras verde no CI; alteração de regra sem teste quebra o pipeline.

---

## Itens referenciados (dono em outra trilha — NÃO implementar aqui)

| Achado SEG | Dono | Onde |
|---|---|---|
| SEG-11 (`console.*` vaza info) | EST F4.5 (logger) + PERF P0.2 (`esbuild.drop`) | `PLANO_EXECUCAO_ESTRUTURA.md` / `PLANO_EXECUCAO_PERFORMANCE.md` |
| SEG-12 (PDF `document.write`/`ReactDOM.render`) | EST F4.3 — ✅ **Resolvido (2026-07-10)** via `openBudgetPdf()` (Blob), removendo `document.write`/`ReactDOM.render` dos 2 call sites (`Budgets.tsx` + `RecentBudgets.tsx`). Não era XSS; agora nem API legada há. | `PLANO_EXECUCAO_ESTRUTURA.md` |
| SEG-14 (config no bundle) | — informativo, sem ação | — |

---

## Log de Execução

> Formato: **data · fase/item · O QUE foi feito · POR QUÊ · verificação**.

### 2026-07-09 · Planejamento (S-plan) · Consolidação do diagnóstico em plano executável
- **O que foi feito:**
  - Verificação dos achados-chave contra o código-fonte (não confiar cegamente no relatório): SEG-01 confirmado (0 arquivos `*.rules`; `firebase.json` só `hosting`); SEG-03 confirmado (`6*60*60*5000` ≈ 30 h em `ContextAuth.tsx:70`, sem `clearTimeout`, agendamento duplicado em `login` + `onAuthStateChanged`); SEG-09 confirmado no estado atual do `.firebaserc` (com a nuance de que o CI usa `--project=<id>` direto → risco concentrado no deploy manual); SEG-13 confirmado (+ imports mortos extras em `ContextAuth.tsx`); SEG-10 e SEG-05/06/07 confirmados.
  - Reescrito o §4 do reporte (backlog → **Plano de Implementação Consolidado**, fases S0–S3 com aceites) e criado este arquivo de execução.
  - **Decisões de coesão entre trilhas** (evitar overlap): SEG-05 implementado **dentro** do factory EST F2.1 (não reescrever services 2×); SEG-11 e SEG-12 delegados aos donos EST/PERF; S1.3 (Login) fica com SEG no comportamento e com UI/UX só na re-estilização; S0.3 é o mesmo código de PERF-15 (dono: SEG).
- **Por que foi feito:** o pedido era transformar o backlog em plano real, sequenciado e sem duplicação com as demais auditorias; segurança tem prioridade máxima, por isso S0 bloqueia deploy e não depende de nenhuma outra trilha.
- **Verificação:** documentos revisados; **nenhuma** alteração em código de produção nesta etapa. Fases S0–S3 seguem `⬜ Pendente`.

### 2026-07-10 · S0 + S1 · Execução da Onda 0 (perímetro) + Onda 1 (endurecimento) — lado código
- **O que foi feito:**
  - **S0.1** — Criados `firestore.rules` (deny-by-default + allowlist `staff/{uid}` via `isStaff()`; `meta` só staff; integridade em `budgets`: `totalValue is number && >= 0`, `selectedProducts is list`) e `firestore.indexes.json`; `firebase.json` passou a referenciar `firestore.rules`/`firestore.indexes.json`. **Desvio deliberado:** asserções de campo só em `budgets` (schema confirmado em `IBudget`); `clients`/`products`/`representatives` ficam `isStaff()`-only até os testes de emulador de S3.1, para não arriscar bloquear gravações legítimas.
  - **S0.3** — `ContextAuth.tsx`: `SESSION_TTL_MS = 2*60*60*1000`, timer guardado em `useRef`, `clearTimeout` antes de reagendar + no `logout` + no cleanup do `useEffect`; removidos imports mortos `updateProfile`/`UserCredential`. Corrige o cálculo de ~30 h e o empilhamento de timers.
  - **S0.4** — `.firebaserc` corrigido (`production` → `ads-representacoes`; `default`/`development` → `-dev`); nota do `CLAUDE.md` reescrita (deixou de afirmar inversão).
  - **S1.1** — `updateBudget` agora chama `validateBudget(budget)` (paridade com `addBudget`). Confirmado que a edição envia `form.budget` completo.
  - **S1.2** — `getBudgetById` passou a exigir `^\d+$` (whitelist numérico), impedindo IDs de URL com `/`/encoding malicioso de alterarem o path do Firestore.
  - **S1.3** — `Login.tsx`: `getLoginErrorMessage(code)` + `<Alert>` para feedback pt-BR, estado `submitting` (anti-duplo-submit, label "Entrando..."), handlers tipados.
  - **S1.4** — `firebase.ts`: removidos `browserLocalPersistence`/`setPersistence` não usados; comentário fixando a decisão (persistência de sessão no login).
- **Por que foi feito:** a Onda 0 é o perímetro que bloqueia deploy de produção; a Onda 1 endurece o app sem depender de outras trilhas. Segurança tem prioridade e nenhum destes itens depende de EST/PERF/UI.
- **Arquivos:** `firestore.rules` (novo), `firestore.indexes.json` (novo), `firebase.json`, `.firebaserc`, `CLAUDE.md`, `src/context/ContextAuth.tsx`, `src/services/budgetServices.ts`, `src/components/Login/Login.tsx`, `src/firebase.ts`.
- **Verificação:** `npm run build` (tsc + vite) **verde**. Lint: **zero problemas novos** nos arquivos alterados; gate global permanece vermelho por código morto pré-existente (dono EST F0). Cross-ref: **PERF-15 resolvido por S0.3** (anotado em `PLANO_EXECUCAO_PERFORMANCE.md`).
- **⚠️ Pendências de Console/deploy (você):** provisionar `staff/{uid}` dos usuários reais **antes** de publicar as regras (evita lockout); publicar regras (dev → prod); desabilitar/restringir signup Email/Senha. Enquanto isso o **deploy de produção segue congelado** (o CI agora publica regras no push — não faça push para `main` antes dos docs `staff`).

<!--
### AAAA-MM-DD · Sx.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** aceites atendidos; build/lint/test verdes.
-->

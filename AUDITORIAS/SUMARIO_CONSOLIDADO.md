# PLANO DIRETOR — Auditoria Exaustiva ADS Representações

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase)
**Data da análise:** 2026-07-09 · **Plano diretor consolidado em:** 2026-07-09
**Escopo:** 4 dimensões — Arquitetura, **Segurança**, Performance e UI/UX

> **O que é este documento:** o plano mestre que costura as 4 auditorias em **um único roadmap sem overlap**.
> Cada achado tem **exatamente um dono** (uma trilha, um checklist, uma mudança de código). Os planos de
> execução por trilha (com checklists e **log do que foi feito e por quê**) são:
>
> | Trilha | Reporte (diagnóstico + plano) | Execução (checklist + log) |
> |---|---|---|
> | 🏗️ Estrutura | [REPORTE_ESTRUTURA.md](ESTRUTURA/REPORTE_ESTRUTURA.md) | [PLANO_EXECUCAO_ESTRUTURA.md](ESTRUTURA/PLANO_EXECUCAO_ESTRUTURA.md) |
> | 🔐 Segurança | [REPORTE_SEGURANCA.md](SEGURANCA/REPORTE_SEGURANCA.md) | [PLANO_EXECUCAO_SEGURANCA.md](SEGURANCA/PLANO_EXECUCAO_SEGURANCA.md) |
> | ⚡ Performance | [REPORTE_PERFORMANCE.md](PERFORMANCE/REPORTE_PERFORMANCE.md) | [PLANO_EXECUCAO_PERFORMANCE.md](PERFORMANCE/PLANO_EXECUCAO_PERFORMANCE.md) |
> | 🎨 UI/UX | [REPORTE_UI_UX.md](UI_UX/REPORTE_UI_UX.md) | [PLANO_EXECUCAO_UI_UX.md](UI_UX/PLANO_EXECUCAO_UI_UX.md) |
>
> ### 📋 Planos de Code Review por Onda (A executar após todas as ondas)
> | Onda | Objetivo do Plano de Code Review | Arquivo de Planejamento |
> |---|---|---|
> | 🚨 Onda 0 | Perímetro crítico de segurança (Regras, timeouts e deploy) | [PLANO_CODE_REVIEW_ONDA_0.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_0.md) |
> | 🔧 Onda 1 | Correções de UI/UX, code-splitting e limpeza de código | [PLANO_CODE_REVIEW_ONDA_1.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_1.md) |
> | 🧱 Onda 2 | Suítes de testes unitários/regras, MUI Theme e CI | [PLANO_CODE_REVIEW_ONDA_2.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_2.md) |
> | 🏗️ Onda 3 | Desduplicação de services/estado, validadores e caching | [PLANO_CODE_REVIEW_ONDA_3.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_3.md) |
> | 🎨 Onda 4 | Fatiamento de God Components, biblioteca de átomos e modo escuro | [PLANO_CODE_REVIEW_ONDA_4.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_4.md) |
> | 🧹 Onda 5 | Desacoplamentos, Logger por ambiente, Acessibilidade e summaries | [PLANO_CODE_REVIEW_ONDA_5.md](CODE_REVIEWS/PLANO_CODE_REVIEW_ONDA_5.md) |
>
> Todos os achados-chave foram **verificados contra o código-fonte** antes da consolidação (seções "§x.0 Verificação"
> de cada reporte). Divergências encontradas mudaram o plano — não há item planejado "no escuro".

---

## 1. Visão Geral: A Triangulação (agora quadrangulação)

```
┌──────────────────────────────────────────────────────────────────┐
│  SEGURANÇA (🔴 crítica — manda no calendário):                   │
│  firestore.rules inexistente no repo · sessão ~30h · authz       │
│  client-only  →  ONDA 0: nada de deploy antes do perímetro       │
│                                                                  │
│  ESTRUTURA: God Components/Provider, duplicação 4–6×,            │
│  2 bugs funcionais  →  bugs na ONDA 1; refactors só com testes   │
│                                                                  │
│  PERFORMANCE: bundle monolítico, full-collection scans,          │
│  cascata de re-render, I/O O(N)  →  quick wins na ONDA 1;        │
│  paginação depois do factory (não migrar services 2×)            │
│                                                                  │
│  UI/UX: 0 tema · 104 hex · 4 paletas · KPI morto · sem estados   │
│  →  quick fixes na ONDA 1; tema na ONDA 2; migração depois       │
└──────────────────────────────────────────────────────────────────┘
```

**Regras do plano diretor:**
1. **Dono único** — item compartilhado entre trilhas é implementado **uma vez**, pela trilha dona (§3). As demais apenas referenciam/validam.
2. **Segurança manda** — a Onda 0 (perímetro Firestore) bloqueia qualquer novo deploy de produção e não depende de nada.
3. **Bug antes de refactor; teste antes de estrutura; fundação antes de migração** — princípios herdados dos planos por trilha.
4. **Refactor não desfaz correção** — toda refatoração estrutural tem como requisito preservar as correções de segurança/performance aplicadas antes dela (ex.: EST F2.1 preserva SEG S1.1/S1.2 e PERF P0.3).

---

## 2. Roadmap Global por Ondas

> Nomenclatura: `EST Fx.y` · `SEG Sx.y` · `PERF Px.y` · `UI Ux.y` — itens detalhados nos planos de execução.

### 🚨 Onda 0 — Perímetro de segurança (IMEDIATO; bloqueia deploy de produção)
| Item | O quê | Por quê primeiro |
|---|---|---|
| **SEG S0.1** | `firestore.rules` deny-by-default + allowlist `staff` + `firebase.json` + CI | Única fronteira real; hoje regras nem existem no repo |
| **SEG S0.2** | Neutralizar signup aberto (allowlist/console) | Auto-cadastro não pode dar acesso a dados |
| **SEG S0.3** | Timer de logout 2h + `clearTimeout` (resolve PERF-15) | Sessão hoje dura ~30h por bug literal |
| **SEG S0.4** | Corrigir aliases do `.firebaserc` | Deploy manual pode publicar no ambiente errado |

### 🔧 Onda 1 — Correções funcionais & quick wins (paralelizável por trilha) — ✅ Concluída no código (2026-07-11; ⚠️ ressalva P0.3)
| Trilha | Itens | Destaques |
|---|---|---|
| EST F0 | F0.1–F0.7 | Bug do modal de exclusão (A-01), filtro em centavos (A-04), fim do `reload()` (A-03), **memoizar `value`** (A-07 = PERF-T04 = UI-28), código morto, `.gitignore` |
| SEG S1 | S1.1–S1.4 | Validação no `updateBudget`, sanitizar ID de URL, **feedback de erro no Login**, persistência única |
| PERF P0 | P0.0–P0.3 | Baseline de medição, deps mortas, **code-splitting + drop console**, `getRecentBudgets(5)` |
| UI U0 | U0.1–U0.4 | **KPI "Valor Total" real** (= PERF-T12), bug responsivo <500px, `lang="pt-BR"` + fonte real, código morto de UI |

### 🧱 Onda 2 — Fundações (desbloqueiam tudo o que vem depois) — ✅ Concluída no código (2026-07-11; ⚠️ gate de CI no deploy pendente de decisão)
| Trilha | Itens | Desbloqueia | Status |
|---|---|---|---|
| EST F1 | Vitest + RTL + characterization tests | EST F2/F3, regressões de todas as trilhas | ✅ 33 testes verdes |
| UI U1 | Tokens + `getTheme(mode)` + `ThemeProvider`/`CssBaseline`; aposentar `index.css` | UI U2/U3, tokenização dos modais | ✅ tema light/dark + `index.css` aposentado |
| SEG S3.1 | Testes de `firestore.rules` no emulador + CI | Governança contínua do perímetro | ✅ 12 testes no emulador + `ci.yaml` aditivo (⚠️ gate no `deploy.yaml` = decisão do usuário) |

### 🏗️ Onda 3 — Desduplicação estrutural & dados (exige Onda 2/EST F1) — ✅ Concluída no código (2026-07-11; ⚠️ ressalva P1.2)
| Trilha | Itens | Status |
|---|---|---|
| EST F2 | F2.1 factory de services (**incorpora SEG S2.1 — criação atômica**; preserva S1.1/S1.2 e `getRecentBudgets`), F2.2 store factory no `DataContext`, F2.3 `modalStyles.ts` centralizado | ✅ services ~750→~400 linhas; `DataContext` 454→~300; 4 modais idênticos unificados |
| PERF P1 | P1.1 modal único (após EST F0.1), P1.3 `localStorage` por chave, P1.4 debounce na `GlobalSearch`, P1.2 paginação (após EST F2.1/F2.2) | ✅ P1.1/P1.3/P1.4 · 🟡 P1.2 (capacidade `getBudgetsPage` pronta; rewire do boot deferido = mesmo bloqueio de P0.3) |
| SEG S2.2 | Validadores CNPJ/CPF + integração nos forms | ✅ `validators.ts` (módulo-11) + guard no `validateClient` + mensagem nos modais de Cliente |

### 🎨 Onda 4 — God Components & UI moderna (exige Ondas 2–3) — 🟨 Em andamento (2026-07-11)
| Trilha | Itens | Status |
|---|---|---|
| EST F3 | F3.1 fatiar `BudgetFormPage`, F3.2 fatiar `Budgets` (+ mapa de ordenação), F3.3 `EntityForm` Create/Edit | ✅ **Concluída** — 501/498 linhas → 185/104; `EntityForm` por entidade consumindo os átomos de U2.1 |
| UI U2 | U2.1 biblioteca atômica `src/ui` (**absorve EST F4.7**), U2.2 varredura hex/sx → tokens, U2.3 estados, U2.4 responsividade | ✅ U2.1 (`src/ui` + 6 modais + `DataTable`; `modalStyles.ts` removido) · ✅ U2.2 (telas principais + chrome; hex **113→43**, `--ads-*` no `Budgets.css`) · 🟡 U2.3/U2.4 |
| UI U3.1/U3.2 | Dashboard hero KPI + gráficos (`@mui/x-charts` lazy) + dark mode toggle | ✅ **U3.2** (toggle real via `ColorModeContext` + persistência) · 🟡 **U3.1** (dashboard/charts) |

### 🧹 Onda 5 — Refino, governança & longo prazo
| Trilha | Itens |
|---|---|
| EST F4 | F4.1 hook sem `Swal`, F4.2 configs, **F4.3 rota React de PDF (2 call sites; resolve SEG-12/UI-33)**, F4.4 `@deprecated`, **F4.5 logger (resolve SEG-11/PERF-12)**, F4.6 ADR de denormalização |
| UI U3.3–U3.6 | WCAG AA, confirm tokenizado (coord. EST F4.1), lint `no-color-literals`, Storybook (opcional) |
| PERF P2 | P2.1 "budget summary" (**após ADR EST F4.6**), P2.2 contextos por entidade (reavaliar após EST F2.2) |

---

## 3. Matriz de Dono Único (anti-overlap)

> A regra que impede dois checklists de alterarem o mesmo código. Antes de implementar qualquer item, confira aqui.

| Problema (mesmo código) | Aparece em | **Dono único** | Papel das demais trilhas |
|---|---|---|---|
| `DataContext.value` sem memo | EST A-07 · PERF-06/T04 · UI-28 | **EST F0.5** | PERF valida re-render; UI referencia |
| `window.location.reload()` pós-criação | EST A-03 · PERF-14/T08 | **EST F0.3** | PERF valida fim do cold-load extra |
| Timer de logout ~30h + leak | SEG-03 · PERF-15/T13 | **SEG S0.3** | PERF referencia |
| Bug do modal de exclusão (cancelar remove) | EST A-01 | **EST F0.1** (contrato `onDeleted`) | Pré-requisito de PERF P1.1 |
| N `DeleteBudgetModal` montados | PERF-09/T05 | **PERF P1.1** (após EST F0.1) | EST F3.2 parte deste estado |
| 83 `console.*` em produção | EST §1 · SEG-11 · PERF-12/T11 | **EST F4.5** (logger) + **PERF P0.2** (`esbuild.drop`) | Complementares, não duplicados |
| ~~PDF via `document.write`+`ReactDOM.render` (2 call sites)~~ ✅ **Resolvido 2026-07-10** | EST A-02 · SEG-12 · UI-33 | **EST F4.3** — `openBudgetPdf()` (Blob) nos 2 call sites | SEG/UI resolvidos |
| Styled-components duplicados nos 6 modais | EST D-01 · UI-07/13 | **EST F2.3** (centralizar já) → **UI U2.1** (tokenizar; absorve EST F4.7) | Sequência, não duplicação |
| Criação não-atômica (contador + doc) | SEG-05 | **EST F2.1** implementa · **SEG S2.1** especifica/valida | — |
| Validação no `updateBudget` / sanitizar ID | SEG-06/07 | **SEG S1.1/S1.2** (antes do factory) | EST F2.1 **preserva** |
| KPI morto + cálculo morto em `kpiData` | UI-18/19 · PERF-10/T12 | **UI U0.1** — ✅ **Resolvido** (card removido 2026-07-10; `totalValue`/`maxBudget` + `brMoneyMask` mortos removidos 2026-07-11) | PERF referencia |
| Dashboard lê N para mostrar 5 | PERF-03/T03 · PERF-07/T10 · UI-30 | **PERF P0.3** (absorve T10 — sort O(N) morre) | UI referencia |
| Zero code-splitting/lazy | PERF-01/T01 · UI-32/35 | **PERF P0.2** | UI coordena chunk dos charts (U3.1) |
| Login engole erro / duplo submit | SEG-10 · UI-23/26 | **SEG S1.3** (comportamento) | UI U2.2/U2.3 só re-estiliza |
| Lista sem paginação/virtualização | PERF-02/T06 · UI-34 | **PERF P1.2** (após EST F2) | UI referencia |
| Denormalização de `IBudget` | EST A-05 · PERF-13/T14 | **EST F4.6** (ADR) → **PERF P2.1** (implementação) | Sequência |
| God Components | EST E-01/E-02 · UI-04 | **EST F3** | UI referencia |
| Split de contexto por entidade | PERF-T15 | **EST F2.2** entrega a base; **PERF P2.2** reavalia com profiling | — |

---

## 4. Cadeia de Dependências Global

```
ONDA 0  SEG S0 (perímetro) ─── independente, IMEDIATO
ONDA 1  EST F0 ─┬─► desbloqueia PERF P1.1 (F0.1) e valida PERF (F0.3/F0.5)
        SEG S1 ─┤   (S1.1/S1.2 antes do factory — EST F2.1 preserva)
        PERF P0 ─┤  (P0.3 cria getRecentBudgets — EST F2.1 preserva)
        UI  U0 ──┘  (independente de tema)
ONDA 2  EST F1 (testes) ──► pré-requisito de EST F2/F3
        UI  U1 (tema)  ──► pré-requisito de UI U2/U3 e da tokenização dos modais
        SEG S3.1 (testes de regras) ──► governança contínua
ONDA 3  EST F2 (factory[+SEG S2.1] · store · modalStyles) ──► PERF P1.2 · UI U2.1 · EST F3
        PERF P1 · SEG S2.2
ONDA 4  EST F3 (fatiar) ⇄ UI U2 (átomos/tokens) — F3.3 consome src/ui se existir
        UI U3.1/U3.2 (dashboard/dark mode)
ONDA 5  EST F4 (refino) ──► F4.6 (ADR) desbloqueia PERF P2.1 · F4.1 coordena UI U3.4
        UI U3.3–U3.6 · PERF P2
```

---

## 5. Métricas de Sucesso Consolidadas

| Métrica | Atual (verificado) | Alvo | Trilha/Onda |
|---|---|---|---|
| Regras Firestore versionadas + testadas | ❌ inexistentes no repo | ✅ deny-by-default + testes no CI | SEG · Onda 0/2 |
| Duração real da sessão | ~30 h (bug) | 2 h | SEG · Onda 0 |
| Bugs funcionais (A-01, A-04, UI-24, KPI morto) | ✅ **0** (corrigidos na Onda 1) | 0 | EST/UI · Onda 1 ✅ |
| Bundle inicial (gzip) | ✅ **Login ~302 kB gzip (era 1.123 kB, −73%)**; PDF/DataGrid/NCM em chunks lazy | PDF/DataGrid/charts lazy (~-40%) | PERF · Onda 1 ✅ (meta superada) |
| Reads da home (widget recentes) | N docs (primitivo `getRecentBudgets(5)` pronto; rewire ⛔ depende de U3.1/P2.1) | 5 docs | PERF · Onda 1 🟡 → 4 |
| Re-render por mudança de entidade | ✅ `value` memoizado (F0.5); split por entidade fica p/ F2.2 | local | EST F0.5/F2.2 · Ondas 1/3 |
| Camada de services | ✅ **~400 linhas (factory + 4 configs), add atômico** (era ~750, 4× repetida, não-atômico) | ~250 linhas, factory, add atômico | EST+SEG · Onda 3 ✅ |
| I/O de cache por CRUD | ✅ **1 coleção (chave por coleção — P1.3)** (era: re-serializa as 4) | 1 coleção | PERF · Onda 3 ✅ |
| `ThemeProvider`/tokens | ✅ **tema light/dark + biblioteca atômica `src/ui`** (U2.1); hex **113 → 43** (U2.2) — restante é fonte do tema/Login/categóricas/PDF; **dark mode ativo** (U3.2) | 1 tema light/dark · hex ≈ 0 fora de `tokens.ts` | UI · Ondas 2 ✅ / 4 ✅ (U2.1/U2.2/U3.2) |
| `console.*` em produção | 🟡 **drop no build de prod já ativo** (P0.2 — 0 `console.*` nos chunks); logger por env (F4.5) ainda pendente p/ dev | 0 (logger + drop) | EST+PERF · Ondas 1/5 |
| Suíte de testes | ✅ **61 testes** (49 unit/characterization jsdom + 12 rules no emulador) | unit + characterization + rules | EST F1 + SEG S3.1 · Ondas 2–3 ✅ |
| God Components | ✅ **`BudgetFormPage` 493→185 · `Budgets` 484→104** (orquestração + peças testáveis); `EntityForm` Create/Edit unificado (F3.3) | < ~200 (orquestração) | EST F3 · Onda 4 ✅ |

---

## 6. Governança da Execução

1. **Antes de implementar qualquer item:** conferir a Matriz de Dono Único (§3) e o plano de execução da trilha dona.
2. **Ao concluir qualquer item:** marcar o checklist na trilha dona **e** registrar no **Log de Execução** do respectivo `PLANO_EXECUCAO_*.md` (o quê + por quê + verificação/medição). Itens que resolvem achados de outras trilhas (ex.: EST F4.3 → SEG-12/UI-33) devem ser anotados como resolvidos **nas duas** pontas.
3. **Portões:** `npm run build` + `npm run lint --max-warnings 0` sempre; `npm run test` a partir da Onda 2; testes de regras no CI a partir da Onda 2.
4. **Deploy de produção:** congelado até a conclusão da **Onda 0** (SEG S0).
5. **Revisão deste plano diretor:** ao final de cada onda — atualizar status, reavaliar itens opcionais (PERF P2.2, UI U3.6) e registrar desvios.

---

## 7. Registro de Consolidação

- **2026-07-09 — Plano diretor criado.** As 4 auditorias (Estrutura, Segurança, Performance, UI/UX) tiveram seus reportes convertidos de "diagnóstico + sugestões" para "diagnóstico + plano consolidado", cada uma com seu `PLANO_EXECUCAO_*.md` (fases, checklists, aceites e log). Todos os achados-chave foram verificados contra o código-fonte; correções de premissa relevantes: inexistência de `ThemeProvider` (mudou o plano de tokens), subcomponentes de orçamento já extraídos (reduziu escopo de EST F3.1), duplicação do PDF legado em `RecentBudgets.tsx` (ampliou EST F4.3), CI usando `--project=<id>` direto (recalibrou o risco de SEG-09). A matriz de dono único (§3) elimina os overlaps que existiam entre os backlogs originais (memoização, reload, timer, console, PDF, modais, Login, KPI, paginação, denormalização). **Nenhum código de produção foi alterado na consolidação.**
- **2026-07-10 — Execução (branch `refatoracao-auditorias`).** Onda 0 + Onda 1/Segurança implementadas no código (S0.1/S0.3/S0.4 + S1.1–S1.4). Depois, mudanças ad-hoc trazidas da `main` foram reconciliadas com o roadmap: **EST F4.3 / SEG-12 / UI-33** (PDF legado) resolvidos via `openBudgetPdf()` (Blob, nos 2 call sites) — fora da ordem planejada e como função compartilhada em vez de rota React; **UI-18** resolvido por remoção do card "Valor Total" (diverge do plano de exibir o valor), deixando **PERF-10/T12** (`totalValue`/`maxBudget` mortos em `kpiData`) como limpeza pendente; `ProductTable` ganhou paginação local + sort numérico (não substitui **PERF P1.2**). `npm run build` verde.
- **2026-07-11 (parte 2) — Onda 1 fechada: PERF P0.** Deps mortas removidas (`uuid`/`react-pdf`/`react-firebase-hooks`/`dayjs`/`dotenv`, 13 pacotes); code-splitting via `manualChunks` (vendor-react/mui/mui-x/firebase/pdf) + `React.lazy` nas 6 rotas + `Suspense`; `esbuild.drop` de `console`/`debugger` só em prod. **Resultado:** bundle crítico do Login **5.783 kB → ~1.096 kB** (gzip **1.123 → ~302 kB, ≈ −73%**); @react-pdf, DataGrid e `tabela_ncm.json` fora do caminho do Login; **0 `console.*`** em prod. **P0.3:** primitivo `getRecentBudgets(5)` (indexado) entregue; rewire do widget **deferido** — a Home ainda lê N para os KPIs, então "ler 5 e não N" é inatingível até U3.1/P2.1 (documentado). Build + `tsc` verdes; lint nos mesmos 10 pré-existentes. **Onda 1 concluída no código** → próximo é a Onda 2 (fundações: testes + tema + testes de regras).
- **2026-07-11 — Onda 0 encerrada (Console) + Onda 1 avança (EST F0 · UI U0).** (1) **Onda 0 concluída de ponta a ponta:** `staff/{uid}` provisionado (2 dev + 2 prod, via API REST) e `firestore.rules` publicadas em dev→prod; deny-by-default validado (403 sem auth) nos dois projetos; S0.2 encerrado (conta-fantasma = risco residual aceito). Detalhes em `PLANO_EXECUCAO_SEGURANCA.md` (2026-07-11). (2) **EST F0 (F0.1–F0.7) concluída:** bugs A-01 (modal exclusão), A-04 (filtro em centavos), A-03 (`reload`→`reset`), A-06 (null-safety), A-07/PERF-06 (memo do `value`), M-01 (`Sidebar.old`), M-03 (`.gitignore`) + limpeza do código morto que travava o lint. (3) **UI U0 (U0.1–U0.4) concluída:** `kpiData` morto removido (fecha **PERF-10/T12**), bug responsivo <500px, `lang="pt-BR"`+Poppins+globais do `index.css`, `SectionCard`/`handleEdit` mortos. Cross-refs fechados nas duas pontas (**PERF-T04/T08/T12**). `npm run build` + `npx tsc --noEmit` verdes; lint global reduzido a 10 problemas pré-existentes de type-safety/arquitetura (donos: UI U2.1/PageHeader, EST F2.2/F3.3, SEG). **Nenhuma ação de infra/deploy nesta rodada.**

- **2026-07-11 (parte 4) — Onda 2 concluída no código: Fundações (EST F1 · UI U1 · SEG S3.1).** (1) **EST F1:** Vitest + RTL + jsdom configurados (`vite.config.ts` com bloco `test`, `src/test/setup.ts`; `tsconfig` exclui testes do build; `.eslintrc` com globals do Vitest) + **29 characterization tests** em 5 arquivos travando o comportamento atual antes de F2/F3 — `cacheService` (TTL/mutations/localStorage), `useBudgetForm` (total com `customUnitValue`, `sectionValidation`, reset, filtro debounced) e **regressões de F0.1** (`DeleteBudgetModal`: cancelar≠excluir) e **F0.2** (filtro em centavos). (2) **UI U1:** `src/theme/{tokens,index,ColorModeContext}` com `getTheme(mode)` light/dark tokenizado + wiring em `src/Root.tsx` (`ThemeProvider`+`CssBaseline`+`ColorModeContext`); `index.css` **aposentado** (reset migrado para `MuiCssBaseline`) — sem regressão (o `body` bg nunca era visível); +4 testes de `getTheme`. (3) **SEG S3.1:** `@firebase/rules-unit-testing` + **12 testes das `firestore.rules` no emulador** (deny-by-default, allowlist `staff`, integridade de `budgets`, proteção de `staff`) espelhando o arquivo **publicado**; workflow `ci.yaml` **aditivo** (lint+unit+rules em push/PR) sem tocar o `deploy.yaml`. **Portões:** `npm run build` verde; `lint` nos mesmos 10 problemas pré-existentes; **45 testes verdes** (33 jsdom + 12 emulador). **Desvio de fonte:** tema usa Poppins (carregada) e não Inter. **⚠️ Pendência (decisão do usuário):** para o CI **bloquear** o deploy de fato falta ou `needs: ci` no `deploy.yaml` (arquivo sensível — SEG-09-rev) ou branch protection exigindo o check `ci`.

- **2026-07-11 (parte 5) — Onda 3 concluída no código: Desduplicação estrutural & dados (EST F2 · PERF P1 · SEG S2).** (1) **EST F2:** factory `createCrudService` (`getAll/getById/getNextId/add/update/remove/getPage`) com `add` **atômico** (fecha SEG S2.1); 4 services viraram config + wrappers preservando a API pública (incl. `updateBudget(id,budget)`, `idPattern ^\d+$` de S1.2, `getRecentBudgets` de P0.3); `removeUndefinedFields` unificado; timestamp padronizado em `Timestamp.now()`. `useEntityStore` (hook) recompõe o `DataContext` (sumiram 12 handlers + 4 buscas + `fetchWithCache`; `value` memoizado com deps granulares preservando F0.5). `modalStyles.ts` compartilhado nos 4 modais idênticos (os 2 de Produto ficaram por terem estilo divergente — verificado no código). (2) **SEG S2:** S2.1 validada por teste de atomicidade; S2.2 `validators.ts` (CNPJ/CPF módulo-11) + guard no `validateClient` + mensagem nos modais de Cliente. (3) **PERF P1:** P1.1 modal único fora do `.map`; P1.3 `localStorage` por chave + `QuotaExceededError` + migração do blob legado; P1.4 debounce na `GlobalSearch`. **P1.2 🟡:** capacidade `getBudgetsPage` (cursor) pronta e testada, mas o **rewire do boot ficou deferido** — mesmo bloqueio de P0.3 (a `Home` lê a coleção inteira para os KPIs; paginar quebraria KPIs/busca/filtros até U3.1/P2.1). **Portões:** `npm run build` verde; lint nos mesmos 10 pré-existentes (0 novos); **61 testes verdes** (49 jsdom + 12 regras). **Nenhuma ação de infra/deploy.**

- **2026-07-11 (parte 6) — Onda 4 avança: God Components + biblioteca atômica + hex→tokens + dark mode (EST F3 · UI U2.1/U2.2 · U3.2).** (1) **EST F3 concluída:** `BudgetFormPage` **493→185** linhas (seções `RepresentativeSection`/`ProductsSection`/`TermsSection` + `EntityInfoCard` + `BudgetFormActions` + hook `useBudgetActions`); `Budgets` **484→104** linhas (`useBudgetFilters` + `budgetComparators` mapa que mata o `switch`/S-02 + `BudgetListItem` + `BudgetFilters`); **F3.3** `EntityForm` por entidade (`Forms/{Client,Representative,Product}Form`) — fim do espelhamento Create/Edit (máscaras reconciliadas: Edit passa a mascarar como o Create, idempotente). (2) **UI U2.1:** biblioteca atômica `src/ui` (`Button`/`Field`/`Modal`/`Card`/`StatCard`/`EmptyState`/`ErrorState`/`Skeletons`/`Feedback`/`DataTable`); os **6 modais CRUD** migrados para os átomos, `modalStyles.ts` **removido** (fecha EST F4.7); `CustomTable`→wrapper de `DataTable` tipado (mata 3 erros de `any` no lint: **10→7**). (3) **UI U2.2:** hex **113→43** — dashboard + chrome autenticado (header/sidebar) tokenizados; `Budgets.css` via variáveis CSS `--ads-*` publicadas por `getTheme` (adaptam ao modo); restante são hex legítimos (fonte do tema, Login/gradiente, categóricas, PDF). (4) **UI U3.2:** dark mode toggle **religado** ao `ColorModeContext` real (o do `UserMenu` usava o morto `LayoutContext.darkMode`) + persistência em `localStorage`; `LayoutContext.darkMode` removido. **Portões:** `tsc`+`build` verdes; **lint 7** (0 novos); **49 testes jsdom verdes**. **Nenhuma ação de infra/deploy.** ⚠️ **Smoke visual manual recomendado** (light **e** dark) — não verificável headless. **Pendências da Onda 4:** U2.3 (estados loading/empty/error com os átomos), U2.4 (responsividade), **U3.1** (dashboard hero KPI + gráficos `@mui/x-charts` lazy).

---

**Status geral:** 🟢 **Ondas 0–3 concluídas** + **Onda 4 majoritariamente feita** (2026-07-11): ✅ EST F3 (God Components fatiados), ✅ UI U2.1 (biblioteca atômica + 6 modais + `DataTable`), ✅ UI U2.2 (hex **113→43**, chrome/dashboard/Budgets tokenizados), ✅ UI U3.2 (dark mode toggle real + persistência). **Lint 10→7** (3 erros de `any` mortos). **49 testes jsdom verdes** (+12 emulador). Faltam da Onda 4: **U2.3** (estados), **U2.4** (responsividade), **U3.1** (dashboard hero + charts); Onda 5 pendente.
**Próximo passo:** **U3.1 — Dashboard hero KPI + gráficos** (`@mui/x-charts` via `React.lazy`, coordenar chunk com PERF P0.2; usa `StatCard` com `highlight` já pronto) — é o item que também **destrava o rewire de `RecentBudgets` + paginação do boot (P1.2/P0.3)**, tirando a dependência da coleção inteira na Home. Depois **U2.3** (loading/empty/error com os átomos `Skeletons`/`EmptyState`/`ErrorState` já criados) e **U2.4** (responsividade dos KPIs `md=4` + altura fluida do `DataTable`). **Pendências carregadas:** `tabela_ncm.json` sob demanda (PERF futuro); gate de CI no deploy (decisão do usuário); tokenizar gradiente do Login + cores categóricas do search (fim do U2.2); regra `no-color-literals` (U3.5).

> **Deploy de produção:** perímetro **ativo** (regras publicadas), mas atenção ao achado **SEG-09-rev** — `deploy.yaml` tem as branches cruzadas com os ambientes reais; não fazer push para `development`/`main` sem alinhar com o usuário (ver `PLANO_EXECUCAO_SEGURANCA.md`).
>
> **Lint global (7 problemas restantes; era 10):** a Onda 4 matou os 3 erros de `no-explicit-any` (CustomTable×2 → wrapper tipado de `DataTable` em U2.1; EditClientModal → reescrito em F3.3). Restam 2 erros — `ban-types {}` (PageHeader→UI) e `no-explicit-any` (ContextAuth→SEG) — e 5 warnings `react-refresh`/`exhaustive-deps` (DataContext, ContextAuth, LayoutContext, BudgetPdf; arquiteturais/SEG). O gate `--max-warnings 0` só fica verde quando esses donos rodarem.

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

### 🔧 Onda 1 — Correções funcionais & quick wins (paralelizável por trilha)
| Trilha | Itens | Destaques |
|---|---|---|
| EST F0 | F0.1–F0.7 | Bug do modal de exclusão (A-01), filtro em centavos (A-04), fim do `reload()` (A-03), **memoizar `value`** (A-07 = PERF-T04 = UI-28), código morto, `.gitignore` |
| SEG S1 | S1.1–S1.4 | Validação no `updateBudget`, sanitizar ID de URL, **feedback de erro no Login**, persistência única |
| PERF P0 | P0.0–P0.3 | Baseline de medição, deps mortas, **code-splitting + drop console**, `getRecentBudgets(5)` |
| UI U0 | U0.1–U0.4 | **KPI "Valor Total" real** (= PERF-T12), bug responsivo <500px, `lang="pt-BR"` + fonte real, código morto de UI |

### 🧱 Onda 2 — Fundações (desbloqueiam tudo o que vem depois)
| Trilha | Itens | Desbloqueia |
|---|---|---|
| EST F1 | Vitest + RTL + characterization tests | EST F2/F3, regressões de todas as trilhas |
| UI U1 | Tokens + `getTheme(mode)` + `ThemeProvider`/`CssBaseline`; aposentar `index.css` | UI U2/U3, tokenização dos modais |
| SEG S3.1 | Testes de `firestore.rules` no emulador + CI | Governança contínua do perímetro |

### 🏗️ Onda 3 — Desduplicação estrutural & dados (exige Onda 2/EST F1)
| Trilha | Itens | Observações de coesão |
|---|---|---|
| EST F2 | F2.1 factory de services (**incorpora SEG S2.1 — criação atômica**; preserva S1.1/S1.2 e `getRecentBudgets`), F2.2 store factory no `DataContext`, F2.3 `modalStyles.ts` centralizado | SEG valida a atomicidade |
| PERF P1 | P1.1 modal único (**após EST F0.1**), P1.3 `localStorage` por chave, P1.4 debounce na `GlobalSearch`, P1.2 paginação (**após EST F2.1/F2.2**) | Paginação por último para migrar services 1× só |
| SEG S2.2 | Validadores CNPJ/CPF + integração nos forms | Usa infra de testes de EST F1 |

### 🎨 Onda 4 — God Components & UI moderna (exige Ondas 2–3)
| Trilha | Itens | Observações de coesão |
|---|---|---|
| EST F3 | F3.1 fatiar `BudgetFormPage`, F3.2 fatiar `Budgets` (+ mapa de ordenação), F3.3 `EntityForm` Create/Edit | F3.3 consome os átomos de UI U2.1 se já existirem |
| UI U2 | U2.1 biblioteca atômica `src/ui` (**absorve EST F4.7** — tokenização dos modais), U2.2 varredura hex/sx → tokens, U2.3 estados padronizados, U2.4 responsividade | U2.1 parte do `modalStyles.ts` de EST F2.3 |
| UI U3.1/U3.2 | Dashboard com hero KPI + gráficos (`@mui/x-charts` lazy) + dark mode toggle | Chunks coordenados com PERF P0.2 |

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
| PDF via `document.write`+`ReactDOM.render` (2 call sites) | EST A-02 · SEG-12 · UI-33 | **EST F4.3** (`Budgets.tsx` **e** `RecentBudgets.tsx`) | SEG/UI marcam resolvido |
| Styled-components duplicados nos 6 modais | EST D-01 · UI-07/13 | **EST F2.3** (centralizar já) → **UI U2.1** (tokenizar; absorve EST F4.7) | Sequência, não duplicação |
| Criação não-atômica (contador + doc) | SEG-05 | **EST F2.1** implementa · **SEG S2.1** especifica/valida | — |
| Validação no `updateBudget` / sanitizar ID | SEG-06/07 | **SEG S1.1/S1.2** (antes do factory) | EST F2.1 **preserva** |
| KPI morto + cálculo morto em `kpiData` | UI-18/19 · PERF-10/T12 | **UI U0.1** (exibir resolve; remover `maxBudget` se sem uso) | PERF referencia |
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
| Bugs funcionais (A-01, A-04, UI-24, KPI morto) | 4 abertos | 0 | EST/UI · Onda 1 |
| Bundle inicial (gzip) | monolítico (PDF incluso) | PDF/DataGrid/charts em chunks lazy (~-40%) | PERF · Onda 1 |
| Reads da home (widget recentes) | N docs | 5 docs | PERF · Onda 1 |
| Re-render por mudança de entidade | global (8 comunidades) | local | EST F0.5/F2.2 · Ondas 1/3 |
| Camada de services | ~750 linhas, 4× repetida, add não-atômico | ~250 linhas, factory, **add atômico** | EST+SEG · Onda 3 |
| I/O de cache por CRUD | re-serializa 4 coleções | 1 coleção | PERF · Onda 3 |
| `ThemeProvider`/tokens | 0 tema · 104 hex · 4 paletas | 1 tema light/dark · hex ≈ 0 fora de `tokens.ts` | UI · Ondas 2/4 |
| `console.*` em produção | 83 / 27 arquivos | 0 (logger + drop) | EST+PERF · Ondas 1/5 |
| Suíte de testes | inexistente | unit + characterization + rules | EST F1 + SEG S3.1 · Onda 2 |
| God Components | 501/498/421 linhas | < ~200 (orquestração) | EST F3 · Onda 4 |

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

---

**Status geral:** 🟡 Onda 0 + Onda 1/Segurança **executadas no código** (2026-07-10) · demais itens das Ondas 1–5 pendentes
**Próximo passo:** concluir as **ações de Console/deploy da Onda 0** (provisionar `staff/{uid}` **antes** de publicar, publicar `firestore.rules` dev→prod, desabilitar signup) — só então o deploy de produção deixa de estar congelado. Detalhes e log: [PLANO_EXECUCAO_SEGURANCA.md](SEGURANCA/PLANO_EXECUCAO_SEGURANCA.md) (entrada 2026-07-10).

> **Execução 2026-07-10 (código):** SEG S0.1 (rules + `firebase.json`), S0.3 (timer 2h + `clearTimeout` — resolve PERF-15), S0.4 (`.firebaserc`), e Onda 1 de Segurança S1.1–S1.4. `npm run build` verde; sem lint novo. **Ações de Console pendentes** listadas acima. As correções de código estão prontas mas o **perímetro só fica ativo após publicar as regras** — deploy de produção segue congelado até lá.

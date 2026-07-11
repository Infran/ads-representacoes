# PLANO_EXECUCAO_UI_UX.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + MUI 5 + Firebase)
**Origem:** consolida o §5 de [`REPORTE_UI_UX.md`](./REPORTE_UI_UX.md) (specs técnicas nos §3/§4 do reporte)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-11

---

## Como usar este documento

- Cada fase tem **checklist** com passos por arquivo e **critério de aceite**. Marque `[x]` ao concluir.
- **U1 (tema) é o desbloqueador**: nenhuma migração hex→tokens antes dele. U0 não depende de nada — pode começar já.
- Itens **[REF]** têm dono em outra trilha (EST/SEG/PERF) — aqui não se implementa, só se consome o resultado.
- Ao concluir qualquer item, **registre no §Log de Execução**: o quê e **por quê** (inclua screenshot/medição quando visual).

### Portões de qualidade
- [ ] `npm run build` + `npm run lint` verdes; (quando EST F1 existir) `npm run test` verde
- [ ] Sem novo hex hardcoded fora de `src/theme/tokens.ts` (a partir de U1)
- [ ] Texto de UI em pt-BR (convenção do projeto)

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **U0** | Quick fixes independentes de tema | 4 | ✅ Concluído (2026-07-11) |
| **U1** | Fundação: tokens + tema + baseline | 2 | ✅ Concluído (2026-07-11) |
| **U2** | Biblioteca atômica + consolidação | 4 | ⬜ Pendente (⛔ U1; modais ⛔ EST F2.3) |
| **U3** | Dashboard moderna, dark mode & governança | 6 | ⬜ Pendente (⛔ U1/U2) |

### Grafo de dependências
```
U0 (quick fixes) ──────────────────────────────┐
U1 (tokens+tema) ──► U2 (átomos + varredura) ──► U3 (dashboard, dark mode, WCAG, lint)
EST F2.3 (modalStyles centralizado) ──► U2.1 (átomos absorvem e tokenizam = antigo EST F4.7)
PERF P0.2 (lazy/chunks) ◄─ coordenação ─ U3.1 (charts lazy)
SEG S1.3 (Login: comportamento) ──► U2.3 (Login: só visual)
```

---

## Fase U0 — Quick fixes (não dependem de tema)

### U0.1 — KPI "Valor Total" (UI-18/UI-19; resolve PERF-10) ✅ (2026-07-11)
**Decisão de produto (2026-07-10):** em vez de exibir o valor, o card `R$ ---,--` "(Em desenvolvimento)" foi **removido** do `Home.tsx` (grid rebalanceado `md=3`→`md=4`). Isso resolve o achado UI-18 (placeholder morto na cara do usuário), mas **inverte** o plano original (que era exibir o valor real).
- [x] Placeholder "(Em desenvolvimento)" fora da tela do usuário — card removido.
- [x] **PERF-10/T12 resolvido (2026-07-11):** removidos os reduces O(N) `kpiData.totalValue` **e** `kpiData.maxBudget` (calculados e sem consumidor) e o import morto `brMoneyMask` de `Home.tsx`.
- [ ] Se voltarem a querer exibir "Valor Total", vira feature nova → melhor entregar como **hero KPI em U3.1** (não como card simples).
- **Aceite (revisado):** dashboard sem placeholder ✔; cálculos O(N) sem consumidor eliminados de `kpiData` ✔. **PERF-10/T12 marcado como resolvido** na trilha PERF.

### U0.2 — Bug responsivo dos filtros (UI-24) ✅ (2026-07-11)
Verificado: `Budgets.css` — `.search-input,.filter-select { min-width: 500px }` dentro de `@media (max-width: 900px)`.
- [x] Trocado para `min-width: 0`, mantendo `width: 100%`.
- **Aceite:** sem scroll horizontal em viewport <500px; filtros usáveis no mobile. ✔ (verificado por leitura da regra; smoke visual recomendado)

### U0.3 — `lang`, fonte real e globais corrigidos (UI-17; UI-11 parcial) ✅ (2026-07-11)
Verificado: `index.html` com `lang="en"` e sem fonte; `index.css` com `--font-primary:#fff` e `body{color:#fff}` sobre fundo claro.
- [x] `index.html`: `lang="pt-BR"`; **Poppins** carregada via `<link>` (preconnect googleapis/gstatic + stylesheet `Poppins:wght@400;500;600;700`) — é a fonte que o `index.css` já declarava e que antes caía em fallback.
- [x] `index.css`: `--font-primary` passou de `#fff` (cor) para `'Poppins', sans-serif` (família real) e o `body` agora usa `var(--font-primary)`; `body{color}` de `#fff` → `#2c3e50` (texto escuro legível sobre o fundo claro). **Não** removido o arquivo — a aposentadoria completa é U1.2 (depende do `CssBaseline`).
- **Aceite:** fonte declarada renderiza de fato; texto legível; HTML com idioma correto. ✔ (build verde; smoke visual recomendado)

### U0.4 — Código morto de UI (UI-01/UI-08) ✅ (2026-07-11)
Verificado: `SectionCard.tsx` com 0 imports em `src/` (re-verificado via grep).
- [x] Excluído `src/components/SectionCard/` inteiro (via `git rm`; pasta sumiu).
- [x] Removido o `handleEdit` morto (`console.log`) de `Products.tsx`. **Descoberta na verificação:** o `onEdit` era passado ao `ProductTable`, mas o `ProductTable` **nunca consome** essa prop (usa um `handleEdit` interno próprio → `EditProductModal`). Então também foi removida a prop `onEdit` da interface `ProductTableProps` e do call site — dead code de ponta a ponta, sem quebrar a edição real (que já vinha do `ProductTable`).
- **Aceite:** build/tsc verdes; nenhum import quebrado. ✔

---

## Fase U1 — Fundação: tokens + tema + baseline

### U1.1 — Tokens + `getTheme(mode)` + `ColorModeContext` + Provider (UI-09/10/15/16) ✅ (2026-07-11)
A spec completa (código) está no §4.2 do reporte.
- [x] Criado `src/theme/tokens.ts` (primitivos: brand, ink, semânticas, `radius`, `elevation`) — **única** fonte de cor do app.
- [x] Criado `src/theme/index.ts` com `getTheme(mode: "light" | "dark")` (palette AA — `text.secondary` elevado, backgrounds light/dark, divider; `shape.borderRadius`; `typography`; overrides de `MuiButton`/`MuiCard`). **Desvio consciente:** `fontFamily` usa **Poppins** (carregada de fato em U0.3) e não "Inter" (não carregada), evitando fallback silencioso.
- [x] Criado `src/theme/ColorModeContext.tsx` (estado do modo + toggle + hook `useColorMode`; modo inicial por `prefers-color-scheme`).
- [x] Wiring em `src/Root.tsx` (componente extraído para manter `main.tsx` como entrypoint limpo e o lint sem novos avisos): `ColorModeContext.Provider` + `ThemeProvider` + `CssBaseline` + `AuthProvider` + `App`. `main.tsx` só renderiza `<Root/>`.
- [x] Verificação programática: `src/theme/theme.test.ts` (4 testes) confere que os tokens chegam ao tema (primary/semânticas/raio/fonte) e que light≠dark.
- [x] **Desbloqueios:** U2 (átomos + varredura hex→tokens), U3 (dashboard/dark mode), e a tokenização dos modais (antigo EST F4.7, absorvido por U2.1) agora têm alvo canônico (`tokens.ts` + tema).
- **Aceite:** app compila e renderiza sob o tema (build da produção percorre `main→Root→ThemeProvider→App`); `PageHeader` (único consumidor de `theme.palette` hoje) passa a refletir a marca (`background.paper`/`spacing`/`shape` do tema); toggle de modo funciona programaticamente (`ColorModeContext`, exposto ao header em U3.2). ✔

### U1.2 — Aposentar `index.css` (UI-11 conclusão) ✅ (2026-07-11)
- [x] Migrado o único trecho útil do `index.css` (o reset universal `* { margin:0; padding:0; box-sizing:border-box }`) para o tema via `MuiCssBaseline.styleOverrides` — o `CssBaseline` assume reset + background (`background.default`) + cor de texto (`text.primary`) + fonte.
- [x] Removido `import './index.css'` de `main.tsx` e o arquivo `src/index.css` (via `git rm`). Confirmado que as variáveis CSS que ele definia (`--font-primary/--bg-primary/--font-secondary`) **não tinham nenhum consumidor** (`var(--...)` = 0 hits no `src/`).
- **Análise de risco (por que "sem regressão perceptível"):** o `background: #d2e7f5` do `body` **nunca aparecia** em uso normal — o Login pinta um `Container` de viewport inteira com gradiente próprio e as telas autenticadas usam `DefaultLayout` (`minHeight:100vh`) cuja área principal já é `#FAFAFA`. A cor de texto muda de `#2c3e50` → `#223449` (navy quase idêntico) e a fonte segue Poppins pelo tema. O reset universal foi preservado no `CssBaseline`, então nenhum espaçamento de elemento cru muda.
- **Aceite:** sem regressão visual perceptível esperada nas telas principais; build/lint/test verdes. **Smoke visual manual recomendado** em Login/Home/listas autenticadas (não verificável headless sem credenciais Firebase). ✔ (código)

---

## Fase U2 — Biblioteca atômica + consolidação

### U2.1 — Biblioteca atômica `src/ui` (UI-03/05/06/07/13; **absorve EST F4.7**) ⛔ depende de U1 e de EST F2.3 ⬜
Hierarquia proposta no §3.3 do reporte.
- [ ] Criar `src/ui/`: `Button` (variantes), `TextField`, `Modal` (casca header/body/footer), `Card`/`StatCard`, `EmptyState`, `ErrorState`, `Skeletons`, `Feedback` (confirm tokenizado — consumido por U3.4).
- [ ] `DataTable<T>`: wrapper único do DataGrid (tipado, altura fluida, tokenizado) — migrar `CustomTable` (mata `any[]`, `style` inline e `600px` fixo) e avaliar a lista manual de Orçamentos (UI-06; se a migração da lista conflitar com PERF P1.2/paginação, coordenar no log).
- [ ] Migrar os 6 modais CRUD de `Modal/modalStyles.ts` (criado por EST F2.3) para `src/ui/Modal` + `TextField` — **este passo é a tokenização que era o EST F4.7** (constantes de cor morrem aqui).
- [ ] **Coordenação:** avisar EST F3.3 (`EntityForm`) para consumir os átomos.
- **Aceite:** 6 modais sem styled-components locais nem hex; tabelas com UX consistente; `modalStyles.ts` removido ou reduzido a re-export.

### U2.2 — Varredura hex/`sx` → tokens (UI-02/10/12/14) ⬜ (incremental)
- [ ] Ordem: `Home`/`KPICard`/`QuickAccessCard`/`RecentBudgets` → `AppHeader`/`Sidebar` (inclui `#d33` do confirm) → `Login` (só visual; comportamento = SEG S1.3) → `Budgets.css` (paleta slate → tokens) → restante.
- [ ] A cada PR, registrar a contagem: `grep -c '#[0-9a-fA-F]\{3,6\}' src/` (baseline: 104 em 23 arquivos).
- **Aceite:** contagem de hex fora de `tokens.ts` tende a ~0; nenhuma paleta paralela restante.

### U2.3 — Estados padronizados nas telas (UI-21/22/23) ⛔ depende de U2.1 ⬜
- [ ] Substituir `"Carregando..."`/spinners ad hoc por `Skeletons`; DataGrid com `EmptyState` com CTA ("criar primeiro registro"); erros de CRUD/exclusão exibidos via `ErrorState`/`Feedback` (hoje somem em `console.error`).
- [ ] **[REF SEG]** Login já tem feedback funcional via SEG S1.3 — aqui apenas alinhar o visual aos tokens.
- **Aceite:** loading/empty/error consistentes nas 5 telas; nenhuma falha silenciosa de CRUD para o usuário.

### U2.4 — Responsividade intermediária (UI-27) ⬜
- [ ] Revisar breakpoints 900–1200px dos KPIs (agora `md=4` após remover 1 card em 2026-07-10 — eram 5 KPIs em `md=3`; rebalancear para a nova contagem) e altura fluida do `DataTable`.
- **Aceite:** sem desperdício/corte de espaço em tablet; sem overflow.

---

## Fase U3 — Dashboard moderna, dark mode & governança

### U3.1 — Dashboard: hero KPI + gráficos (UI-19/20) ⛔ depende de U1/U2 ⬜
- [ ] `KPICard` com `highlight`/`trend` (spec §4.2-4); "Valor Total" como métrica hero.
- [ ] `@mui/x-charts` via `React.lazy`: `TrendChart` (12 meses) + `TopProductsChart` (consome `topProducts` já calculado). **Coordenação PERF:** o chunk de charts segue o padrão de `manualChunks` de PERF P0.2.
- **Aceite:** dashboard com ≥2 visualizações reais; hierarquia visual clara (hero + secundários); charts fora do bundle inicial.

### U3.2 — Dark mode toggle (UI-15) ⬜
- [ ] Expor o toggle do `ColorModeContext` no `UserMenu`/`AppHeader`; persistir preferência (`localStorage`).
- **Aceite:** alternância light/dark sem hex quebrado (pares AA nos dois modos).

### U3.3 — Auditoria WCAG AA (UI-25) ⬜
- [ ] Rodar axe/Lighthouse; corrigir contraste de secundários/greys, `aria-*` nos ícones/botões, foco visível.
- **Aceite:** sem violações AA de contraste nos fluxos principais; score de acessibilidade registrado no log (antes → depois).

### U3.4 — Confirm/feedback tokenizado (UI-31) ⛔ coordenar com EST F4.1 ⬜
- [ ] EST F4.1 remove o `Swal` de dentro do `useBudgetForm` (dono EST); aqui, padronizar o wrapper `src/ui/Feedback` e migrar os usos restantes (`Sidebar`, confirmações de CRUD) para ele.
- **Aceite:** zero `Swal.fire` com cores hardcoded; diálogos seguem o tema (inclusive dark).

### U3.5 — Lint `no-color-literals` ⬜
- [ ] Regra ESLint/stylelint barrando novo hex/`style` inline fora de `src/theme/`.
- **Aceite:** CI falha ao introduzir cor literal; allowlist documentada (ex.: `tokens.ts`).

### U3.6 — Storybook dos átomos (opcional) ⬜
- [ ] Catálogo de `src/ui` (light/dark) como base de regressão visual.
- **Aceite:** stories dos átomos principais rodando.

---

## Itens referenciados (dono em outra trilha — NÃO implementar aqui)

| Achado UI | Dono | Onde |
|---|---|---|
| UI-28/UI-29 (`value` sem memo / ISP) | EST F0.5 + EST F2.2 | `PLANO_EXECUCAO_ESTRUTURA.md` |
| UI-32/UI-35 (lazy rotas/DataGrid) | PERF P0.2 | `PLANO_EXECUCAO_PERFORMANCE.md` |
| UI-33 (PDF legado, 2 call sites) | EST F4.3 — ✅ **Resolvido (2026-07-10)** via `openBudgetPdf()` (abre no visualizador nativo; fim da aba em branco) | `PLANO_EXECUCAO_ESTRUTURA.md` |
| UI-04 (God Components) | EST F3.1/F3.2 | `PLANO_EXECUCAO_ESTRUTURA.md` |
| UI-34 (lista sem virtualização/paginação) | PERF P1.2 | `PLANO_EXECUCAO_PERFORMANCE.md` |
| UI-30 (widgets sem loading próprio / N reads p/ 5) | PERF P0.3 | `PLANO_EXECUCAO_PERFORMANCE.md` |
| UI-26 (Login: comportamento de erro/submit) | SEG S1.3 | `PLANO_EXECUCAO_SEGURANCA.md` |
| UI-07/UI-13 (centralização imediata dos estilos de modal) | EST F2.3 (tokenização posterior = U2.1) | `PLANO_EXECUCAO_ESTRUTURA.md` |

---

## Log de Execução

> Formato: **data · fase/item · O QUE foi feito · POR QUÊ · verificação (screenshot/medição quando visual)**.

### 2026-07-09 · Planejamento (U-plan) · Consolidação do diagnóstico em plano executável
- **O que foi feito:**
  - Verificação dos achados contra o código: UI-09 (0 `ThemeProvider`), UI-11 (`index.css` com `--font-primary:#fff` e `body{color:#fff}`), UI-17 (`lang="en"`, fonte fantasma), UI-18/19 (`totalValue`/`maxBudget` calculados e descartados), UI-24 (`min-width:500px` no media query), UI-01 (`SectionCard` órfão) — todos confirmados; UI-33 confirmado com agravante (duplicação em `RecentBudgets.tsx`, repassada ao dono EST F4.3).
  - Reescrito o §5 do reporte (backlog → **Plano Consolidado** U0–U3) e criado este arquivo.
  - **Decisões de coesão:** UIX-T12/T13/T14 delegados aos donos PERF/EST (não duplicar); Login dividido — comportamento (SEG S1.3) vs. visual (U2.2/U2.3); **EST F4.7 absorvido por U2.1** (a tokenização dos estilos de modal acontece quando a biblioteca atômica nasce, evitando tokenizar `modalStyles.ts` duas vezes); U0 desenhado para rodar antes do tema (valor imediato sem bloquear na fundação).
- **Por que foi feito:** transformar o backlog em plano sequenciado (quick fixes → fundação → biblioteca → modernização) com dono único por item entre as 4 trilhas, garantindo que a migração de 104 hex/288 `sx` só comece quando existir um alvo canônico (tema + átomos).
- **Verificação:** documentos revisados; **nenhuma** alteração em código de produção nesta etapa. Fases U0–U3 `⬜ Pendente`.

### 2026-07-10 · U0.1 (parcial) + UI-33 · Ajustes ad-hoc na main reconciliados
- **O que foi feito:** (1) **UI-18** — o card "Valor Total (Em desenvolvimento)" foi **removido** do `Home.tsx` (grid `md=3`→`md=4`), tirando o placeholder da tela. Diverge do plano (era exibir o valor); marcado 🟡: **falta** remover os reduces `totalValue`/`maxBudget` mortos (PERF-10/T12) e, se quiserem o valor de volta, entregar como hero KPI em U3.1. (2) **UI-33** — PDF legado resolvido por EST F4.3 (`openBudgetPdf`); acaba a aba `about:blank` em branco. (3) **U2.4** — anotado que os KPIs agora são `md=4` (uma coluna a menos).
- **Por que foi feito:** mudanças ad-hoc na `main` (limpeza do Home + refator do PDF) tocaram itens mapeados; roadmap reconciliado para não planejar o que já foi feito nem perder o rastro do que ficou pela metade.
- **Arquivos:** `src/pages/Home/Home.tsx`, `src/components/Dashboard/RecentBudgets.tsx` (código); docs desta trilha.
- **Verificação:** `npm run build` verde. PDF detalhado em `PLANO_EXECUCAO_ESTRUTURA.md` (F4.3, 2026-07-10).

### 2026-07-11 · U0 completo (U0.1–U0.4) · Quick fixes independentes de tema
> Executado junto com a Onda 1 de Estrutura (EST F0). U0 não depende do tema (U1), então rodou já.
- **O que foi feito:**
  - **U0.1 (UI-18/19 = PERF-10/T12):** removidos de `Home.tsx` os reduces O(N) mortos `kpiData.totalValue` e `kpiData.maxBudget` (calculados, retornados, nunca consumidos na JSX) e o import morto `brMoneyMask`. Fecha o resíduo que a remoção do card "Valor Total" (2026-07-10) tinha deixado.
  - **U0.2 (UI-24):** `Budgets.css`, dentro de `@media (max-width: 900px)`, `.search-input,.filter-select` passou de `min-width: 500px` para `min-width: 0` (mantendo `width: 100%`) — some o overflow horizontal abaixo de 500px.
  - **U0.3 (UI-17 / UI-11 parcial):** `index.html` com `lang="pt-BR"` + carregamento real da **Poppins** (preconnect + stylesheet Google Fonts) — a fonte que o `index.css` já declarava e caía em fallback. `index.css`: `--font-primary` deixou de ser `#fff` (cor) e virou `'Poppins', sans-serif` (com o `body` consumindo `var(--font-primary)`); `body{color}` de `#fff` (ilegível no fundo claro `#d2e7f5`) → `#2c3e50`. Arquivo **não** removido (isso é U1.2, pós-`CssBaseline`).
  - **U0.4 (UI-01/UI-08):** excluído `src/components/SectionCard/` (0 imports); removido o `handleEdit` (`console.log`) morto de `Products.tsx`. Na verificação, descobriu-se que o `ProductTable` **ignora** a prop `onEdit` (tem edição própria interna → `EditProductModal`), então a prop foi removida também da interface `ProductTableProps` e do call site — dead code de ponta a ponta.
- **Por que foi feito:** U0 é o lote de correções visíveis de risco ~nulo que não bloqueia na fundação de tema; entrega valor imediato (mobile utilizável, idioma/fonte corretos, dashboard sem cálculo morto) antes de U1.
- **Arquivos:** `src/pages/Home/Home.tsx`, `src/pages/Budgets/Budgets.css`, `index.html`, `src/index.css`, `src/pages/Products/Products.tsx`, `src/components/Tables/ProductTable/ProductTable.tsx`, `src/components/SectionCard/SectionCard.tsx` (removido).
- **Verificação:** `npm run build` (tsc + vite) **verde**. Lint global caiu para **10 problemas**, todos pré-existentes de **type-safety/arquitetura** (`no-explicit-any`, `ban-types {}`, `react-refresh`, `exhaustive-deps`) com dono em outras trilhas/ondas — **zero código morto/unused-vars** restante após EST F0 + UI U0. Smoke visual (mobile <500px, fonte Poppins, legibilidade) recomendado.

### 2026-07-11 · U1 completo (U1.1–U1.2) · Fundação: tokens + tema + baseline
> Onda 2 (Fundações). U1 é o desbloqueador de U2/U3 e da tokenização dos modais (EST F4.7 absorvido por U2.1).
- **O que foi feito:**
  - **U1.1 (tema):** `src/theme/tokens.ts` (brand/ink/semânticas + `radius`/`elevation`, conforme §4.2 do reporte), `src/theme/index.ts` com `getTheme(mode)` (`createTheme` tokenizado, light/dark, overrides `MuiButton`/`MuiCard`), `src/theme/ColorModeContext.tsx` (contexto + `useColorMode` + modo inicial por `prefers-color-scheme`). O wiring foi para `src/Root.tsx` (`ColorModeContext.Provider` → `ThemeProvider` → `CssBaseline` → `AuthProvider` → `App`), deixando `main.tsx` como entrypoint puro (evita avisos novos de `react-refresh`). **Desvio:** `fontFamily` = Poppins (carregada em U0.3), não "Inter".
  - **U1.2 (aposentar index.css):** reset universal migrado para `MuiCssBaseline.styleOverrides`; `import './index.css'` e o arquivo removidos. Variáveis CSS do arquivo não tinham consumidor.
- **Por que foi feito:** o app rodava no tema default do MUI (UI-09), com 104 hex e 4 paletas concorrentes sem fonte única. O tema tokenizado é pré-requisito para migrar hex→tokens (U2.2), criar os átomos (U2.1) e a dashboard/dark mode (U3). Aposentar o `index.css` fecha UI-11 (globais quebrados) sem regressão porque o `body` background nunca era visível e o reset foi preservado no `CssBaseline`.
- **Arquivos (novos):** `src/theme/tokens.ts`, `src/theme/index.ts`, `src/theme/ColorModeContext.tsx`, `src/Root.tsx`, `src/theme/theme.test.ts`. **(alterados):** `src/main.tsx`. **(removido):** `src/index.css`.
- **Verificação:** `npm run build` (tsc + vite) **verde** — o build percorre todo o grafo `main→Root→ThemeProvider→App`, provando o wiring; `npm run test:run` → **33/33 verdes** (inclui `theme.test.ts`: tokens chegam ao tema, light≠dark); `npm run lint` nos **mesmos 10 problemas pré-existentes** (0 novos — `Root` isolado e uma diretiva `eslint-disable` pontual no hook `useColorMode`, mesmo padrão de `DataContext`/`ContextAuth`). **Smoke visual manual recomendado** (Login/Home/listas) — não verificável headless sem credenciais Firebase; análise indica mudança imperceptível.

<!--
### AAAA-MM-DD · Ux.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** aceites atendidos; build/lint/test verdes; evidência visual anexada/registrada.
-->

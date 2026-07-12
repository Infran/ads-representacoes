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
| **U2** | Biblioteca atômica + consolidação | 4 | ✅ U2.1/U2.2/U2.3/U2.4 (2026-07-11) |
| **U3** | Dashboard moderna, dark mode & governança | 6 | 🟨 U3.1 ✅ · U3.2 ✅ (2026-07-11) · U3.3–U3.6 ⬜ |

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

### U2.1 — Biblioteca atômica `src/ui` (UI-03/05/06/07/13; **absorve EST F4.7**) ✅ (2026-07-11)
Hierarquia proposta no §3.3 do reporte.
- [x] Criado `src/ui/`: `Button`, `Field` (TextField tokenizado), `Modal` (casca header/body/footer/error), `Card`, `StatCard` (KPI, com `highlight` p/ hero — usado por U3.1), `EmptyState`, `ErrorState`, `Skeletons` (`ListSkeleton`/`CardGridSkeleton`/`TableSkeleton`), `Feedback` (`confirmDialog`/`notifySuccess`/`notifyError` — Swal tokenizado, consumido por U3.4) + `index.ts` (import único). Tudo consome o tema — **zero hex** fora de `tokens.ts`.
- [x] `DataTable<T>`: wrapper genérico **tipado** do DataGrid (`src/ui/DataTable.tsx`), superfície/cabeçalho do tema (sem hex), coluna de ações opcional. `CustomTable` virou **wrapper fino** (`@deprecated`) que delega a `DataTable` — os 3 consumidores (Clients/Product/Representative Table) não mudaram. **Mata** o `any[]`/`(any)`/`style` inline/`600px` fixo do antigo `CustomTable` (fecha 2 erros de lint). A lista manual de Orçamentos ficou fora (conflitaria com PERF P1.2 — anotado).
- [x] Migrados os **6 modais CRUD** de `modalStyles.ts` para `src/ui/Modal` + `Field` + `Button` — **tokenização que era o EST F4.7** (constantes `MODAL_PRIMARY`/hex `#1976d2`/`#1565c0` mortas). `src/components/Modal/modalStyles.ts` **removido** (`git rm`). Migração **preserva comportamento** de cada modal (máscaras, `maxLength`, NCM lookup, Autocomplete, validações) — a dedup Create/Edit é F3.3.
- [x] **Coordenação:** átomos prontos para EST F3.3 (`EntityForm`) consumir.
- **Aceite:** ✔ 6 modais sem styled-components locais nem hex; `modalStyles.ts` removido; tabelas tokenizadas e tipadas. `tsc`+build verdes; **lint 10 → 7 problemas** (3 erros de `any` mortos); **49 testes** verdes.

### U2.2 — Varredura hex/`sx` → tokens (UI-02/10/12/14) ✅ (2026-07-11) — telas principais
- [x] Dashboard: `Home`, `KPICard`, `QuickAccessCard`, `RecentBudgets` → `primary.main`/`text.*`/`background.*` (hex `#1976D2`/`#2C3E50`/`#FAFAFA`/`#fff` mortos).
- [x] Chrome autenticado: `AppHeader`, `Sidebar`, `SidebarItem`, `SidebarHeader`, `SidebarGroup`, `GlobalSearch`, `NotificationBell`, `UserMenu`, `Breadcrumbs` → tokens (`text.secondary`/`divider`/`action.hover`/`action.selected`/`primary.main`); os 2 confirms de logout (Swal) usam `tokens.color.*`.
- [x] `Budgets.css` (paleta slate, 32 hex) → **variáveis CSS `--ads-*`** publicadas por `getTheme`/`MuiCssBaseline` (mudam com o modo). `DeleteBudgetModal` (#e0f7fa/#fff) → tokens.
- [x] Contagem: **113 → 43** hex. Os ~43 restantes são **legítimos/intencionais**: `tokens.ts`+`theme/index.ts` (fonte do tema, incl. a ponte `--ads-*`), `Login` (gradiente de marca, tela pré-auth), cores **categóricas** do `GlobalSearch`/`NotificationBell` (cliente/orçamento/produto/representante), `BudgetPdf` (cores do PDF), `Feedback.ts` (referencia tokens).
- **Aceite:** ✔ telas principais + chrome sem paleta paralela; dashboard/lista de orçamentos/header/sidebar **adaptam ao dark mode**. Pendências de próxima iteração: tokenizar o gradiente do Login (se desejado) e promover as cores categóricas a tokens semânticos; regra `no-color-literals` (U3.5).

### U2.3 — Estados padronizados nas telas (UI-21/22/23) ✅ (2026-07-11)
- [x] **Loading:** as 3 telas de lista (`Clientes`/`Produtos`/`Representantes`) trocaram o ad hoc `Carregando... <CircularProgress/>` por `<TableSkeleton/>`; `Orçamentos` (lista manual) ganhou `<ListSkeleton/>` no boot (antes piscava "Nenhum orçamento" enquanto o cache carregava). `EditClientModal` já usava `ListSkeleton` (U2.1).
- [x] **Empty com CTA:** `<EmptyState/>` nas 3 telas de lista — distingue **sem cadastro** (CTA "Cadastrar X" abre o modal de criação) de **busca sem resultado** (mensagem `Nada corresponde a "termo"`, sem CTA). `Orçamentos` mantém seu `.empty-state` tokenizado (`--ads-*`).
- [x] **Erro visível (fim do `console.error` silencioso):** os `handleConfirmDelete` das 3 telas e o `DeleteBudgetModal` passam a chamar `notifyError(...)` (átomo `Feedback`) no `catch`, além do log — exclusão que falha agora é comunicada ao usuário.
- [x] **Limpeza:** removido o `onEdit`/`handleEdit` morto (`console.log`) de `Clients.tsx`/`Representatives.tsx` **e** a prop `onEdit` das interfaces `ClientsTableProps`/`RepresentativeTableProps` — as tabelas têm edição interna própria (mesmo dead-code de ponta a ponta que U0.4 achou no `ProductTable`).
- [x] **[REF SEG]** Login já tem feedback funcional via SEG S1.3 — não alterado aqui.
- **Aceite:** ✔ loading/empty/error consistentes nas 4 telas de dados; nenhuma exclusão falha em silêncio. Smoke visual manual recomendado.

### U2.4 — Responsividade intermediária (UI-27) ✅ (2026-07-11)
- [x] **KPIs:** com U3.1 a linha virou **4 `StatCard` em `xs=12 sm=6 md=3`** (hero + 3) — grade cheia sem a "sobra" do 5º card antigo; gráficos em `md=6` (2/linha → empilham no mobile) e Acesso Rápido em `md=4`.
- [x] **Altura fluida do `DataTable`:** o `height` fixo de 600px virou **opcional** — omitido (padrão dos 3 consumidores via `CustomTable`), a tabela usa `autoHeight` e cresce/encolhe com as linhas da página. Some o desperdício em listas curtas e o corte/overflow em telas menores; `height` explícito ainda é aceito para casos especiais.
- **Aceite:** ✔ sem desperdício/corte em tablet; sem overflow horizontal. Smoke visual manual recomendado (tablet 900–1200px).

---

## Fase U3 — Dashboard moderna, dark mode & governança

### U3.1 — Dashboard: hero KPI + gráficos (UI-19/20) ✅ (2026-07-11)
- [x] **Hero "Valor Total":** átomo `StatCard` com `highlight` (fundo de marca, `contrastText`) abrindo a linha de KPIs (`md=3` × 4). "Valor Total" = soma de `totalValue` (centavos) de todos os orçamentos, formatado por `brMoneyMask`. Os 3 KPIs secundários (Orçamentos/Produtos/Clientes) também migraram de `KPICard` → `StatCard` (uniformidade; `helperText` carrega "+N este mês"/"Último: X"). **`KPICard` ficou órfão e foi removido** (`git rm`; barrel `Dashboard/index.ts` atualizado). Loading → `CardGridSkeleton`.
- [x] `@mui/x-charts@7.29.1` via `React.lazy`: **`TrendChart`** (LineChart com área — valor orçado em R$ nos últimos 12 meses) + **`TopProductsChart`** (BarChart horizontal — top 5 produtos por quantidade orçada, consome `computeTopProducts`). Ambos **presentacionais** (recebem dados agregados por props), tokenizados (cor da série = `theme.palette.primary.main`, sem hex), com fallback próprio de "sem dados". **Coordenação PERF:** novo chunk **`vendor-charts`** no `manualChunks` (`@mui/x-charts` + `@mui/x-charts-vendor`/d3), inserido **antes** da regra genérica `@mui` (senão cairia em `vendor-mui`, crítico). `Suspense` com fallback de `Skeleton` em cada gráfico.
- [x] **Métricas extraídas para função pura testável:** `src/pages/Home/dashboardMetrics.ts` (`computeTotalValue`/`computeMonthlyTrend`/`computeTopProducts`) + `dashboardMetrics.test.ts` (7 testes; `now` injetável, janela contínua de 12 meses, centavos, top-N). `charts.smoke.test.tsx` (4 testes, polyfill de `ResizeObserver`) garante que os componentes montam sem lançar (SVG) + o branch de vazio.
- **Aceite:** ✔ dashboard com **2 visualizações reais** + hero KPI com hierarquia clara (card colorido vs. neutros); **charts fora do bundle inicial** — build de prod: `vendor-charts` **188 kB (gzip 63,9 kB)** em chunk isolado, `TrendChart`/`TopProductsChart` ~1 kB cada; o entry do Login **não** os importa. Smoke visual manual recomendado (light **e** dark). **Nota:** habilita, mas **não** faz, o rewire do boot da Home p/ ler só 5 (P0.3/P1.2) — segue dependendo da coleção no cache para os agregados; migração para "budget summary" fica com PERF P2.1.

### U3.2 — Dark mode toggle (UI-15) ✅ (2026-07-11)
> Antecipado junto com U2.2 (o chrome já estava sendo tokenizado). **Descoberta:** o `UserMenu` já tinha um toggle, mas ligado ao `LayoutContext.darkMode` (mecanismo morto que **não** trocava o tema) — o tema real é dirigido pelo `ColorModeContext` do `Root` (U1.1).
- [x] `UserMenu` rewired para `useColorMode()` (o `ColorModeContext` real que dirige `getTheme`); `darkMode = mode === "dark"`, toggle = `toggle`.
- [x] Persistência: `Root.tsx` lê o modo inicial de `localStorage["ads_color_mode"]` (fallback `prefers-color-scheme`) e grava no toggle.
- [x] Removidos `darkMode`/`toggleDarkMode` mortos do `LayoutContext` (único consumidor era o `UserMenu`, agora rewired).
- **Aceite:** ✔ alternância light/dark real e persistente pelo menu do usuário; chrome + dashboard + lista de orçamentos adaptam (U2.2). Smoke visual manual recomendado nos dois modos.

### U3.3 — Auditoria WCAG AA (UI-25) ⬜
- [ ] Rodar axe/Lighthouse; corrigir contraste de secundários/greys, `aria-*` nos ícones/botões, foco visível.
- **Aceite:** sem violações AA de contraste nos fluxos principais; score de acessibilidade registrado no log (antes → depois).

### U3.4 — Confirm/feedback tokenizado (UI-31) ✅ (2026-07-11) — coord. EST F4.1
- [x] EST F4.1 removeu o `Swal` de dentro do `useBudgetForm` (`removeProduct` só remove; a confirmação foi para `ProductsSection` via `confirmDialog`).
- [x] Wrapper `src/ui/Feedback` estendido: `confirmDialog` ganhou `danger?: boolean` (confirma em vermelho / cancela em marca — preserva a affordance destrutiva sem hex) e um novo `notifyWarning` tokenizado.
- [x] **Todos os `Swal.fire` crus migrados para os átomos:** `useBudgetActions` (warning→`notifyWarning`, sucesso→`notifySuccess`, sucesso-com-escolha→`confirmDialog icon:"success"`, erro→`notifyError`), `BudgetFormPage` (erro→`notifyError`), e os **2 confirms de logout** (`Sidebar` + `UserMenu`) → `confirmDialog({ danger: true })`. Removido o `customClass: swal-popup-custom` órfão (sem CSS que o definisse). `sweetalert2` agora só é importado dentro de `src/ui/Feedback.ts`.
- **Aceite:** ✔ zero `Swal.fire` fora do wrapper; todos os diálogos seguem o tema (cores via `tokens`, adaptam ao dark). `tsc`+`lint` verdes.

### U3.5 — Lint `no-color-literals` ✅ (2026-07-11)
- [x] Regra `no-restricted-syntax` no `.eslintrc.cjs` (nível **error**) barrando cor hex literal — dois seletores: `Literal[value=/#[0-9a-fA-F]{3,8}/]:not([regex])` (strings, incl. gradientes) e `TemplateElement[value.raw=/#.../]` (template literals). Validada por probe via `--stdin`: pega tanto `"#ff8800"` quanto `` `...#123...` `` em arquivo não-allowlistado.
- [x] **Allowlist documentada** (override por arquivo, com o porquê no comentário): `theme/tokens.ts` + `theme/index.ts` (fonte dos tokens/ponte `--ads-*`), `Login` (gradiente de marca), `BudgetPdf` (paleta do PDF, fora do MUI), `GlobalSearch`/`NotificationBell` (cores categóricas por entidade).
- [x] **Único hex fora da allowlist corrigido no caminho:** `DefaultLayout` usava `backgroundColor: "#FAFAFA"` fixo → trocado por `"background.default"` (chave de palette), que **também conserta** um fundo que não adaptava ao dark mode.
- **Aceite:** ✔ lint falha ao introduzir cor literal fora de `src/theme` (error → quebra `--max-warnings 0`); allowlist documentada; **0 novos problemas** no lint (segue nos 7 pré-existentes). `tsc`+`build:prod` verdes.

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

### 2026-07-11 · U2.1 completo · Biblioteca atômica `src/ui` + migração dos 6 modais + tabelas
> Onda 4. U2.1 é desbloqueada por U1 (tema) + EST F2.3 (modalStyles) — ambos prontos. Absorve o EST F4.7 (tokenização dos modais).
- **O que foi feito:**
  - **Átomos (`src/ui/`):** `Button` (forward do MUI tematizado), `Field` (TextField tokenizado, outlined+fullWidth), `Modal` (casca header/body/footer + slot de erro, responsiva `90vw/sm`), `Card`, `StatCard` (KPI com `highlight` p/ hero — pronto p/ U3.1), `EmptyState`, `ErrorState`, `Skeletons` (`ListSkeleton`/`CardGridSkeleton`/`TableSkeleton`), `Feedback` (`confirmDialog`/`notifySuccess`/`notifyError` — Swal com cores de marca dos tokens) + `index.ts`. **Zero hex** — tudo vem do tema.
  - **Tabelas:** `src/ui/DataTable.tsx` genérico **tipado** (`<T extends GridValidRowModel>`) sobre o DataGrid, superfície/cabeçalho/rodapé do tema (sem hex, sem `style` inline, sem `600px` hardcoded no CSS — altura via prop). `CustomTable` reduzido a **wrapper `@deprecated`** que delega a `DataTable`, preservando a API → os 3 consumidores (Clients/Product/Representative Table) **não mudaram**. Morreram os `any[]`/`(any)`/`style` inline (−3 erros de lint junto com o de EditClientModal).
  - **6 modais CRUD** migrados de `modalStyles.ts` para `Modal`+`Field`+`Button`: Client/Representative/Product × Create/Edit. `modalStyles.ts` **removido** (`git rm`) — constantes `MODAL_PRIMARY`/hex `#1976d2`/`#1565c0`/`grey` mortas (tokenização do antigo **EST F4.7**). **Comportamento preservado** em cada modal: máscaras (cnpj/cep/phone) e `maxLength` no Create de Client/Rep, NCM lookup + máscara de `unitValue` nos de Produto, Autocomplete de cliente nos de Rep, validações e handlers de cache idênticos. O botão "Cancelar" passou de cinza hardcoded para `variant="outlined" color="inherit"` (neutro, tematizado). Loading do EditClient virou `ListSkeleton`.
- **Por que foi feito:** dar um alvo canônico (átomos tokenizados) para a migração hex→tokens (U2.2), os estados padronizados (U2.3), a dashboard/dark mode (U3) e o `EntityForm` (EST F3.3). Tokenizar os modais fecha a duplicação de estilo (D-01) e o EST F4.7 sem tocar o comportamento das telas de CRUD (que não têm cobertura de teste).
- **Arquivos (novos):** `src/ui/{Button,Field,Modal,Card,StatCard,EmptyState,ErrorState,Skeletons,DataTable}.tsx`, `src/ui/Feedback.ts`, `src/ui/index.ts`. **(reescritos):** os 6 modais Create/Edit de Client/Product/Representative; `src/components/Tables/CustomTable/CustomTable.tsx` (wrapper). **(removido):** `src/components/Modal/modalStyles.ts`.
- **Verificação:** `tsc --noEmit` verde; `npm run build` verde; `npm run lint` **10 → 7 problemas** (mortos: `any[]`/`(any)` do CustomTable e `any` do EditClientModal; restam 7 pré-existentes com dono em EST/SEG/UI); **49 testes jsdom verdes** (nenhum de modal quebrou — `DeleteBudgetModal`/`Budgets.filter` intactos). Smoke visual manual recomendado (modais/tabelas em light/dark).

### 2026-07-11 · U2.2 (telas principais) + U3.2 · hex→tokens + dark mode real
- **O que foi feito:**
  - **U2.2 — dashboard:** `Home`, `KPICard`, `QuickAccessCard`, `RecentBudgets` migrados para `primary.main`/`text.*`/`background.*` (sombras `rgba` → `boxShadow: 1`).
  - **U2.2 — chrome autenticado:** `AppHeader` (styled com `theme.palette.*`), `Sidebar`/`SidebarItem`/`SidebarHeader`/`SidebarGroup` (bordas→`divider`, ativo/hover→`action.selected`/`action.hover`, marca→`primary.main`, logout→`error.main`), `GlobalSearch`/`NotificationBell`/`UserMenu`/`Breadcrumbs` (rgba→`text.*`/`action.*`/`primary.main`). Os 2 Swal de logout usam `tokens.color.*`.
  - **U2.2 — `Budgets.css`:** as 32 cores slate viraram **variáveis CSS `--ads-*`** publicadas por `getTheme`/`MuiCssBaseline.styleOverrides[":root"]` (recomputadas por modo) — a lista de orçamentos adapta ao dark. `DeleteBudgetModal` tokenizado. Contagem **113 → 43** (restante legítimo: fonte do tema, Login, categóricas, PDF).
  - **U3.2 — dark toggle real:** `UserMenu` rewired do morto `LayoutContext.darkMode` para `useColorMode()` (o `ColorModeContext` do `Root` que dirige `getTheme`); `Root` persiste em `localStorage["ads_color_mode"]` (fallback `prefers-color-scheme`); `darkMode`/`toggleDarkMode` removidos do `LayoutContext`.
- **Por que foi feito:** o app rodava com 104+ hex e 4 paletas paralelas (UI-02/10/12/14); sem tokenizar o chrome, o dark mode (cujo toggle já existia na UI, mas desligado) mostraria telas quebradas. Tokenizar + religar o toggle entrega dark mode funcional nas telas principais.
- **Arquivos:** `src/pages/Home/Home.tsx`, `src/components/Dashboard/{KPICard,QuickAccessCard,RecentBudgets}.tsx`, `src/pages/Budgets/Budgets.css`, `src/theme/index.ts` (ponte `--ads-*`), `src/components/Layout/AppHeader/{AppHeader,GlobalSearch,NotificationBell,UserMenu,Breadcrumbs}.tsx`, `src/components/Layout/Sidebar/{Sidebar,SidebarItem,SidebarHeader,SidebarGroup}.tsx`, `src/components/Layout/LayoutContext.tsx`, `src/Root.tsx`, `src/hooks/useBudgetActions.ts`, `src/components/Modal/Delete/DeleteBudgetModal.tsx`.
- **Verificação:** `tsc --noEmit` verde; `npm run build` verde; `npm run lint` **7 problemas** (0 novos); **49 testes verdes**; hex **113 → 43**. **Smoke visual manual recomendado** em light **e** dark (toggle no menu do usuário) — não verificável headless.

### 2026-07-11 · U3.1 · Dashboard: hero KPI "Valor Total" + gráficos lazy
> Onda 4. Fecha o último item de dashboard da onda; desbloqueada por U1 (tema) + U2.1 (`StatCard`/`Card`/`CardGridSkeleton`) + PERF P0.2 (padrão de `manualChunks`).
- **O que foi feito:**
  - **Hero + KPIs:** `Home.tsx` reorganizada — linha de 4 `StatCard` (`md=3`), o primeiro com `highlight` = **"Valor Total"** (`computeTotalValue` em centavos → `brMoneyMask`). Os 3 KPIs seguintes (Orçamentos/Produtos/Clientes) migraram de `KPICard` para `StatCard` (uniforme; contexto em `helperText`). `KPICard.tsx` **removido** (órfão após a migração) e o barrel `components/Dashboard/index.ts` atualizado. Skeleton de carregamento via `CardGridSkeleton`.
  - **Gráficos:** `@mui/x-charts@7.29.1` instalado. `src/components/Dashboard/charts/TrendChart.tsx` (LineChart área, valor orçado R$/mês, 12 meses) e `TopProductsChart.tsx` (BarChart horizontal, top 5 por quantidade). Presentacionais, tokenizados (série = `primary.main`), com fallback de vazio. Carregados por `React.lazy` + `Suspense` na Home.
  - **Chunking (coord. PERF P0.2):** `vite.config.ts` ganhou o chunk **`vendor-charts`** (`@mui/x-charts`/`@mui/x-charts-vendor`/d3), posicionado **antes** da regra genérica `@mui` para não vazar para `vendor-mui` (crítico).
  - **Testes:** `dashboardMetrics.ts` (funções puras) + `dashboardMetrics.test.ts` (7) e `charts.smoke.test.tsx` (4, com polyfill de `ResizeObserver`).
- **Por que foi feito:** a dashboard não tinha visualização nem métrica hero (UI-19/20); o "Valor Total" que fora removido como card morto (U0.1) volta agora **como hero real** (a saída indicada no próprio U0.1). Extrair as agregações em funções puras dá cobertura de teste ao que antes era `useMemo` inline; isolar os charts em `vendor-charts` os mantém fora do caminho do Login.
- **Arquivos (novos):** `src/pages/Home/dashboardMetrics.ts`(+`.test.ts`), `src/components/Dashboard/charts/{TrendChart,TopProductsChart}.tsx`, `src/components/Dashboard/charts/charts.smoke.test.tsx`. **(alterados):** `src/pages/Home/Home.tsx`, `src/components/Dashboard/index.ts`, `vite.config.ts`, `package.json`/lock. **(removido):** `src/components/Dashboard/KPICard.tsx`.
- **Verificação:** `tsc --noEmit` verde; `npm run build:prod` verde (**`vendor-charts` 188 kB / gzip 63,9 kB** em chunk isolado; `TrendChart`/`TopProductsChart` ~1 kB; entry do Login não os puxa); `npm run test:run` **60/60 verdes** (+11); `npm run lint` nos **mesmos 7 problemas pré-existentes** (0 novos). **Smoke visual manual recomendado** em light e dark — não verificável headless (x-charts precisa de layout/ResizeObserver reais).

### 2026-07-11 · U2.3 + U2.4 · Estados padronizados + responsividade (fecha Onda 4/UI)
> Onda 4. Desbloqueadas por U2.1 (átomos `TableSkeleton`/`ListSkeleton`/`EmptyState`/`notifyError`) + U3.1 (nova grade de KPIs).
- **O que foi feito:**
  - **U2.3 — loading:** `Clientes`/`Produtos`/`Representantes` trocaram `Carregando... <CircularProgress/>` por `<TableSkeleton/>`; `Orçamentos` ganhou `<ListSkeleton rows={6}/>` no boot (usa `useData().loading`, antes piscava o empty-state).
  - **U2.3 — empty com CTA:** `<EmptyState/>` nas 3 telas de lista, distinguindo "sem cadastro" (CTA que abre o modal de criação) de "busca sem resultado".
  - **U2.3 — erro visível:** `notifyError(...)` no `catch` das exclusões (3 telas + `DeleteBudgetModal`) — fim do `console.error` mudo.
  - **U2.3 — dead code:** removido `onEdit`/`handleEdit` (`console.log`) de `Clients`/`Representatives` e a prop `onEdit` das interfaces das duas tabelas (edição é interna — mesmo caso do `ProductTable` em U0.4).
  - **U2.4 — DataTable:** `height` agora opcional; sem ele a tabela usa `autoHeight` (cresce com as linhas) em vez do container fixo de 600px. **U2.4 — KPIs:** grade de 4 (`md=3`) herdada de U3.1, já balanceada.
- **Por que foi feito:** as telas de dados tinham loading/empty/erro inconsistentes e falhas de exclusão sumiam no console (UI-21/22/23); o DataGrid a 600px fixos desperdiçava/cortava espaço (UI-27). Reusar os átomos de U2.1 padroniza os 3 estados sem introduzir novo hex/estilo local.
- **Arquivos:** `src/pages/{Clients,Products,Representatives}/*.tsx`, `src/pages/Budgets/Budgets.tsx`, `src/components/Modal/Delete/DeleteBudgetModal.tsx`, `src/components/Tables/{ClientsTable,RepresentativeTable}/*.tsx`, `src/ui/DataTable.tsx`.
- **Verificação:** `tsc --noEmit` verde; `npm run build:prod` verde; `npm run test:run` **60/60 verdes** (inclui o teste de contrato do `DeleteBudgetModal`, intacto — `notifyError` só no catch, não exercido); `npm run lint` nos **mesmos 7 problemas pré-existentes** (0 novos). Smoke visual manual recomendado (loading/empty/erro em light e dark; tablet 900–1200px). **Nenhuma ação de infra/deploy.**

<!--
### AAAA-MM-DD · Ux.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** aceites atendidos; build/lint/test verdes; evidência visual anexada/registrada.
-->

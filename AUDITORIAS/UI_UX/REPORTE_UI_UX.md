# REPORTE_UI_UX.md — FASE 4: Camada de Apresentação, Design System & Dashboard

**Projeto:** ADS Representações (React 18 + TypeScript + Vite + MUI 5 + Firebase)
**Data da análise:** 2026-07-09
**Escopo:** camada de apresentação de `src/` — páginas, componentes de UI, layout, folhas de estilo (`.css`), styled-components e `sx`.
**Fonte de topologia:** Graphify (`graphify-out/graph.json` — 388 nós · 785 arestas · 20 comunidades) + varredura estática (ripgrep/AST).
**Competências aplicadas:** `ui-ux-pro-max`, `frontend-design`.
**Relatórios irmãos:** [ESTRUTURA](../ESTRUTURA/REPORTE_ESTRUTURA.md) · [SEGURANÇA](../SEGURANCA/REPORTE_SEGURANCA.md) · [PERFORMANCE](../PERFORMANCE/REPORTE_PERFORMANCE.md)

> Este relatório **não repete** os achados estruturais/perf já documentados — ele os **referencia** (ex.: `[EST-A07]`, `[PERF-01]`) quando o mesmo ponto tem uma leitura de UI/UX, e concentra-se no que é novo: **tokens, tema, hierarquia visual, estados de UI, acessibilidade e modernização da camada visual**.

> **Status deste documento (plano consolidado em 2026-07-09):** deixou de ser diagnóstico com backlog solto.
> §1–§4 permanecem como evidência + especificação (tokens, tema, biblioteca atômica, antes/depois da Dashboard).
> O antigo "§5 Backlog" virou um **§5 Plano de Implementação Consolidado** com fases U0–U3, **dono único**
> por item (itens compartilhados com EST/SEG/PERF são executados uma única vez, pela trilha dona) e critérios de aceite.
> Checklists de execução + log: [`PLANO_EXECUCAO_UI_UX.md`](./PLANO_EXECUCAO_UI_UX.md) · Sequenciamento global: [Plano Diretor](../SUMARIO_CONSOLIDADO.md).

---

## 1. Diagnóstico da Arquitetura de Frontend Atual

### 1.1 Raio-X (o que o Graphify + código revelaram)

A camada de apresentação está **funcional, mas sem espinha dorsal de design**. Não existe uma única fonte de verdade visual: cada tela escolhe suas próprias cores, espaçamentos e estratégia de estilo. O resultado é um app que *parece* três apps diferentes costurados (Login roxo, Dashboard azul-MUI, lista de Orçamentos slate/tailwind).

| Sintoma (evidência medida) | Valor | Leitura de UI/UX |
|---|---|---|
| `createTheme` / `ThemeProvider` no código | **0 ocorrências** | ❌ Não há tema. MUI roda no default; `PageHeader` é o único componente que consome `theme.palette.*` — mas sobre o tema padrão. |
| Cores hexadecimais hardcoded | **104 ocorrências / 23 arquivos** | ❌ Sem design tokens. Rebrand = caçar 104 strings. |
| Paletas distintas coexistindo | **≥ 4** | ❌ `#1976d2` (MUI, 36×), `#2C3E50` (navy "marca", 8×), `#3b82f6/#64748b/#475569` (slate/Tailwind, Budgets), `#333358/#3b3b79` (roxo, Login). |
| `sx={...}` inline | **288** | ⚠️ Estilo espalhado por props; zero reuso; difícil auditar consistência. |
| `style={{...}}` inline (DOM cru) | **11** | ⚠️ Escapam até do sistema de estilo do MUI (`CustomTable`). |
| Bibliotecas de gráfico | **0** | ❌ Uma "Dashboard" **sem nenhuma visualização de dados**. KPIs são números crus. |
| Suporte a Dark Mode | **0** | ❌ Inexistente (consequência direta de "0 tema"). |
| Fonte `Poppins` declarada vs. carregada | declarada em `index.css:16`, **nunca carregada** | ❌ Sem `@font-face`/Google Fonts → app renderiza em fonte de sistema (fallback). MUI espera Roboto — também não carregado. |
| Code-splitting / `React.lazy` no `Router` | **0** | ❌ Todas as páginas + `@mui/x-data-grid` no bundle inicial `[PERF-01]`. |
| `ReactDOM.render` + `document.write` (legado React 18) | **4 ocorrências** | ❌ API depreciada para renderizar o PDF em nova aba `[EST-A02]`. |

### 1.2 Topologia visual (Graphify)

- **God interface de dados → cascata de re-render.** `useData()` é o nó mais conectado do grafo (**30 arestas**, betweenness 0.140) e é vizinho de **todas** as telas e modais (Home, Products, Clients, Representatives, Budgets, BudgetFormPage, 6 modais, GlobalSearch, useBudgetForm). O `value` do provider **não é memoizado** `[EST-A07 / PERF-06]` → qualquer escrita em qualquer entidade re-renderiza toda a árvore visual. Em termos de UX é o gargalo latente de *responsividade percebida*.
- **35 interfaces `*Props`** (superfície de composição). O *prop drilling* real é moderado porque o `DataContext` "achata" o acesso a dados — mas o custo é o oposto: **acoplamento largo** (a interface `DataContextState` expõe ~30 membros — violação de ISP `[EST-S05]`), então nenhum componente é testável/portável sem o provider inteiro.
- **Duplicação de estilo confirmada pelo grafo.** O Graphify lista `modalStyle`, `FormControlStyled`, `StyledButton`, `StyledTextField` **repetidos como nós idênticos em 6 arquivos de modal** — cada um com `#1976d2/#1565c0/#e0e0e0` hardcoded (evidência do §2, achados UI-13).
- **Componentes órfãos (ruído no grafo).** `SectionCard` aparece no grafo mas tem **0 imports** em `src/` → componente morto (UI-01), à semelhança do `Sidebar.old.tsx` já reportado `[EST-M01]`.

### 1.3 Veredito

| Eixo | Nota | Comentário |
|---|---|---|
| Componentização | 🟠 Média | Boa separação por pastas; ruim em pureza (páginas fazem fetch+filtro+render) e em primitivas compartilhadas (tudo reimplementado). |
| Tokens & Tema | 🔴 **Crítica p/ escalar** | Zero tema, 4 paletas, 104 hex. É o **bloqueador nº 1** de qualquer modernização ou dark mode. |
| UX de Dashboard | 🟠 Média-Alta | Layout organizado, mas sem hierarquia, sem gráficos, com KPI "morto" e estados de erro ausentes. |
| Estado/Dados na UI | 🟠 Média | Cache é ótimo, mas re-render global e ausência de estados por-widget. |
| Perf de render/moderno | 🟠 Média | Sem lazy, API legada de render, DataGrid eager. |

---

## 2. Inventário Exaustivo de Achados de UI/UX

Severidade: 🔴 Alta · 🟠 Média · 🟡 Baixa · Impacto: **XP** = Experiência · **PERF** = Performance · **A11Y** = Acessibilidade · **MNT** = Manutenção/Escala.

### Pilar 1 — Componentização & Design System

| ID | Arquivo · Linha | Sev | Problema | Impacto |
|---|---|---|---|---|
| UI-01 | `components/SectionCard/SectionCard.tsx` (todo) | 🟡 | Componente **morto** — 0 imports. Cores `#2C3E50/#1565C0/#E0E0E0` hardcoded, padrão de card legado (substituído por `QuickAccessCard`). | MNT |
| UI-02 | `components/Dashboard/{KPICard,QuickAccessCard,RecentBudgets}.tsx` | 🟠 | Bons candidatos a *presentational*, mas **hardcodam `#1976D2/#2C3E50`** em vez de consumir tema. Não formam uma biblioteca (cada um reinventa card/tabela). | MNT/XP |
| UI-03 | `src/**` (transversal) | 🔴 | **Sem biblioteca atômica.** Botão, input, modal, tabela, card, chip são re-estilizados ad hoc por feature. Não há `Button`/`Input`/`Modal`/`DataTable` canônicos. | MNT |
| UI-04 | `pages/BudgetFormPage/BudgetFormPage.tsx` (501) · `pages/Budgets/Budgets.tsx` (498) | 🔴 | *God Components* misturam apresentação, orquestração e regra `[EST-E01/E02]`. JSX de item de lista e seções de accordion montados inline. | MNT/XP |
| UI-05 | `components/Tables/CustomTable/CustomTable.tsx:8-13,76-84` | 🟠 | Tabela "genérica" tipada `any[]`, com `style` inline, **altura fixa `600px`** e paleta própria (`#f9f9f9/#f0f0f0/#333`). Não é um componente de design system. | MNT/XP |
| UI-06 | `CustomTable` (DataGrid) vs `Budgets.css` (grid CSS manual) | 🟠 | **Duas implementações de tabela** com UX divergente: Produtos/Clientes/Representantes usam `@mui/x-data-grid`; Orçamentos usa lista em CSS grid manual. Ordenação, paginação e densidade se comportam diferente entre telas. | XP |
| UI-07 | 6 modais CRUD (`Create*`, `Edit*`) | 🔴 | Sem `<Modal>` abstrato — 6 cascas quase idênticas `[EST-D01]`. | MNT |
| UI-08 | `pages/Products/Products.tsx:39-41` | 🟡 | `handleEdit` = `console.log` morto (a edição real vive em `ProductTable`). Container e apresentação misturados sem contrato claro. | MNT |

### Pilar 2 — Consolidação de Estilo & Tokens

| ID | Arquivo · Linha | Sev | Problema | Impacto |
|---|---|---|---|---|
| UI-09 | `main.tsx` / `App.tsx` (ausência) | 🔴 | **Nenhum `ThemeProvider`/`createTheme`.** App roda no tema default do MUI; impossível padronizar cor/tipografia/densidade num só lugar. Raiz de UI-10..UI-16. | MNT/XP |
| UI-10 | 23 arquivos (104 hex) | 🔴 | **Sem design tokens.** ≥4 paletas concorrentes. Cor semântica (sucesso/erro) definida ad hoc (`#4caf50`, `#d32f2f`, `#ff9800`, `#059669`). | MNT/XP |
| UI-11 | `src/index.css:1-16` | 🔴 | Globais quebrados: `--font-primary: #fff` (nome diz "font", valor é cor), `body { color:#fff }` sobre `--bg-primary:#d2e7f5` (texto branco em fundo claro), reset `*` cru + `!important`. | XP/A11Y |
| UI-12 | 288× `sx=` · 11× `style={{` | 🟠 | Estilo pulverizado em props inline; consistência impossível de garantir; zero reuso de tokens. | MNT |
| UI-13 | `Modal/**/{Create,Edit}*Modal.tsx` (ex.: `CreateClientModal.tsx:22-70,131,279`) | 🔴 | `modalStyle/FormControlStyled/StyledButton/StyledTextField` **copiados verbatim 6×**, com `#1976d2/#1565c0/#e0e0e0` e `gradient` hardcoded. Comentários confessam: *"Substituí theme.spacing(2) por valor fixo"*. | MNT |
| UI-14 | `pages/Budgets/Budgets.css` (todo) | 🟠 | 3ª paleta (slate/Tailwind: `#3b82f6/#059669/#64748b/#475569/#e2e8f0`) totalmente desconectada do MUI; gradientes e sombras próprios. | XP/MNT |
| UI-15 | transversal | 🟠 | **Sem Dark Mode** e sem qualquer estratégia de tema dinâmico. | XP |
| UI-16 | transversal | 🟠 | Escalas inconsistentes: **raio** (`4/8/12/50%`), **elevação** (strings `boxShadow` ad hoc por componente), **espaçamento** (mistura de `px` fixos e `theme.spacing`). | MNT/XP |
| UI-17 | `index.css:16` + `index.html:2,7` | 🟠 | Fonte **`Poppins` declarada e nunca carregada** → fallback de sistema. `<html lang="en">` num app 100% pt-BR (A11Y/SEO). | XP/A11Y |

### Pilar 3 — UX/UI de Dashboard de Alta Performance

| ID | Arquivo · Linha | Sev | Problema | Impacto |
|---|---|---|---|---|
| UI-18 | `pages/Home/Home.tsx:37,136-143` | 🔴 | KPI **"Valor Total em Orçamentos" é um placeholder morto**: exibe `R$ ---,--` + "(Em desenvolvimento)" — enquanto `kpiData.totalValue` **já é calculado** (l.37) e **descartado**. `brMoneyMask` existe para formatá-lo. | XP |
| UI-19 | `Home.tsx:39-43,59-61` | 🟡 | `maxBudget` e `topProducts` calculados mas subutilizados (top-2 só como texto). Dados prontos, sem visualização. | XP |
| UI-20 | `Home.tsx:117-178` | 🟠 | **Hierarquia visual fraca**: 4 KPIs de peso idêntico, sem métrica primária destacada; nenhum gráfico de tendência. Olho não sabe onde pousar. | XP |
| UI-21 | `pages/{Products,Clients,Representatives,BudgetFormPage}` usam `CircularProgress`; Dashboard usa `Skeleton` | 🟠 | **Loading inconsistente**: listas mostram texto `"Carregando..."` + spinner; dashboard usa skeleton. Sem padrão. | XP |
| UI-22 | `CustomTable` (noRowsLabel default) vs `Budgets.css:.empty-state` | 🟠 | **Empty states parciais/divergentes**: Orçamentos tem empty state ilustrado; páginas DataGrid caem no texto default; sem CTA de "criar primeiro registro". | XP |
| UI-23 | `Login.tsx:28-30`, `Products.tsx:56-58`, transversal | 🔴 | **Sem error states.** Erros vão para `console.error` e somem. Login **engole a falha de autenticação** (usuário não vê nada); exclusão falha em silêncio. | XP |
| UI-24 | `Budgets.css:264-295` | 🔴 | **Bug responsivo:** dentro de `@media (max-width:900px)`, `.search-input/.filter-select { min-width: 500px }` → em telas <500px força overflow e **scroll horizontal**. | XP |
| UI-25 | `Login.tsx:20-23`, `CustomTable`, greys `#94a3b8/#666` | 🟠 | **A11Y:** handlers com `any` implícito e sem `aria-*`; contraste de textos secundários cinza sobre branco no limite AA; foco só o default; `Login` sobrescreve cor do label (`#494748`). | A11Y |
| UI-26 | `Login.tsx:23-31,107-121` | 🟠 | Botão de login **sem estado de loading/disabled** (permite duplo submit); **sem feedback de erro**; paleta roxa (`#333358/#3b3b79`) fora da marca. | XP |
| UI-27 | `Home.tsx:117-231` (grid) · `CustomTable:76` (h=600) | 🟡 | **Resoluções intermediárias:** KPIs `md=3` viram 2-col em tablet sem rebalancear; DataGrid de altura fixa desperdiça/corta espaço em telas médias. | XP |

### Pilar 4 — Estado & Fluxo de Dados na UI

| ID | Arquivo · Linha | Sev | Problema | Impacto |
|---|---|---|---|---|
| UI-28 | `context/DataContext.tsx:361` (value sem `useMemo`) | 🔴 | `value` recriado a cada render + contexto único → **re-render global** de todas as telas a cada mudança de qualquer entidade `[EST-A07/PERF-06]`. Sensação de "app pesado". | PERF/XP |
| UI-29 | `DataContext.tsx:361-404` (~30 membros) | 🟠 | Interface larga (ISP) — cada consumidor "conhece" tudo; dificulta seletores e memo por-fatia. | MNT/PERF |
| UI-30 | `Home.tsx` + `RecentBudgets` | 🟠 | Widgets **não têm loading/erro próprios**; dashboard lê coleções inteiras para exibir 5 linhas `[PERF-03]`. | PERF/XP |
| UI-31 | `Sidebar.tsx:71-91`, `hooks/useBudgetForm.ts` | 🟡 | `sweetalert2` acoplado à lógica de UI; diálogos **fora do tema** (`confirmButtonColor:'#d33'`), inconsistentes com o resto. | XP/MNT |

### Pilar 5 — Performance de Renderização & Modernização

| ID | Arquivo · Linha | Sev | Problema | Impacto |
|---|---|---|---|---|
| UI-32 | `Router.tsx:2-13` | 🔴 | **Zero `React.lazy`/`Suspense`** — todas as páginas e o `@mui/x-data-grid` no bundle inicial `[PERF-01]`. | PERF |
| UI-33 | `RecentBudgets.tsx:44-61`, `Budgets.tsx:158-172` | 🟠 | `ReactDOM.render` + `document.write` (**depreciado no React 18**) para abrir o PDF `[EST-A02]`. Deve virar rota React dedicada. | PERF/MNT |
| UI-34 | `Budgets.tsx` (lista manual) | 🟡 | Lista de orçamentos renderiza todos os itens (sem virtualização); latente com crescimento `[PERF-02]`. | PERF |
| UI-35 | `CustomTable` (DataGrid eager) | 🟡 | `@mui/x-data-grid` (pesado) importado estaticamente em toda página de tabela; candidato a lazy. | PERF |

**Total: 35 achados de UI/UX** — 12 🔴 · 16 🟠 · 7 🟡.

---

## 3. Especificação do Novo Design System & Dashboard

Objetivo: substituir 4 paletas + 104 hex + 288 `sx` por **um sistema de tokens único**, com **tema dinâmico (Light/Dark)** e uma **biblioteca atômica** enxuta sobre o MUI (não jogar o MUI fora — envelopá-lo).

### 3.1 Arquitetura de tokens (2 camadas)

```
Primitivos  (valores brutos, sem semântica)      →   Semânticos (papel na UI)
--------------------------------------------          -------------------------------
blue-600  #1D63C4                                     brand / primary.main
navy-800  #223449   (era #2C3E50)                     ink / text.primary  (neutral escuro)
slate-500 #64748B                                     text.secondary
slate-200 #E2E8F0                                     divider / border
green-600 #059669                                     success.main
amber-500 #F59E0B                                     warning.main
red-600   #D32F2F                                     error.main
surface-0 #FFFFFF / dark #0F172A                      background.paper
surface-1 #FAFAFA / dark #111827                      background.default
```

Escalas de suporte (fim das inconsistências de UI-16):

| Token | Valores | Substitui |
|---|---|---|
| `radius` | `sm 6 · md 10 · lg 16 · pill 999` | `4/8/12/50%` avulsos |
| `space` | base 8 (MUI `spacing`), passos `0.5/1/2/3/4/6` | `px` fixos misturados |
| `elevation` | `e1` sutil · `e2` card · `e3` overlay · `e4` modal (definidas 1×) | strings `boxShadow` ad hoc |
| `typography` | Família **Inter** (ou Poppins, agora *de fato carregada*); escala `display/h1..h6/body/caption` | fonte fantasma UI-17 |

### 3.2 Tema dinâmico (Light/Dark) — MUI

Estratégia recomendada para MUI 5.15: **CSS variables mode** (`Experimental_CssVarsProvider` + `experimental_extendTheme`), que troca de tema por atributo `data-mui-color-scheme` **sem repaint de árvore** e respeita `prefers-color-scheme`. Alternativa estável e simples: `createTheme(getDesignTokens(mode))` + `ColorModeContext` (mostrada no §4). Ambas eliminam UI-09/UI-15 de uma vez.

Acessibilidade dos tokens: todo par `text/*` × `background/*` deve passar **WCAG AA (≥4.5:1)** — validar `text.secondary` (hoje cinzas no limite, UI-25) e os greys `#94a3b8/#666`.

### 3.3 Biblioteca atômica (hierarquia proposta)

```
src/theme/
  tokens.ts        // primitivos + escalas (fonte única de verdade)
  index.ts         // getTheme(mode) → createTheme(...)  (light|dark)
  ColorModeContext.tsx

src/ui/            // Design System (átomos → moléculas)
  Button.tsx        // 1 botão canônico (variantes: primary|secondary|ghost|danger)
  TextField.tsx     // input tokenizado (mata StyledTextField ×6 — UI-13)
  Modal.tsx         // casca de modal única (header+body+footer) — mata 6 modais (UI-07)
  Card.tsx / StatCard.tsx / Surface.tsx
  DataTable.tsx     // wrapper único do DataGrid, tipado <T>, tokenizado (mata UI-05/06)
  EmptyState.tsx    // ilustração + título + CTA (padroniza UI-22)
  ErrorState.tsx    // mensagem amigável + retry (resolve UI-23)
  Skeletons.tsx     // skeletons padrão (unifica loading — UI-21)
  Feedback.ts       // wrapper de confirm() tokenizado (substitui Swal solto — UI-31)

src/components/Dashboard/   // moléculas de negócio consumindo src/ui + tokens
  KPICard · TrendChart · TopProductsChart · RecentBudgets
```

Regra de ouro: **feature components consomem `src/ui` + `theme`**; **nunca** hex literais. Um lint (`no-color-literals` via `stylelint`/regra ESLint custom) impede regressão.

### 3.4 Dashboard moderna (blueprint de layout)

- **Linha 1 — KPI row (hierarquia):** 1 métrica *hero* (Valor Total — corrige UI-18) em card maior + 3 KPIs secundários com **delta/tendência** (▲▼ vs. mês anterior).
- **Linha 2 — Visualização (resolve "0 gráficos"):** `TrendChart` (orçamentos/valor por mês, 12 meses) + `TopProductsChart` (barras horizontais, usa `topProducts` já calculado, UI-19). Stack sugerida: **`@mui/x-charts`** (coeso com MUI/tema, licença MIT) — carregado via `React.lazy` (UI-35).
- **Linha 3 — `RecentBudgets`** com `EmptyState`/`ErrorState`/`Skeleton` padronizados.
- **Densidade & grid:** `Grid` responsivo com breakpoints revisados para 900–1200px (UI-27); `DataTable` com altura fluida (`autoHeight`/`flex`) em vez de `600px` fixo.
- **Navegação:** manter o `Sidebar` colapsável (bom) mas tokenizar cores (`#d33/#d32f2f/#1976D2` → `error.main`/`primary.main`).

---

## 4. Exemplo Prático — Antes/Depois (a tela mais problemática: **Dashboard**)

A Dashboard concentra 3 dos piores achados: **KPI morto (UI-18)**, **cores hardcoded/sem tema (UI-09/10)** e **zero fundação de tokens**. O "depois" ataca a **raiz** (funda o tema/tokens) e depois refatora o componente.

### 4.1 ANTES

**`src/main.tsx`** — sem tema, sem baseline:
```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
)
```

**`src/pages/Home/Home.tsx`** — cor hardcoded + **KPI placeholder morto** (o valor já existe em `kpiData.totalValue`, l.37):
```tsx
<Typography variant="h4" sx={{ fontWeight: 700, color: "#2C3E50", mb: 1 }}>
  Dashboard
</Typography>
...
<KPICard
  title="Valor Total em Orçamentos"
  value={`R$ ---,--`}              // ← placeholder; totalValue calculado e descartado
  subtitle="(Em desenvolvimento)"
  icon={AttachMoney}
  loading={loading}
/>
```

**`src/components/Dashboard/KPICard.tsx`** — azul hardcoded, sem hierarquia:
```tsx
<Icon sx={{ color: "#1976D2", fontSize: 24, opacity: 0.8 }} />
...
<Typography variant="h4" sx={{ fontWeight: 700, color: "#1976D2", mb: 0.5 }}>
  {value}
</Typography>
```

### 4.2 DEPOIS

**1) `src/theme/tokens.ts`** — fonte única de verdade:
```ts
export const tokens = {
  color: {
    brand:   { main: "#1D63C4", light: "#4C8AE0", dark: "#134A97", contrast: "#FFFFFF" },
    ink:     "#223449",          // era #2C3E50 (navy)
    success: "#059669", warning: "#F59E0B", error: "#D32F2F", info: "#2196F3",
  },
  radius:  { sm: 6, md: 10, lg: 16, pill: 999 },
  elevation: {
    e1: "0 1px 3px rgba(16,24,40,0.08)",
    e2: "0 2px 8px rgba(16,24,40,0.06)",
    e4: "0 12px 32px rgba(16,24,40,0.18)",
  },
} as const;
```

**2) `src/theme/index.ts`** — tema por modo (Light/Dark), tokenizado:
```ts
import { createTheme, ThemeOptions } from "@mui/material/styles";
import { tokens } from "./tokens";

export const getTheme = (mode: "light" | "dark") =>
  createTheme({
    palette: {
      mode,
      primary: { main: tokens.color.brand.main, light: tokens.color.brand.light,
                 dark: tokens.color.brand.dark, contrastText: tokens.color.brand.contrast },
      success: { main: tokens.color.success }, warning: { main: tokens.color.warning },
      error:   { main: tokens.color.error },   info:    { main: tokens.color.info },
      text: mode === "light"
        ? { primary: tokens.color.ink, secondary: "#5B6B7E" }   // secondary elevado p/ AA
        : { primary: "#E5EAF0", secondary: "#9AA7B6" },
      background: mode === "light"
        ? { default: "#FAFAFA", paper: "#FFFFFF" }
        : { default: "#0F172A", paper: "#111827" },
      divider: mode === "light" ? "#E2E8F0" : "#243244",
    },
    shape: { borderRadius: tokens.radius.md },
    typography: { fontFamily: `'Inter','Poppins',system-ui,sans-serif` },
    components: {
      MuiButton: { defaultProps: { disableElevation: true },
                   styleOverrides: { root: { textTransform: "none", borderRadius: tokens.radius.sm } } },
      MuiCard:   { styleOverrides: { root: { borderRadius: tokens.radius.md, boxShadow: tokens.elevation.e2 } } },
    },
  } as ThemeOptions);
```

**3) `src/main.tsx`** — provê tema + baseline + toggle de modo:
```tsx
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useMemo, useState } from "react";
import { getTheme } from "./theme";
import { ColorModeContext } from "./theme/ColorModeContext";

function Root() {
  const preferred = window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  const [mode, setMode] = useState<"light" | "dark">(preferred);
  const theme = useMemo(() => getTheme(mode), [mode]);
  const toggle = useMemo(() => ({ toggle: () => setMode(m => (m === "light" ? "dark" : "light")), mode }), [mode]);
  return (
    <ColorModeContext.Provider value={toggle}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider><App /></AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><Root /></React.StrictMode>);
```
> Além disso: **remover `index.css`** (globais quebrados UI-11) — `CssBaseline` cobre o reset; carregar a fonte via `<link>` no `index.html` e corrigir `lang="pt-BR"` (UI-17).

**4) `src/components/Dashboard/KPICard.tsx`** — *presentational* puro, tokenizado, com hierarquia e tendência:
```tsx
import { Card, CardContent, Box, Typography, Chip, Skeleton } from "@mui/material";
import { SvgIconComponent } from "@mui/icons-material";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

export interface KPICardProps {
  title: string; value: string | number; subtitle: string;
  icon: SvgIconComponent; loading?: boolean;
  highlight?: boolean;                          // métrica hero (resolve hierarquia UI-20)
  trend?: { value: number; label: string };     // delta ▲▼ (resolve UI-19)
  onClick?: () => void;
}

export const KPICard = ({ title, value, subtitle, icon: Icon, loading,
                          highlight, trend, onClick }: KPICardProps) => {
  const up = (trend?.value ?? 0) >= 0;
  return (
    <Card onClick={onClick}
      sx={{ height: "100%", minHeight: 160, cursor: onClick ? "pointer" : "default",
            ...(highlight && { bgcolor: "primary.main", color: "primary.contrastText" }),
            transition: "transform .2s, box-shadow .2s",
            "&:hover": onClick ? { transform: "translateY(-2px)", boxShadow: 4 } : {} }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1.5 }}>
          <Typography variant="subtitle2"
            sx={{ fontWeight: 600, textTransform: "uppercase", letterSpacing: .4,
                  color: highlight ? "inherit" : "text.secondary" }}>
            {title}
          </Typography>
          <Icon sx={{ fontSize: 24, opacity: .9, color: highlight ? "inherit" : "primary.main" }} />
        </Box>
        {loading
          ? <Skeleton variant="text" width="60%" height={44} />
          : <Typography variant="h4" sx={{ fontWeight: 800, mb: .5,
                          color: highlight ? "inherit" : "primary.main" }}>{value}</Typography>}
        <Typography variant="body2" sx={{ color: highlight ? "inherit" : "text.secondary" }}>
          {subtitle}
        </Typography>
        {trend && (
          <Chip size="small" icon={up ? <TrendingUp/> : <TrendingDown/>}
            label={`${up ? "+" : ""}${trend.value}% ${trend.label}`}
            color={up ? "success" : "error"} variant="outlined" sx={{ mt: 1 }} />
        )}
      </CardContent>
    </Card>
  );
};
export default KPICard;
```

**5) `src/pages/Home/Home.tsx`** — usa o valor real (corrige o KPI morto UI-18) e a métrica hero:
```tsx
import { brMoneyMask } from "../../utils/Masks";
...
<KPICard
  highlight
  title="Valor Total em Orçamentos"
  value={`R$ ${brMoneyMask(String(kpiData.totalValue))}`}   // ← dado que já existia, agora exibido
  subtitle="Somatório de todos os orçamentos"
  icon={AttachMoney}
  loading={loading}
/>
```

**Ganho:** cor da marca centralizada (0 hex na tela), Dark Mode automático, KPI antes "morto" agora mostra dado real, hierarquia (card hero) e tendência — tudo sem tocar em `sx` espalhado. O mesmo `KPICard` passa a servir qualquer métrica do app.

---

## 5. Plano de Implementação Consolidado de UI/UX

> Esta seção substitui o antigo backlog UIX-T01..T19. Define fases (U0–U3), **dono único por item**,
> critérios de aceite e dependências. Checklists + log: [`PLANO_EXECUCAO_UI_UX.md`](./PLANO_EXECUCAO_UI_UX.md).

### 5.0 Verificação do diagnóstico contra o código-fonte (2026-07-09)

- ✅ UI-09: 0 `ThemeProvider`/`createTheme` em `src/` (varredura); `main.tsx` monta o app sem tema.
- ✅ UI-11: `index.css` confirmado — `--font-primary: #fff` (nome de fonte, valor de cor), `body { color:#fff }` sobre `--bg-primary:#d2e7f5`.
- ✅ UI-17: `index.html` com `lang="en"` e **nenhuma** fonte carregada (Poppins declarada em `index.css:16` é fantasma).
- ✅ UI-18/UI-19: `Home.tsx:37-43` calcula `totalValue`/`maxBudget` e o KPI exibe placeholder (mesmo código de PERF-10).
- ✅ UI-24: `Budgets.css:283-287` — `min-width: 500px` dentro do `@media (max-width: 900px)`.
- ✅ UI-01: `SectionCard.tsx` com 0 imports em `src/`.
- ✅ UI-33: confirmado e **agravado** — o `handleOpenPdf` legado está duplicado em `RecentBudgets.tsx:41-63` (dono da correção: EST F4.3, cobrindo os 2 call sites).

### 5.1 Princípios de sequenciamento

1. **Quick fixes antes do tema.** U0 corrige o que é bug/valor imediato e **não depende** de tema (KPI morto, responsivo, `lang`, fonte, código morto). Entrega valor visível sem esperar a fundação.
2. **Fundação antes de migração.** U1 (tokens + `ThemeProvider` + `CssBaseline`) é o desbloqueador: **nada de migrar hex→tokens antes do tema existir** (não há para onde migrar — verificado: 0 `ThemeProvider` hoje).
3. **Biblioteca antes de varredura.** U2 cria os átomos (`src/ui`) e só então faz a varredura incremental dos 104 hex/288 `sx` — senão a migração não tem alvo canônico.
4. **Dono único.** UIX-T12 (lazy) → **PERF P0.2**; UIX-T13 (PDF) → **EST F4.3**; UIX-T14 (memoizar `value`) → **EST F0.5** (+F2.2); erro de Login → **SEG S1.3**; centralização imediata dos estilos de modal → **EST F2.3**; a **tokenização** desses estilos (antigo EST F4.7) é **absorvida por U2.1** quando a biblioteca atômica nascer.

### 5.2 Roadmap por fases

| Fase | Tema | Itens (achados) | Pré-requisito |
|---|---|---|---|
| **U0** | Quick fixes independentes de tema | UI-18/19 (KPI real, = PERF-10), UI-24 (responsivo), UI-17 (lang+fonte), UI-11 parcial (globais quebrados), UI-01/08 (código morto) | — |
| **U1** | Fundação: tokens + tema + baseline | UI-09, UI-10 (estrutura), UI-15 (base), UI-16, UI-11 (aposentar `index.css`) | — |
| **U2** | Biblioteca atômica + consolidação | UI-03/05/06/07/13 (átomos, absorve EST F4.7), UI-02/10/12/14 (varredura hex→tokens), UI-21/22/23 (estados; Login=SEG) , UI-27 | U1; EST F2.3 (base dos modais) |
| **U3** | Dashboard moderna, dark mode & governança | UI-19/20 (charts, hero KPI), UI-15 (toggle), UI-25 (WCAG), UI-31 (confirm tokenizado, coord. EST F4.1), lint `no-color-literals`, Storybook (opcional) | U1/U2 |
| — | Referenciados (dono em outra trilha) | UI-28/29→EST F0.5/F2.2 · UI-32/35→PERF P0.2 · UI-33→EST F4.3 · UI-04→EST F3 · UI-34→PERF P1.2 · UI-30→PERF P0.3 · UI-26(comportamento)→SEG S1.3 | — |

### 5.3 Especificação por item (resumo; detalhes e aceites no plano de execução)

- **U0.1 · KPI "Valor Total" real** *(UI-18/19, resolve PERF-10)* — exibir `kpiData.totalValue` via `brMoneyMask`; decidir `maxBudget` (usar ou remover o cálculo). **Aceite:** dashboard sem `R$ ---,--`; zero cálculo morto.
- **U0.2 · Bug responsivo dos filtros** *(UI-24)* — remover/corrigir `min-width:500px` no media query. **Aceite:** sem scroll horizontal <500px.
- **U0.3 · `lang="pt-BR"` + fonte carregada + globais corrigidos** *(UI-17, UI-11 parcial)* — carregar Inter/Poppins de verdade; corrigir `--font-primary`/`body{color}` quebrados (remoção total do css fica para U1). **Aceite:** fonte renderiza; texto legível; `lang` correto.
- **U0.4 · Código morto de UI** *(UI-01/08)* — excluir `SectionCard.tsx`; remover `handleEdit` morto. **Aceite:** build/lint verdes.
- **U1.1 · Tokens + `getTheme(mode)` + `ColorModeContext` + `ThemeProvider`/`CssBaseline`** *(UI-09/10/15/16)* — conforme §3/§4. **Desbloqueia** U2, U3 e a tokenização dos modais. **Aceite:** app renderiza sob tema; `PageHeader` (único consumidor de `theme.palette` hoje) reflete a marca.
- **U1.2 · Aposentar `index.css`** *(UI-11)* — `CssBaseline` assume o reset. **Aceite:** sem regressão visual perceptível.
- **U2.1 · Biblioteca atômica `src/ui`** *(UI-03/05/06/07/13; absorve EST F4.7)* — `Button`, `TextField`, `Modal`, `Card/StatCard`, `DataTable<T>`, `EmptyState`, `ErrorState`, `Skeletons`, `Feedback`. Os modais migram de `modalStyles.ts` (EST F2.3) para os átomos tokenizados. **Coordenação:** EST F3.3 (`EntityForm`) consome os átomos se já existirem.
- **U2.2 · Varredura hex/sx → tokens** *(UI-02/10/12/14)* — incremental por tela (Home → KPICard → AppHeader → Sidebar → Login → Budgets.css). **Aceite:** contagem de hex caindo por PR (104 → meta ~0 em `src/` fora de `tokens.ts`).
- **U2.3 · Estados padronizados nas telas** *(UI-21/22/23)* — aplicar `EmptyState`/`ErrorState`/`Skeletons`; **exceto Login** (comportamento = SEG S1.3; aqui só o visual).
- **U3.1 · Dashboard moderna** *(UI-19/20)* — hero KPI + `TrendChart`/`TopProductsChart` (`@mui/x-charts` **lazy**, coordenado com os chunks de PERF P0.2).
- **U3.2 · Dark mode toggle** *(UI-15)* — expor `ColorModeContext` no `UserMenu`/`AppHeader`.
- **U3.3 · WCAG AA** *(UI-25)* — contraste, `aria-*`, foco visível; medir com axe/Lighthouse.
- **U3.4 · Confirm/feedback tokenizado** *(UI-31)* — wrapper único; **coordenação:** EST F4.1 tira o `Swal` do hook; U3.4 padroniza o wrapper visual.
- **U3.5 · Lint `no-color-literals`** — governança: impede regressão dos tokens.
- **U3.6 · Storybook (opcional)** — catálogo de `src/ui`.

---

## Apêndice A — Método & Evidência

- **Graphify:** `graph.json` (388 nós/785 arestas) para topologia (`useData()` 30 arestas; 35 `*Props`; styled-components duplicados; `SectionCard` órfão).
- **Varredura estática (ripgrep):** `ThemeProvider`=0; hex=104/23 arq.; `sx=`=288; `style={{`=11; libs de gráfico=0; `ReactDOM.render`/`document.write`=4; fontes carregadas=0.
- **Leitura de código:** `Home`, `KPICard`, `RecentBudgets`, `QuickAccessCard`, `CustomTable`, `ProductTable`, `Products`, `CreateClientModal`, `Login`, `DefaultLayout`, `AppHeader`, `Sidebar`, `PageHeader`, `SectionCard`, `Router`, `index.css`, `Budgets.css`.

**Limitações:** sem execução em browser/profiling visual real (contraste medido por inspeção, não por ferramenta axe/Lighthouse — recomendado pós-P0). Nenhuma alteração de código foi realizada — este é um relatório de diagnóstico.

_Fim da FASE 4 — UI/UX & Design System._

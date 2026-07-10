# PLANO_EXECUCAO_UI_UX.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + MUI 5 + Firebase)
**Origem:** consolida o §5 de [`REPORTE_UI_UX.md`](./REPORTE_UI_UX.md) (specs técnicas nos §3/§4 do reporte)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-09

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
| **U0** | Quick fixes independentes de tema | 4 | ⬜ Pendente |
| **U1** | Fundação: tokens + tema + baseline | 2 | ⬜ Pendente |
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

### U0.1 — KPI "Valor Total" real (UI-18/UI-19; resolve PERF-10) ⬜
Verificado: `Home.tsx:37-43` calcula `totalValue` e `maxBudget`; o card exibe `R$ ---,--` "(Em desenvolvimento)".
- [ ] Exibir `kpiData.totalValue` com `brMoneyMask` no card (spec §4.2-5 do reporte); remover o subtítulo "(Em desenvolvimento)".
- [ ] Decidir `maxBudget`: usar em um KPI/subtitle ou **remover o cálculo** (não deixar reduce morto).
- **Aceite:** dashboard sem placeholder; nenhum cálculo O(N) sem consumidor em `kpiData`.

### U0.2 — Bug responsivo dos filtros (UI-24) ⬜
Verificado: `Budgets.css:283-287` — `.search-input,.filter-select { min-width: 500px }` dentro de `@media (max-width: 900px)`.
- [ ] Trocar por `min-width: 0` (ou remover a linha), mantendo `width: 100%`.
- **Aceite:** sem scroll horizontal em viewport <500px; filtros usáveis no mobile.

### U0.3 — `lang`, fonte real e globais corrigidos (UI-17; UI-11 parcial) ⬜
Verificado: `index.html` com `lang="en"` e sem fonte; `index.css` com `--font-primary:#fff` e `body{color:#fff}` sobre fundo claro.
- [ ] `index.html`: `lang="pt-BR"`; carregar a fonte escolhida (Inter ou Poppins) via `<link>` (preconnect + stylesheet).
- [ ] `index.css`: corrigir os valores quebrados (`--font-primary` → família de fonte de verdade; `body{color}` → cor de texto escura legível). **Não** remover o arquivo ainda — a aposentadoria completa é U1.2 (depende do `CssBaseline`).
- **Aceite:** fonte declarada renderiza de fato; texto legível; HTML com idioma correto.

### U0.4 — Código morto de UI (UI-01/UI-08) ⬜
Verificado: `SectionCard.tsx` com 0 imports em `src/`.
- [ ] Excluir `src/components/SectionCard/` inteiro.
- [ ] Remover o `handleEdit` morto (`console.log`) de `Products.tsx:39-41`.
- **Aceite:** build/lint verdes; nenhum import quebrado.

---

## Fase U1 — Fundação: tokens + tema + baseline

### U1.1 — Tokens + `getTheme(mode)` + `ColorModeContext` + Provider (UI-09/10/15/16) ⬜
A spec completa (código) está no §4.2 do reporte.
- [ ] Criar `src/theme/tokens.ts` (primitivos: brand, ink, semânticas, `radius`, `elevation`) — **única** fonte de cor do app.
- [ ] Criar `src/theme/index.ts` com `getTheme(mode: "light" | "dark")` (palette AA, `shape`, `typography`, overrides de `MuiButton`/`MuiCard`).
- [ ] Criar `src/theme/ColorModeContext.tsx` (estado do modo + toggle; iniciar por `prefers-color-scheme`).
- [ ] `main.tsx`: envolver o app em `ColorModeContext.Provider` + `ThemeProvider` + `CssBaseline`.
- [ ] **Desbloqueios a anunciar no log:** U2 inteiro, U3, e a tokenização dos estilos de modal (antigo EST F4.7, absorvido por U2.1).
- **Aceite:** app renderiza sob o tema; `PageHeader` (único consumidor de `theme.palette` hoje) reflete a marca; alternância de modo funciona programaticamente (toggle visual é U3.2).

### U1.2 — Aposentar `index.css` (UI-11 conclusão) ⬜
- [ ] Migrar o que restar de útil para o tema; remover o arquivo e o import em `main.tsx` (o `CssBaseline` assume reset + background + cor de texto).
- **Aceite:** sem regressão visual perceptível nas telas principais (checar Login, Home, listas).

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
- [ ] Revisar breakpoints 900–1200px dos KPIs (`md=3` → rebalancear) e altura fluida do `DataTable`.
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
| UI-33 (PDF legado, 2 call sites) | EST F4.3 | `PLANO_EXECUCAO_ESTRUTURA.md` |
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

<!--
### AAAA-MM-DD · Ux.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** aceites atendidos; build/lint/test verdes; evidência visual anexada/registrada.
-->

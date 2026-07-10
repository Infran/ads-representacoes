# REPORTE_ESTRUTURA.md — FASE 1: Arquitetura, Estrutura e Code Smells

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase)
**Data da análise:** 2026-07-09
**Plano consolidado em:** 2026-07-09 (revisado após verificação do código-fonte)
**Escopo:** `src/` (10.390 linhas · 72 arquivos `.ts/.tsx`)
**Fonte de topologia:** Graphify (`graphify-out/graph.json` — 388 nós · 785 arestas · 20 comunidades)

> **Status deste documento:** deixou de ser apenas um diagnóstico com sugestões soltas.
> As seções **§1–§3** e **§5** permanecem como a base de evidência (diagnóstico).
> A antiga seção de "sugestões" foi substituída por um **§4 Plano de Implementação Consolidado**
> (arquitetura-alvo, sequenciamento com justificativa, especificação por item e critérios de aceite),
> e o antigo backlog virou o **§6 Roteiro de Execução por Fases**.
> A execução detalhada (checklists + log do que foi feito e por quê) fica em
> [`PLANO_EXECUCAO_ESTRUTURA.md`](./PLANO_EXECUCAO_ESTRUTURA.md).

---

## 1. Sumário Executivo

O código é **funcional e razoavelmente organizado por pastas**, mas apresenta **acoplamento centralizado excessivo** (um único `DataContext` é ponto de passagem de quase toda a aplicação), **duplicação estrutural massiva** (styled-components, camada de services e handlers de cache replicados 4–6×) e **três "God Components"** que concentram responsabilidades de UI, orquestração e lógica de negócio.

| Métrica (Graphify) | Valor | Leitura |
|---|---|---|
| Ciclos de importação | **0** | ✅ Bom — não há dependência circular |
| God node #1 | `useData()` — **30 arestas**, betweenness **0.140** | ⚠️ Ponto único de acoplamento de 8 comunidades |
| God node #2 | `IBudget` — **24 arestas** | ⚠️ Modelo de domínio super-embutido (denormalizado) |
| Coesão média das comunidades | **0.07 – 0.22** | ⚠️ Módulos fracamente interconectados (baixa modularidade) |
| Nós isolados | **136** | ⚠️ Config/constantes soltas; possível código morto |
| `console.*` em produção | **83 ocorrências / 27 arquivos** | ⚠️ Ruído + vazamento de informação |

**Top 5 prioridades estruturais:**
1. **Eliminar código morto** — `Sidebar.old.tsx` (362 linhas, 0 imports).
2. **Fatorar a duplicação de `styled-components`** replicada em 6 modais (~50 linhas idênticas cada).
3. **Extrair um factory genérico para os 4 services** (CRUD + `getNextXId` idênticos 4×).
4. **Quebrar o God Provider `DataContext`** (421 linhas, SRP) e memoizar o `value`.
5. **Quebrar os God Components** `Budgets.tsx` (498) e `BudgetFormPage.tsx` (501).

---

## 2. Topologia e Acoplamento (evidência Graphify)

### 2.1 God Nodes (núcleos de acoplamento)
```
1. useData()        - 30 arestas  (betweenness 0.140) ← ponte entre 8 comunidades
2. IBudget          - 24 arestas
3. brMoneyMask()    - 21 arestas  (fan-out de utilitário — aceitável)
4. IClient          - 17 arestas
5. IProduct         - 17 arestas
6. IRepresentative  - 17 arestas
7. DataProvider()   - 10 arestas
8. getCache()       - 10 arestas
```
**Interpretação:** `useData()` é um *God Interface*. Toda página/modal/hook depende dele. Isso concentra risco: qualquer mudança na forma do contexto propaga para ~8 comunidades, e torna teste isolado de qualquer consumidor impossível sem montar o provider inteiro (ver §5 Testabilidade).

### 2.2 Coesão das comunidades (baixa modularidade)
As comunidades mais problemáticas segundo o relatório do Graphify (quanto menor, mais "solto"):
- `App Header & Layout` — **0.067**
- `Product Management` — **0.103**
- `Budget Form & Data Cache` — **0.108**

O próprio Graphify sugere: *"Should `Budget Form & Data Cache` / `App Header & Layout` / `Product Management` be split into smaller, more focused modules?"* — confirmando os God Components abaixo.

### 2.3 Ciclos
✅ **Nenhum ciclo de importação detectado.** A dependência flui corretamente em camadas: `pages → hooks/components → context → services → firebase`. Manter essa direção nas refatorações.

---

## 3. Inventário Exaustivo de Achados Estruturais

Severidade: 🔴 Alta · 🟠 Média · 🟡 Baixa

### 3.1 God Components / Arquivos Inflados (SRP)

| # | Arquivo | Linha | Problema | Impacto |
|---|---|---|---|---|
| E-01 | `src/pages/BudgetFormPage/BudgetFormPage.tsx` | 50–499 | 🔴 501 linhas. Componente concentra: carregamento (`useEffect`), orquestração de save/cancel, **construção inline de `accordionSections`** (199–417, ~218 linhas de JSX) e renderização de 2 cards de cliente/representante embutidos (239–350). | Baixíssima legibilidade; qualquer alteração de layout força reler o arquivo inteiro; impossível testar seções isoladamente. |
| E-02 | `src/pages/Budgets/Budgets.tsx` | 40–496 | 🔴 498 linhas. Mistura: filtros, ordenação, **renderização manual de PDF em nova aba** (`handleOpenPdf`, 155–177), lista, expand/collapse e gestão de modal de exclusão. | God Component clássico; múltiplas razões para mudar; JSX de item de lista (334–474) deveria ser um componente. |
| E-03 | `src/context/DataContext.tsx` | 100–407 | 🔴 421 linhas. Um único Provider gerencia as **4 entidades** com fetch, refresh, searchLocal e add/update/remove — 4× a mesma estrutura. | SRP violado; arquivo cresce linearmente a cada nova entidade; re-render global (ver P-01). |
| E-04 | `src/components/Modal/Edit/EditRepresentativeModal/EditRepresentativeModal.tsx` | 1–370 | 🟠 370 linhas — form gigante + styled-components duplicados. | Manutenção duplicada com o Create equivalente. |
| E-05 | `src/components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal.tsx` | 1–357 | 🟠 357 linhas — quase espelho do Edit. | Idem. |

### 3.2 Violações DRY (duplicação estrutural)

| # | Arquivo(s) | Linha | Problema | Impacto |
|---|---|---|---|---|
| D-01 | 6 modais CRUD: `CreateClientModal`, `CreateProductModal`, `CreateRepresentativeModal`, `EditClientModal`, `EditProductModal`, `EditRepresentativeModal` | ex.: `CreateClientModal.tsx:22–70` | 🔴 Os **4 styled-components** (`modalStyle`, `FormControlStyled`, `StyledButton`, `StyledTextField`) são **copiados verbatim** em cada modal (~50 linhas × 6 = ~300 linhas redundantes). Cores hardcoded (`#1976d2`, `#1565c0`) ao invés do tema MUI. | Mudança visual exige editar 6 arquivos; risco de divergência; ignora o `ThemeProvider`. |
| D-02 | `budgetServices.ts:83`, `productServices.ts:95`, `clientServices.ts:94`, `representativeServices.ts:100` | — | 🔴 `getNextBudgetId/ProductId/ClientId/RepresentativeId` são **transações idênticas** contra `meta/lastXId` (só muda o nome do doc). | 4× a mesma lógica de atomicidade; corrigir um bug de concorrência exige tocar 4 arquivos. |
| D-03 | `clientServices.ts`, `productServices.ts`, `representativeServices.ts`, `budgetServices.ts` | arquivos inteiros (~187–194 linhas cada) | 🔴 CRUD (`getX`, `getXById`, `addX`, `updateX`, `deleteX`, `validateX`, limpeza de `undefined`) segue o **mesmo molde** nas 4 entidades. | ~750 linhas onde ~250 bastariam com um factory genérico. |
| D-04 | `src/context/DataContext.tsx` | 283–355 | 🟠 12 handlers `add/update/remove*InCache` são o **mesmo corpo** parametrizado por setter/cacheKey. | Repetição pura; propício a copy-paste-error. |
| D-05 | `src/context/DataContext.tsx` | 221–276 | 🟠 4× `searchXLocal` idênticos exceto pelos campos filtrados. | Idem. |
| D-06 | `useBudgetForm.ts:112–137` vs `DataContext.tsx:250–276` | — | 🟡 Lógica de filtro `.name/.ncm.includes(term)` reimplementada no hook e no contexto. | Regras de busca divergem entre telas. |

### 3.3 Violações SOLID e Clean Code

| # | Arquivo | Linha | Problema | Impacto |
|---|---|---|---|---|
| S-01 | `src/hooks/useBudgetForm.ts` | 180–194 | 🟠 **SRP**: hook de estado de formulário dispara `Swal.fire()` (confirmação de UI) dentro de `removeProduct`. Lógica de negócio acoplada a biblioteca de UI. | Hook não testável sem mockar `sweetalert2`; regra de confirmação presa à camada de apresentação. |
| S-02 | `src/pages/Budgets/Budgets.tsx` | 121–138 | 🟠 **OCP**: ordenação por `switch(sortBy)` com 6 casos hardcoded. Adicionar critério = editar o `switch`. | Deveria ser um mapa `sortBy → comparator`. |
| S-03 | `src/hooks/useBudgetForm.ts` | 251–266 | 🟡 **OCP**: campos obrigatórios de "termos" hardcoded em array literal dentro do `useMemo`. | Regras de validação não configuráveis/reutilizáveis. |
| S-04 | `src/pages/BudgetFormPage/BudgetFormPage.tsx` | 199–417 | 🟠 **Long Method / God Render**: array `accordionSections` com JSX profundamente aninhado (5+ níveis) montado inline no corpo do componente. | Complexidade ciclomática visual alta; difícil de revisar. |
| S-05 | `src/context/DataContext.tsx` | 361–404 | 🟠 **ISP**: interface `DataContextState` expõe **~30 membros**. Um consumidor que só quer `products` recebe toda a superfície. | Acoplamento largo; qualquer consumidor "conhece" tudo. |

### 3.4 Código Morto e Inconsistências de Organização

| # | Arquivo | Linha | Problema | Impacto |
|---|---|---|---|---|
| M-01 | `src/components/Sidebar/Sidebar.old.tsx` | 1–362 | 🔴 **Código morto**: 362 linhas, **zero imports** em todo o `src/`. Existe um Sidebar novo/ativo em `src/components/Layout/Sidebar/`. | Confunde navegação, infla bundle de análise, aparece no grafo como ruído. |
| M-02 | `src/services/*Services.ts` | ex.: `representativeServices.ts:69–89` | 🟡 Funções `@deprecated` (`searchRepresentatives` etc.) ainda no código, com `console.warn`. | Superfície de API morta mantida; risco de uso acidental. |
| M-03 | `.gemini/tasks/`, `graphify-out/` | — | 🟡 Artefatos de ferramenta versionados na raiz (aparecem como comunidades no grafo). | Poluição do repositório; considerar `.gitignore`. |

### 3.5 Falhas de Design / Acoplamento com Impacto Funcional

| # | Arquivo | Linha | Problema | Impacto |
|---|---|---|---|---|
| A-01 | `src/pages/Budgets/Budgets.tsx` + `DeleteBudgetModal.tsx` | `Budgets.tsx:477–483` / `DeleteBudgetModal.tsx:17,98` | 🔴 **Semântica de `onClose` conflatada com "excluído com sucesso"**. `DeleteBudgetModal` chama `onClose()` tanto ao excluir (l.17) quanto ao **Cancelar** (l.98). Em `Budgets.tsx` o `onClose` está ligado a `handleDeleteSuccess` → `removeBudgetFromCache`. Resultado: **clicar em "Cancelar" ou no backdrop remove o orçamento da lista** (embora não do Firestore). | Bug de integridade de UI; item some da tela sem ter sido excluído. |
| A-02 | `src/pages/Budgets/Budgets.tsx` | 155–177 | 🟠 `handleOpenPdf` usa `window.open` + `document.write` + `ReactDOM.render` (**API legada do React 18**) para montar árvore React numa aba nova. | Padrão frágil/legado; `ReactDOM.render` está deprecado; escapa ao ciclo de vida do app. |
| A-03 | `src/pages/BudgetFormPage/BudgetFormPage.tsx` | 149 | 🟠 `window.location.reload()` após criar orçamento — **viola explicitamente a regra do `CLAUDE.md`** ("never `window.location.reload()`"; use funções de cache). | Recarrega app inteiro e refaz reads que o cache existe justamente para evitar. |
| A-04 | `src/pages/Budgets/Budgets.tsx` | 111–118 | 🟠 Filtro de valor min/máx compara `parseFloat(minValue)` (reais digitados) com `b.totalValue` (**armazenado em centavos**, ver `CLAUDE.md`). | Filtro por faixa de valor retorna resultados errados (fator 100). |
| A-05 | `src/interfaces/ibudget.ts` + `irepresentative.ts` | 12–27 | 🟠 **Denormalização profunda**: `IBudget` embute cópias completas de `IClient`, `IRepresentative` e snapshots de `IProduct`; `IRepresentative` embute `IClient`. | Cópias podem ficar estáticas/divergentes; explica o alto grau de `IBudget` no grafo (24 arestas). Intencional para snapshot, mas sem estratégia de sincronização documentada. |
| A-06 | `src/components/Modal/Delete/DeleteBudgetModal.tsx` | 55, 71, 88 | 🟡 Acessos sem optional chaining (`budget.client.name`, `budget.selectedProducts.map`, `item.product.unitValue`) com `strict` **desligado** e modelo denormalizado. | Um orçamento com campo ausente quebra a renderização (crash). |
| A-07 | `src/context/DataContext.tsx` | 361 | 🟠 O objeto `value` do Provider **não é memoizado** (`useMemo`). É recriado a cada render, forçando re-render de **todos** os consumidores a cada mudança de qualquer entidade. | Performance (detalhado na Fase 3) + acoplamento de re-render. |

---

## 4. Plano de Implementação Consolidado

> Esta seção substitui as antigas "sugestões". Ela define **para onde** o código vai (arquitetura-alvo),
> **em que ordem** e **por quê** (sequenciamento), e **como** cada mudança é feita e verificada
> (especificação por item com critério de aceite). A quebra operacional em fases com checkboxes
> e o log de execução vivem em [`PLANO_EXECUCAO_ESTRUTURA.md`](./PLANO_EXECUCAO_ESTRUTURA.md).

### 4.0 Arquitetura-alvo

Manter a direção de dependência já saudável (`pages → hooks/components → context → services → firebase`, **0 ciclos**) e reduzir os pontos de acoplamento:

- **Camada de services → factory.** Um `createCrudService<T>(config)` concentra `getAll`, `getById`, `getNextId` (transação atômica), `add`, `update` (com limpeza de `undefined`) e `delete`. Cada `*Services.ts` vira ~20 linhas de configuração. Ponto **único** para corrigir concorrência e serialização.
- **`DataContext` → composição de stores.** Um `createEntityStore<T>(key, fetcher)` produz `{ items, refresh, searchLocal, addToCache, updateInCache, removeFromCache }`. O Provider **compõe 4 stores** em vez de repetir 12 handlers + 4 buscas, e expõe um `value` **memoizado**.
- **UI → componentes pequenos e reutilizáveis.** God Components fatiados em seções/itens testáveis. Estilos dos modais centralizados em **um** módulo.
- **Regras de negócio desacopladas da UI.** Confirmações (`Swal`) saem dos hooks; validação/ordenação viram dados configuráveis (mapas/constantes), não `switch`/arrays inline.

> **Correções de premissa após verificação do código-fonte (2026-07-09):**
> 1. **Não existe `ThemeProvider`/`createTheme` em `src/`** (confirmado por varredura). Logo, "usar tokens do tema"
>    (D-01) **não é acionável hoje** — depende de UI-09 (Fase 4/UI-UX). O plano separa **centralizar agora**
>    (constantes locais compartilhadas) de **tokenizar depois** (bloqueado por UI-09).
> 2. **Vários subcomponentes de orçamento já foram extraídos** (`BudgetAccordion`, `BudgetSummaryPanel`,
>    `ProductSelector`, `ProductList`, `BudgetTermsForm`, `BudgetPreviewModal`). O trabalho restante de E-01 é
>    **menor** que o relatado: extrair o array `accordionSections` inline e os **2 cards** Cliente/Representante
>    embutidos (`BudgetFormPage.tsx:239–350`) para `RepresentativeSection` + um `EntityInfoCard` reutilizável.
> 3. **Há drift real na limpeza de `undefined`**: `budgetServices` usa um helper nomeado `removeUndefinedFields`;
>    `representativeServices` faz a mesma coisa **inline**. Isso reforça D-03 (o factory elimina o drift).

### 4.1 Princípios de sequenciamento (por que esta ordem)

1. **Bug funcional antes de refactor.** A-01 e A-04 produzem comportamento errado **hoje**, são de risco ~nulo e não dependem de nada. Vêm primeiro (Fase 0).
2. **Rede de segurança antes de mexer em estrutura.** Não há suíte de testes (§5). As refatorações grandes (factory de services D-02/D-03 e store do `DataContext` E-03) **precisam** de *characterization tests* antes, senão refatoramos às cegas. Por isso a Fase 1 é a rede de testes, imediatamente antes das Fases 2–3.
3. **Desduplicar antes de fatiar.** Reduzir services e contexto (Fase 2) diminui a superfície que os God Components consomem, tornando a quebra de UI (Fase 3) mais simples.
4. **Polimento por último.** Itens de baixo risco e alto volume (remover 83 `console.*`, rota de PDF, remover `@deprecated`) ficam na Fase 4 para não competir com o caminho crítico.
5. **Respeitar dependências entre auditorias.** D-01 (tokenização) espera UI-09; A-07 (memoizar) é o mesmo item que PERF-06 — fazemos uma vez, na Fase 0, e marcamos como resolvido nas duas trilhas.

### 4.2 Roadmap por fases

| Fase | Tema | Itens (achados) | Risco | Esforço | Pré-requisito |
|---|---|---|---|---|---|
| **F0** | Estabilização: bugs funcionais + limpeza | A-01, A-04, A-03, A-06, A-07, M-01, M-03 | 🟢 Baixo | S | — |
| **F1** | Rede de segurança (testes de caracterização) | (base para F2/F3) | 🟢 Baixo | M | F0 |
| **F2** | Desduplicação estrutural | D-02, D-03, D-04, D-05, S-05, D-01(parcial) | 🟠 Médio | M–L | F1 |
| **F3** | Quebra de God Components | E-01, E-02, E-04, E-05, S-04 | 🟠 Médio | L | F1 (idealmente F2) |
| **F4** | Refino & dívida técnica | S-01, S-02, S-03, A-02, A-05, M-02, D-06, console.*, D-01(tokenização) | 🟢 Baixo | M | F3; D-01 espera UI-09 |

### 4.3 Especificação por item

Cada item traz: **origem** (achados), **mudança concreta** (arquivos), **critério de aceite** e **notas**.

#### Fase 0 — Estabilização

- **F0.1 · Corrigir semântica do modal de exclusão** — *origem: A-01.*
  `DeleteBudgetModal` passa a expor **`onDeleted`** (chamado **só** após `deleteBudget` bem-sucedido, l.17) separado de **`onClose`** (fechar/cancelar/backdrop, l.24 e l.98). Em `Budgets.tsx`, ligar `removeBudgetFromCache` a `onDeleted`; `onClose` apenas fecha o modal (`setDeleteModalId(null)`).
  **Aceite:** cancelar ou clicar no backdrop **não** remove o orçamento da lista; excluir remove da lista e do Firestore.

- **F0.2 · Corrigir unidade do filtro de valor** — *origem: A-04.*
  Em `Budgets.tsx:111–118`, converter `minValue`/`maxValue` (reais digitados) para **centavos** antes de comparar com `totalValue`. Reutilizar `formatCurrencyToNumber`/`brMoneyMask` de `utils/Masks.ts`.
  **Aceite:** filtrar por "1000–2000" retorna orçamentos com total entre R$ 1.000 e R$ 2.000 (não fator 100 errado).

- **F0.3 · Remover `window.location.reload()`** — *origem: A-03.*
  Em `BudgetFormPage.tsx:149`, no ramo "Adicionar Outro", substituir o reload por **reset de estado do formulário** (limpar `budget`/`selectedProducts` via `useBudgetForm`, mantendo `DEFAULT_BUDGET`).
  **Aceite:** "Adicionar Outro" limpa o formulário sem recarregar a página nem refazer reads do Firestore.

- **F0.4 · Endurecer `DeleteBudgetModal` contra dados ausentes** — *origem: A-06.*
  Adicionar optional chaining/guards em `budget.client?.name`, `budget.selectedProducts?.map`, `item.product?.unitValue` (l.55, 71, 88).
  **Aceite:** um orçamento com `client`/`selectedProducts` ausente abre o modal sem crash.

- **F0.5 · Memoizar o `value` do `DataContext`** — *origem: A-07 (= PERF-06).*
  Envolver o objeto `value` (l.361) em `useMemo` com as dependências corretas (as 4 arrays + `loading` + `loadingEntities` + funções já estáveis via `useCallback`).
  **Aceite:** mudar uma entidade não recria o `value` por identidade quando as demais não mudaram; consumidores que dependem só de `products` não re-renderizam por mudança em `budgets` (verificação preliminar; ganho pleno vem com F2.2).

- **F0.6 · Remover código morto** — *origem: M-01.*
  Excluir `src/components/Sidebar/Sidebar.old.tsx` e a pasta `src/components/Sidebar/` se ficar vazia (o Sidebar ativo é `src/components/Layout/Sidebar/`). Confirmado: **0 imports** em `src/`.
  **Aceite:** `npm run build` e `npm run lint` passam; nenhum import quebrado.

- **F0.7 · Ignorar artefatos de ferramenta** — *origem: M-03.*
  Adicionar `graphify-out/` e artefatos `.gemini/` ao `.gitignore` (preservar `AUDITORIAS/`, que é documentação intencional).
  **Aceite:** `git status` não lista mais os artefatos gerados; `AUDITORIAS/` continua versionado.

#### Fase 1 — Rede de segurança

- **F1.1 · Instalar e configurar Vitest + React Testing Library** — *origem: §5, EST-15.*
  Adicionar `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`; script `test`; config em `vite.config`/`vitest.config`.
  **Aceite:** `npm run test` executa um teste trivial verde.

- **F1.2 · Characterization tests do comportamento atual** — *origem: §5.*
  Cobrir o que as Fases 2–3 podem quebrar: `useBudgetForm` (`totalValue` respeitando `customUnitValue`; `sectionValidation` das 3 seções), `cacheService` (TTL de 5 min, `add/update/remove`, espelho em `localStorage`) e **regressões** para F0.1 (onClose≠onDeleted) e F0.2 (filtro em centavos).
  **Aceite:** testes verdes descrevendo o comportamento **atual/correto**; servem de rede para F2/F3.

#### Fase 2 — Desduplicação estrutural

- **F2.1 · Factory genérico de services** — *origem: D-02, D-03.*
  Criar `src/services/createCrudService.ts` — `createCrudService<T>({ collectionName, metaIdDoc, validate, timestamp })` encapsulando `getAll`, `getById`, `getNextId` (transação), `add`, `update` (com limpeza de `undefined` unificada) e `delete`. Migrar os 4 services para configuração. Unificar o drift `removeUndefinedFields` (helper nomeado vs. inline).
  **Aceite:** os 4 services expõem a **mesma API pública** de antes (não quebrar `DataContext`); testes de F1 verdes; ~500 linhas a menos.

- **F2.2 · Store factory no `DataContext`** — *origem: D-04, D-05, S-05, E-03(parcial), A-07.*
  Extrair `createEntityStore<T>(key, fetcher)` retornando `{ items, refresh, searchLocal, addToCache, updateInCache, removeFromCache }`. O Provider compõe 4 stores; remover os 12 handlers e as 4 buscas repetidas. `value` já memoizado (F0.5) — revalidar deps.
  **Aceite:** superfície de `useData()` inalterada para os consumidores; testes de F1 verdes; arquivo do contexto encolhe substancialmente.

- **F2.3 · Centralizar styled-components dos modais (sem tokenizar)** — *origem: D-01 (parte 1 de 2).*
  Criar `src/components/Modal/modalStyles.ts` exportando `modalStyle`, `FormControlStyled`, `StyledButton`, `StyledTextField` **uma vez** e importar nos 6 modais. **Manter as cores atuais como constantes nomeadas** (ex.: `MODAL_PRIMARY = "#1976d2"`) — **não** trocar por `theme.palette.*` ainda (sem `ThemeProvider`). A tokenização fica em F4 (dependente de UI-09).
  **Aceite:** ~300 linhas removidas; aparência idêntica; 1 lugar para editar estilo de modal.

#### Fase 3 — Quebra de God Components

- **F3.1 · Fatiar `BudgetFormPage`** — *origem: E-01, S-04.*
  Extrair o array `accordionSections` inline para componentes: `RepresentativeSection`, `ProductsSection`, `TermsSection` (esta pode só encapsular o já existente `BudgetTermsForm`). Extrair os 2 cards Cliente/Representante (l.239–350) para um `EntityInfoCard` reutilizável (também usado no `BudgetSummaryPanel`). Reaproveitar os subcomponentes **já existentes** (`ProductSelector`, `ProductList`, `BudgetAccordion`).
  **Aceite:** `BudgetFormPage` cai bem abaixo de ~200 linhas; comportamento de criação/edição idêntico; seções testáveis isoladamente.

- **F3.2 · Fatiar `Budgets`** — *origem: E-02, S-02.*
  Extrair `useBudgetFilters()` (estado + `useMemo` de filtro/ordenação, l.60–149), `<BudgetListItem budget />` (l.334–474) e mover `handleOpenPdf` para um util (temporário até F4.3 trocar por rota). Aproveitar para trocar o `switch` de ordenação por um mapa `Record<SortOption, comparator>` (S-02).
  **Aceite:** `Budgets.tsx` vira orquestração enxuta; lista renderiza item por componente; ordenação por mapa.

- **F3.3 · Unificar modais Create/Edit por entidade** — *origem: E-04, E-05.*
  Extrair `<EntityForm mode="create|edit" />` compartilhado por entidade (Cliente, Produto, Representante), seguindo o padrão de `BudgetFormPage`. Reduz o espelhamento Create/Edit.
  **Aceite:** Create e Edit de cada entidade usam o mesmo form; CRUD e atualização de cache preservados; estilos de F2.3.

#### Fase 4 — Refino & dívida técnica

- **F4.1 · Desacoplar `useBudgetForm` do `Swal`** — *origem: S-01.*
  `removeProduct(index)` apenas remove; a confirmação vira responsabilidade da UI (via callback `onConfirmRemove` injetado ou confirmação em `ProductList`/página).
  **Aceite:** hook testável sem mockar `sweetalert2`; UX de confirmação preservada.

- **F4.2 · Config em vez de hardcode** — *origem: S-02, S-03.*
  Mapa de comparadores de ordenação (se não feito em F3.2) e `REQUIRED_TERM_FIELDS` como constante exportada reutilizável.
  **Aceite:** adicionar critério/ campo obrigatório não exige editar `switch`/`useMemo`.

- **F4.3 · Rota React de PDF** — *origem: A-02.*
  Criar rota `/Orcamentos/PDF/:id` renderizando um `BudgetPdfPage` dentro do app, substituindo `window.open`+`document.write`+`ReactDOM.render`.
  **Aceite:** "Ver PDF" abre a rota (ou nova aba apontando para ela) sem API legada; nada de `ReactDOM.render`.

- **F4.4 · Remover funções `@deprecated`** — *origem: M-02.*
  Excluir `searchRepresentatives`/equivalentes já substituídas por `searchXLocal`.
  **Aceite:** nenhum import quebra; build/lint verdes.

- **F4.5 · Logger com nível por env** — *origem: §1 (83 `console.*`).*
  Introduzir um `logger` fino controlado por `import.meta.env` (silencioso em produção) e substituir os `console.*`.
  **Aceite:** produção sem ruído/vazamento; dev mantém logs.

- **F4.6 · Documentar estratégia de denormalização** — *origem: A-05.*
  ADR curto explicando que os embutidos em `IBudget`/`IRepresentative` são **snapshots intencionais** e como/quando (não) são sincronizados.
  **Aceite:** decisão registrada; sem mudança de código obrigatória.

- **F4.7 · Tokenizar estilos dos modais** — *origem: D-01 (parte 2 de 2), depende de UI-09.*
  Após a introdução do `ThemeProvider` (trilha UI/UX), trocar as constantes de cor de `modalStyles.ts` por `theme.palette.*`.
  **Aceite:** modais consomem o tema; nenhum hex hardcoded em `modalStyles.ts`.

### 4.4 Dependências entre trilhas de auditoria

| Item de Estrutura | Relação |
|---|---|
| **F0.5 (memoizar `value`)** | É o **mesmo** item que **PERF-06** — executar uma vez, marcar resolvido nas duas trilhas. |
| **F2.3 / F4.7 (estilos de modal)** | A tokenização depende de **UI-09** (introduzir `ThemeProvider`). Centralizar já; tokenizar depois. |
| **F1 (testes)** | Rede de segurança para as refatorações de **PERF** (ex.: paginação/queries) além das de Estrutura. |
| **A-05 (denormalização)** | Interage com **SEG** (validação server-side) e **PERF** (leituras) — o ADR deve referenciar ambas. |

---

## 5. Avaliação de Testabilidade

| Barreira | Evidência | Consequência |
|---|---|---|
| Acoplamento a `useData()` (30 arestas) | Todo componente relevante importa `useData` | Nenhum componente testável sem montar `DataProvider` + mock de 4 services. |
| Efeitos colaterais de UI em hooks | `useBudgetForm` chama `Swal.fire` (S-01) | Testes de unidade do hook exigem mock de `sweetalert2`. |
| Services acoplados diretamente a `firebase` (import de `db`) | `representativeServices.ts:12` etc. | Sem injeção de dependência; testar CRUD exige emulador/mocks de `firebase/firestore`. |
| `value` não memoizado + contexto único | `DataContext.tsx:361` | Efeitos de re-render dificultam testes determinísticos de render. |
| Ausência total de suíte de testes | `CLAUDE.md` confirma "no test suite" | Refatorações sem rede de segurança — priorizar testes de caракterização antes das mudanças estruturais grandes. |

**Recomendação:** introduzir Vitest + React Testing Library e escrever *characterization tests* para `useBudgetForm` (cálculo de `totalValue`, `sectionValidation`) e para o factory de cache **antes** de executar as refatorações D-02/D-03/E-03. Isso está materializado como a **Fase 1** do §4.

---

## 6. Roteiro de Execução por Fases

> O antigo backlog solto virou o roteiro sequenciado abaixo. Os checklists operacionais (com checkboxes),
> critérios de aceite por passo e o **log do que foi feito e por quê** ficam em
> [`PLANO_EXECUCAO_ESTRUTURA.md`](./PLANO_EXECUCAO_ESTRUTURA.md). A tabela abaixo é o mapa
> achado → fase → arquivo(s), ordenado por dependência.

| Fase | Item | Achados cobertos | Arquivo(s) principal(is) | Esforço |
|---|---|---|---|---|
| **F0** | Corrigir modal de exclusão (`onClose`≠`onDeleted`) | A-01 | `DeleteBudgetModal.tsx`, `Budgets.tsx` | XS |
| **F0** | Corrigir unidade do filtro de valor (centavos) | A-04 | `Budgets.tsx` | XS |
| **F0** | Remover `window.location.reload()` | A-03 | `BudgetFormPage.tsx` | XS |
| **F0** | Optional chaining no modal de exclusão | A-06 | `DeleteBudgetModal.tsx` | XS |
| **F0** | Memoizar `DataContext.value` (= PERF-06) | A-07 | `DataContext.tsx` | S |
| **F0** | Remover `Sidebar.old.tsx` | M-01 | `components/Sidebar/` | XS |
| **F0** | `.gitignore` para artefatos de ferramenta | M-03 | `.gitignore` | XS |
| **F1** | Vitest + RTL + characterization tests | §5 | `vite.config`, `__tests__/` | M |
| **F2** | Factory `createCrudService<T>` | D-02, D-03 | `services/*` | M–L |
| **F2** | `createEntityStore<T>` + limpeza do contexto | D-04, D-05, S-05, E-03 | `DataContext.tsx` | M |
| **F2** | Centralizar styled-components dos modais | D-01 (parcial) | `Modal/modalStyles.ts` + 6 modais | S |
| **F3** | Fatiar `BudgetFormPage` | E-01, S-04 | `BudgetFormPage/` + `components/Budget/` | M |
| **F3** | Fatiar `Budgets` (+ mapa de ordenação) | E-02, S-02 | `Budgets/` | M |
| **F3** | `EntityForm` compartilhado Create/Edit | E-04, E-05 | `Modal/Create|Edit/*` | M |
| **F4** | Desacoplar `useBudgetForm` do `Swal` | S-01 | `useBudgetForm.ts` | S |
| **F4** | Config (comparators / `REQUIRED_TERM_FIELDS`) | S-02, S-03 | `Budgets/`, `useBudgetForm.ts` | S |
| **F4** | Rota React de PDF | A-02 | `Router.tsx`, `pages/…PDF` | M |
| **F4** | Remover funções `@deprecated` | M-02, D-06 | `services/*` | XS |
| **F4** | Logger por env (remover 83 `console.*`) | §1 | `utils/logger.ts` + 27 arquivos | S |
| **F4** | ADR de denormalização | A-05 | `AUDITORIAS/…/ADR` | XS |
| **F4** | Tokenizar `modalStyles` (depende de UI-09) | D-01 (parte 2) | `Modal/modalStyles.ts` | XS |

---

_Fim da FASE 1. Este documento passou de diagnóstico com sugestões para **diagnóstico + plano consolidado**._
_Nenhuma alteração de código de produção foi realizada até aqui — o que existe são os artefatos de planejamento (§4/§6 e o `PLANO_EXECUCAO_ESTRUTURA.md`). As Fases 2 (Segurança) e 3 (Performance) da auditoria aprofundarão os itens marcados como "detalhado na Fase X"._

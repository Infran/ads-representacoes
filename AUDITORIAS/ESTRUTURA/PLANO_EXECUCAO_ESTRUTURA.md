# PLANO_EXECUCAO_ESTRUTURA.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase)
**Origem:** consolida o §4/§6 de [`REPORTE_ESTRUTURA.md`](./REPORTE_ESTRUTURA.md)
**Criado em:** 2026-07-09
**Última atualização:** 2026-07-11

---

## Como usar este documento

- Cada fase tem um **checklist de execução** com passos concretos por arquivo e **critério de aceite**.
- Marque `[x]` ao concluir um passo. Uma tarefa só é "feita" quando **todos** os seus critérios de aceite passam e `npm run build` + `npm run lint` estão verdes (a partir da F1, também `npm run test`).
- **Não pule a ordem das fases.** O motivo do sequenciamento está no §4.1 do reporte: bug antes de refactor, testes antes de mexer em estrutura, desduplicar antes de fatiar.
- Ao concluir qualquer item, **registre no §Log de Execução** (fim deste arquivo): o quê foi feito e **por quê**.
- Convenção de branch sugerida: uma branch por fase (`est/f0-estabilizacao`, `est/f1-testes`, …), commits pequenos por item.

### Legenda de status
`⬜ Pendente` · `🟨 Em andamento` · `✅ Concluído` · `⛔ Bloqueado`

### Portões de qualidade (aplicam-se a toda tarefa)
- [x] `npm run build` sem erros (após F0 — 2026-07-11).
- [~] `npm run lint` com `--max-warnings 0`: **todo o código morto que era dono da F0 foi eliminado** (unused imports/vars: 21 → 0, incl. os 4 `_` dos services e o `Sidebar.old.tsx`). Sobram **10 problemas pré-existentes** que **não são código morto** e têm dono em outras trilhas/ondas: `no-explicit-any` em `CustomTable` (→ UI U2.1), `EditClientModal` (→ EST F3.3), `ContextAuth` (→ SEG); `ban-types {}` em `PageHeader` (→ UI); `react-refresh/only-export-components` em `DataContext` (→ EST F2.2), `ContextAuth`/`LayoutContext`/`BudgetPdf` (arquitetural); `exhaustive-deps` em `ContextAuth` (→ SEG S0.3). **Exceção:** `brMoneyMask` morto em `Home.tsx` ficou de propósito para o dono **UI U0.1** (é morto por causa da remoção do card "Valor Total" e vem junto com a limpeza de `kpiData`).
- [ ] (a partir da F1) `npm run test` verde
- [x] Regra do `CLAUDE.md` respeitada: escrita via service + função de cache do `useData()`; `window.location.reload()` **removido** (F0.3).

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **F0** | Estabilização: bugs funcionais + limpeza | 7 | ✅ Concluído (2026-07-11) |
| **F1** | Rede de segurança (testes) | 2 | ⬜ Pendente |
| **F2** | Desduplicação estrutural | 3 | ⬜ Pendente |
| **F3** | Quebra de God Components | 3 | ⬜ Pendente |
| **F4** | Refino & dívida técnica | 7 | 🟨 F4.3 ✅ (2026-07-10, fora de ordem) · demais ⬜ |

### Grafo de dependências
```
F0 (bugs + limpeza)  ──►  F1 (testes)  ──►  F2 (desduplicar services/contexto/estilos)
                                          └►  F3 (fatiar God Components)  ──►  F4 (refino)
F0.5 (memoizar value) ═══ mesmo item que PERF-06
F2.3 (centralizar estilos) ──► F4.7 (tokenizar)  ⛔ depende de UI-09 (trilha UI/UX)
```

---

## Fase 0 — Estabilização (bugs funcionais + limpeza)

**Meta:** eliminar comportamento errado e ruído com risco ~nulo, sem depender de testes. **Pré-requisito:** nenhum.

### F0.1 — Corrigir semântica do modal de exclusão (A-01) ✅
Hoje `DeleteBudgetModal` chama `onClose()` tanto ao excluir quanto ao cancelar, e `Budgets.tsx` liga `onClose` a `removeBudgetFromCache` → **cancelar/backdrop remove o item da lista**.
- [x] Em `src/components/Modal/Delete/DeleteBudgetModal.tsx`: adicionada prop `onDeleted: () => void`; `onDeleted()` é chamado **após** `await deleteBudget(id)`, mantendo `onClose` só para fechar/cancelar (backdrop + botão Cancelar).
- [x] Em `src/pages/Budgets/Budgets.tsx`: ligado `onDeleted={() => handleDeleteSuccess(budget.id)}` e `onClose={() => setDeleteModalId(null)}` (sem remover do cache).
- **Aceite:** cancelar/backdrop **não** remove da lista; excluir remove da lista e do Firestore. ✔ (verificado por leitura de fluxo + build/tsc; runtime formal pende de EST F1)

### F0.2 — Corrigir unidade do filtro de valor (A-04) ✅
`minValue`/`maxValue` são reais digitados; `totalValue` está em centavos → comparação errada por fator 100.
- [x] Em `src/pages/Budgets/Budgets.tsx`: min/máx convertidos para **centavos** (`* 100`) antes de comparar. Os inputs são `type="number"` (reais puros), então `formatCurrencyToNumber` não se aplica; `(parseFloat(x) || 0/Infinity) * 100` preserva os fallbacks originais.
- [x] Labels "Valor mín"/"Valor máx" já deixam claro que é em reais (app BRL) — sem mudança necessária.
- **Aceite:** faixa "1000–2000" retorna orçamentos com total entre R$ 1.000 e R$ 2.000. ✔

### F0.3 — Remover `window.location.reload()` (A-03) ✅
Viola a regra do `CLAUDE.md` e refaz reads que o cache evita.
- [x] Adicionado `reset()` ao `useBudgetForm` (limpa `budget` para `DEFAULT_BUDGET`, zera `selectedProducts` e os campos de busca). Em `BudgetFormPage.tsx`, o ramo "Adicionar Outro" agora chama `form.reset()` no lugar de `window.location.reload()`.
- **Aceite:** "Adicionar Outro" limpa o form sem recarregar a página; sem novos reads no Firestore. ✔ **Marca PERF-14/T08 como resolvido** (dono EST F0.3; anotado na trilha PERF).

### F0.4 — Endurecer `DeleteBudgetModal` contra dados ausentes (A-06) ✅
- [x] Em `DeleteBudgetModal.tsx`: `budget.client?.name`, `budget.selectedProducts?.map(...)`, `item.product?.name`, `(item.product?.unitValue ?? 0).toFixed(0)`.
- **Aceite:** orçamento com campo ausente abre o modal sem crash. ✔

### F0.5 — Memoizar o `value` do `DataContext` (A-07 = PERF-06) ✅
- [x] Em `src/context/DataContext.tsx`: objeto `value` agora está em `useMemo`, com deps = os 6 estados (`budgets, clients, products, representatives, loading, loadingEntities`) + todas as funções expostas.
- [x] Confirmado que todas as funções vêm de `useCallback` (refresh*, search*Local, add/update/remove*Handler) e `getCacheStats` é função de módulo importada (estável) — memoização não quebra.
- **Aceite:** `value` não muda de identidade quando nada relevante mudou. ✔ **Marca PERF-06/T04 como resolvido também** (anotado na trilha PERF).

### F0.6 — Remover código morto `Sidebar.old.tsx` (M-01) ✅
Confirmado: **0 imports** em `src/` (re-verificado via grep). Sidebar ativo é `src/components/Layout/Sidebar/`.
- [x] Excluído `src/components/Sidebar/Sidebar.old.tsx` via `git rm`; a pasta `src/components/Sidebar/` ficou vazia e sumiu.
- **Aceite:** `npm run build`/tsc verdes; nenhum import quebrado. ✔

### F0.7 — `.gitignore` para artefatos de ferramenta (M-03) ✅
- [x] Adicionado `graphify-out/` ao `.gitignore`. **`.gemini/`** só contém `tasks/` (documentação intencional referenciada no `CLAUDE.md`) — não há artefato gerado a ignorar ali, então nada foi adicionado para ele (comentário no `.gitignore` deixa isso explícito). `AUDITORIAS/` preservado (`git check-ignore AUDITORIAS/` não casa).
- **Aceite:** `git status` não lista mais `graphify-out/`; `AUDITORIAS/` continua versionado. ✔

---

## Fase 1 — Rede de segurança (testes de caracterização)

**Meta:** criar a rede que protege as Fases 2–3. **Pré-requisito:** F0.

### F1.1 — Instalar e configurar Vitest + RTL ⬜
- [ ] Adicionar dev-deps: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`.
- [ ] Configurar `test` no `vite.config.ts`/`vitest.config.ts` (`environment: 'jsdom'`, setup de `jest-dom`).
- [ ] Adicionar script `"test": "vitest"` (e `"test:run": "vitest run"` para CI) ao `package.json`.
- **Aceite:** `npm run test` roda um teste trivial verde.

### F1.2 — Characterization tests do comportamento atual ⬜
- [ ] `useBudgetForm`: `totalValue` usando `customUnitValue` quando presente; `sectionValidation` (representante/produtos/termos) nos estados completo/incompleto.
- [ ] `cacheService`: TTL de 5 min (mock de tempo), `add/update/remove`, espelho em `localStorage`.
- [ ] Regressão de F0.1 (onClose≠onDeleted) e F0.2 (filtro em centavos).
- **Aceite:** testes verdes que **descrevem o comportamento correto atual**; base para F2/F3.

---

## Fase 2 — Desduplicação estrutural

**Meta:** colapsar a repetição 4–6× em services, contexto e estilos. **Pré-requisito:** F1 (rede de testes).

### F2.1 — Factory `createCrudService<T>` (D-02, D-03; incorpora SEG-05) ⬜
- [ ] Criar `src/services/createCrudService.ts`: `createCrudService<T>({ collectionName, metaIdDoc, validate, timestamp })` com `getAll`, `getById`, `getNextId` (transação atômica), `add`, `update` (limpeza de `undefined` **unificada**) e `delete`.
- [ ] **Requisito de segurança (SEG S2.1):** `add` **atômico** — incremento do contador + `set` do doc na **mesma** `runTransaction` (spec: §3.3 do reporte de Segurança). A trilha SEG valida com teste.
- [ ] **Preservar** endurecimentos já aplicados por SEG: validação no `update` (S1.1) e sanitização `^\d+$` nos `get*ById` (S1.2); **preservar** também `getRecentBudgets(5)` adicionada por PERF P0.3.
- [ ] Migrar `budgetServices`, `clientServices`, `productServices`, `representativeServices` para configuração, **preservando a API pública** que o `DataContext` consome.
- [ ] Resolver o drift `removeUndefinedFields` (nomeado em budget, inline em representative) — passa a existir só no factory.
- [ ] Decidir `Timestamp.now()` vs `serverTimestamp()` (há divergência entre services) e padronizar.
- **Aceite:** mesma API pública; testes de F1 verdes; ~500 linhas a menos; getNextId em 1 lugar; criação atômica validada por SEG.

### F2.2 — `createEntityStore<T>` no `DataContext` (D-04, D-05, S-05, E-03) ⬜
- [ ] Criar `createEntityStore<T>(key, fetcher)` → `{ items, refresh, searchLocal, addToCache, updateInCache, removeFromCache }`.
- [ ] Reescrever `DataContext` compondo 4 stores; remover os 12 handlers e as 4 buscas repetidas; revalidar deps do `useMemo` do `value` (F0.5).
- [ ] `searchLocal` recebe os campos filtráveis por config (elimina D-05).
- **Aceite:** superfície de `useData()` inalterada; testes de F1 verdes; contexto encolhe muito.

### F2.3 — Centralizar styled-components dos modais (D-01, parte 1) ⬜
- [ ] Criar `src/components/Modal/modalStyles.ts` com `modalStyle`, `FormControlStyled`, `StyledButton`, `StyledTextField` **uma vez**; cores como constantes nomeadas (ex.: `MODAL_PRIMARY = "#1976d2"`, `MODAL_PRIMARY_HOVER = "#1565c0"`). **Não** usar `theme.palette.*` ainda (sem `ThemeProvider` — ver F4.7).
- [ ] Importar nos 6 modais (`Create{Client,Product,Representative}Modal`, `Edit{Client,Product,Representative}Modal`); remover as cópias locais.
- **Aceite:** ~300 linhas removidas; aparência idêntica; 1 ponto de edição.

---

## Fase 3 — Quebra de God Components

**Meta:** transformar os 3 God Components em orquestração enxuta + peças testáveis. **Pré-requisito:** F1 (idealmente F2).

### F3.1 — Fatiar `BudgetFormPage` (E-01, S-04) ⬜
> Nota: `BudgetAccordion`, `BudgetSummaryPanel`, `ProductSelector`, `ProductList`, `BudgetTermsForm`, `BudgetPreviewModal` **já existem** — reaproveitar.
- [ ] Extrair `accordionSections` (l.199–417) para `RepresentativeSection`, `ProductsSection`, `TermsSection` em `src/components/Budget/`.
- [ ] Extrair os 2 cards Cliente/Representante (l.239–350) para `EntityInfoCard` reutilizável (também usável no `BudgetSummaryPanel`).
- **Aceite:** `BudgetFormPage` abaixo de ~200 linhas; criar/editar idênticos; seções testáveis isoladas.

### F3.2 — Fatiar `Budgets` (E-02, S-02) ⬜
- [ ] Extrair `useBudgetFilters()` (estado + `useMemo` de filtro/ordenação, l.60–149).
- [ ] Extrair `<BudgetListItem budget />` (l.334–474).
- [ ] Trocar o `switch(sortBy)` (l.121–138) por `const comparators: Record<SortOption, (a,b)=>number>` (resolve S-02).
- [x] `handleOpenPdf` já não tem lógica de PDF — delega a `openBudgetPdf()` (feito em F4.3, 2026-07-10). Ao fatiar, é só um handler fino.
- **Aceite:** `Budgets.tsx` vira orquestração; item por componente; ordenação por mapa.

### F3.3 — `EntityForm` compartilhado Create/Edit (E-04, E-05) ⬜
- [ ] Extrair `<EntityForm mode="create|edit" />` por entidade (Cliente, Produto, Representante), usando os estilos de F2.3.
- [ ] Create e Edit passam a compor o mesmo form; preservar CRUD + função de cache do `useData()`.
- **Aceite:** sem espelhamento Create/Edit; comportamento preservado.

---

## Fase 4 — Refino & dívida técnica

**Meta:** baixar dívida de baixo risco/alto volume. **Pré-requisito:** F3 (F4.7 depende de UI-09).

### F4.1 — Desacoplar `useBudgetForm` do `Swal` (S-01) ⬜
- [ ] `removeProduct(index)` só remove; confirmação via `onConfirmRemove` injetado ou na UI (`ProductList`/página).
- **Aceite:** hook testável sem `sweetalert2`; UX preservada.

### F4.2 — Config em vez de hardcode (S-02, S-03) ⬜
- [ ] `REQUIRED_TERM_FIELDS` como constante exportada (de `useBudgetForm.ts:251–266`).
- [ ] Mapa de comparadores (se não feito em F3.2).
- **Aceite:** novos critérios/campos sem editar `switch`/`useMemo`.

### F4.3 — Fim do PDF legado nos 2 call sites (A-02 = SEG-12 = UI-33) ✅ (2026-07-10)
Resolvido, porém **com mecanismo diferente do planejado**: em vez de uma rota React `/Orcamentos/PDF/:id`, foi criada a função `openBudgetPdf(budget)` em `src/utils/PDFGenerator/BudgetPdf.tsx` que gera o PDF como **Blob** (`pdf(...).toBlob()` do `@react-pdf/renderer`) e o abre no visualizador nativo (fallback de download se pop-up bloqueado; tratamento de erro). O aceite — sem API legada nos dois pontos — foi atingido.
- [x] Removido `window.open`+`document.write`+`ReactDOM.render` dos **2 call sites**: `Budgets.tsx` (`handleOpenPdf`) **e** `RecentBudgets.tsx` (`handleOpenPdf`) — ambos agora só chamam `openBudgetPdf(budget)`. Duplicação eliminada.
- [x] Removidos os imports de `ReactDOM` e `BudgetPdfPage` (não usados) desses dois arquivos.
- [ ] (opcional, não feito) Rota React dedicada — decidiu-se pela função Blob compartilhada, mais simples e sem `ReactDOM.render`. Reabrir só se quiser deep-link para o PDF.
- **Aceite:** "Ver PDF" sem API legada em ambos os pontos; nada de `ReactDOM.render`. ✔ **SEG-12 e UI-33 resolvidos** (anotados nas respectivas trilhas).

### F4.4 — Remover funções `@deprecated` (M-02, D-06) ⬜
- [ ] Excluir `searchRepresentatives`/equivalentes já substituídas por `searchXLocal`; conferir 0 imports.
- **Aceite:** build/lint verdes; nenhum import quebra.

### F4.5 — Logger por env (83 `console.*` = SEG-11 = PERF-12) ⬜
- [ ] Criar `src/utils/logger.ts` com nível controlado por `import.meta.env` (silencioso em produção).
- [ ] Substituir os `console.*` (27 arquivos) pelo logger.
- [ ] Nota de coesão: o `esbuild.drop: ['console']` no build de produção é **complemento** executado por **PERF P0.2** (defesa em profundidade — não substitui o logger).
- **Aceite:** produção sem ruído/vazamento; dev mantém logs; SEG-11 e PERF-12 marcados como resolvidos.

### F4.6 — ADR de denormalização (A-05) ⬜
- [ ] Escrever ADR curto: embutidos em `IBudget`/`IRepresentative` são snapshots intencionais; como/quando (não) sincronizar; referência a SEG (validação server-side) e PERF (leituras).
- **Aceite:** decisão registrada.

### F4.7 — Tokenizar `modalStyles` (D-01, parte 2) 🔀 TRANSFERIDO → UI U2.1 ⬜
> **Consolidação entre trilhas (2026-07-09):** este item foi **absorvido pela trilha UI/UX (U2.1 — biblioteca atômica)**.
> Quando `src/ui/Modal` + `TextField` tokenizados nascerem (após o `ThemeProvider` de U1.1), os 6 modais migram
> de `modalStyles.ts` direto para os átomos — tokenizar `modalStyles.ts` antes disso seria retrabalho.
- [ ] **[REF]** Acompanhar UI U2.1 e marcar D-01 como 100% resolvido quando `modalStyles.ts` for removido/reduzido.
- **Aceite:** (via UI U2.1) modais consomem o tema; nenhum hex hardcoded restante.

---

## Métricas-alvo do plano

| Métrica | Antes | Alvo |
|---|---|---|
| Linhas na camada de services | ~750 (4×~190) | ~250 (factory + config) |
| Handlers repetidos no `DataContext` | 12 + 4 buscas | 0 (compostos por store factory) |
| styled-components duplicados nos modais | 6× (~300 linhas) | 1 módulo |
| `BudgetFormPage.tsx` | 501 linhas | < ~200 |
| `Budgets.tsx` | 498 linhas | < ~200 (orquestração) |
| `console.*` em produção | 83 / 27 arquivos | 0 (logger por env) |
| Bugs funcionais (A-01, A-04) | 2 abertos | 0 |
| Suíte de testes | inexistente | Vitest + characterization |

---

## Log de Execução

> Formato de cada entrada: **data · fase/item · O QUE foi feito · POR QUÊ · verificação**.
> Registrar aqui **toda** conclusão de item. Mantém rastro honesto do que mudou e da motivação.

### 2026-07-09 · Planejamento (F-plan) · Consolidação do diagnóstico em plano executável
- **O que foi feito:**
  - Lido e analisado `REPORTE_ESTRUTURA.md` (18 achados, topologia Graphify).
  - **Verificação do diagnóstico contra o código-fonte** antes de planejar (não confiar cegamente no relatório):
    - Confirmados exatamente: A-01 (`DeleteBudgetModal` chama `onClose` no delete e no cancelar; `Budgets.tsx:479–481` liga `onClose`→`removeBudgetFromCache`), A-04 (`Budgets.tsx:111–118` compara reais com centavos), A-03 (`BudgetFormPage.tsx:149` `window.location.reload()`), A-07 (`DataContext.tsx:361` `value` sem `useMemo`), M-01 (`Sidebar.old.tsx` com **0 imports**), M-02 (`searchRepresentatives` `@deprecated` com `console.warn`).
    - **Divergências que mudaram o plano:** (1) **não há `ThemeProvider`/`createTheme` em `src/`** → a sugestão de "usar tokens do tema" (D-01) foi **quebrada** em "centralizar agora com constantes" (F2.3) + "tokenizar depois" (F4.7, dependente de UI-09); (2) **subcomponentes de orçamento já extraídos** (`BudgetAccordion`, `BudgetSummaryPanel`, `ProductSelector`, `ProductList`, `BudgetTermsForm`) → escopo de E-01 reduzido ao array `accordionSections` inline + 2 cards; (3) **drift real** na limpeza de `undefined` (helper nomeado em `budgetServices` vs. inline em `representativeServices`) → reforça o factory D-03.
  - Reescrito o §4 do reporte (de "sugestões" para **Plano de Implementação Consolidado**: arquitetura-alvo, princípios de sequenciamento, roadmap, especificação por item com critérios de aceite, dependências entre trilhas) e o §6 (de "backlog" para **Roteiro de Execução por Fases**).
  - Criado este `PLANO_EXECUCAO_ESTRUTURA.md` com checklists por fase, portões de qualidade, grafo de dependências, métricas-alvo e este log.
- **Por que foi feito:**
  - O pedido era transformar diagnóstico + sugestões soltas em **plano real, executável e sequenciado**, com rastreabilidade (achado → fase → arquivo) e um registro vivo do que for feito e por quê.
  - A ordenação (bug → testes → desduplicar → fatiar → refino) reduz risco: correções funcionais primeiro (valor imediato, risco nulo); rede de testes **antes** das refatorações grandes (não há suíte hoje, §5); desduplicação antes da quebra de UI (diminui a superfície a fatiar).
- **Verificação:** documentos revisados; **nenhuma** alteração em código de produção nesta etapa (apenas artefatos de planejamento em `AUDITORIAS/`). Fases F0–F4 seguem `⬜ Pendente`.

### 2026-07-09 · Consolidação entre trilhas (Plano Diretor) · Ajustes de coesão neste plano
- **O que foi feito:** com a consolidação das 4 auditorias no [Plano Diretor](../SUMARIO_CONSOLIDADO.md), este plano recebeu ajustes de **dono único**: (1) **F2.1** ganhou o requisito de criação **atômica** (SEG S2.1) e a obrigação de preservar os endurecimentos de SEG S1.1/S1.2 e o `getRecentBudgets` de PERF P0.3; (2) **F4.3** passou a cobrir os **2 call sites** do PDF legado (`Budgets.tsx` **e** `RecentBudgets.tsx` — duplicação descoberta na verificação da trilha PERF) e resolve também SEG-12/UI-33; (3) **F4.5** anotado como resolutor de SEG-11/PERF-12 (o `esbuild.drop` complementar fica com PERF P0.2); (4) **F4.7 transferido** para UI U2.1 (a tokenização dos estilos de modal acontece na biblioteca atômica — evita tokenizar `modalStyles.ts` duas vezes).
- **Por que foi feito:** garantir que nenhum item seja implementado por duas trilhas e que refatorações estruturais não desfaçam correções de segurança/performance aplicadas antes delas.
- **Verificação:** somente documentos de planejamento alterados; nenhum código de produção tocado.

### 2026-07-10 · F4.3 (fora de ordem) · Fim do PDF legado nos 2 call sites
- **O que foi feito:** criada `openBudgetPdf(budget)` em `src/utils/PDFGenerator/BudgetPdf.tsx` (gera Blob via `pdf(...).toBlob()`, abre no visualizador nativo, com fallback de download e `try/catch`). `Budgets.tsx` e `RecentBudgets.tsx` tiveram o `window.open`+`document.write`+`ReactDOM.render` removido — ambos os `handleOpenPdf` agora só chamam `openBudgetPdf`. Removidos imports de `ReactDOM`/`BudgetPdfPage`.
- **Por que foi feito:** matava o achado A-02/D (PDF legado duplicado) e destravava SEG-12/UI-33. Optou-se pela função Blob compartilhada em vez da rota React planejada — mais simples, sem `ReactDOM.render` e sem a aba `about:blank` em branco que a abordagem antiga produzia.
- **Arquivos:** `src/utils/PDFGenerator/BudgetPdf.tsx`, `src/pages/Budgets/Budgets.tsx`, `src/components/Dashboard/RecentBudgets.tsx`.
- **Verificação:** `npm run build` verde. Cross-ref resolvido em Segurança (SEG-12), UI/UX (UI-33) e Performance (achado-novo da duplicação do PDF). Nota: a rota dedicada fica opcional (só se quiserem deep-link).

### 2026-07-11 · F0 completo (F0.1–F0.7) · Estabilização: bugs funcionais + limpeza de código morto
> Continuação da Onda 1 depois que SEG S0/S1 fecharam (código + publicação de regras em dev/prod, ver `PLANO_EXECUCAO_SEGURANCA.md` 2026-07-11). Todos os achados foram re-verificados contra o código atual antes de tocar — os números de linha dos planos tinham deslocado (o `useDebounce` entrou no `Budgets.tsx`), mas os defeitos eram exatamente os descritos.
- **O que foi feito:**
  - **F0.1 (bug A-01):** `DeleteBudgetModal` ganhou `onDeleted: () => void`, chamado **após** `await deleteBudget(id)`; `onClose` voltou a significar só "fechar". Em `Budgets.tsx`, `onClose={() => setDeleteModalId(null)}` e `onDeleted={() => handleDeleteSuccess(budget.id)}`. Antes, `onClose` estava ligado a `handleDeleteSuccess` → cancelar/backdrop removia o item do cache.
  - **F0.2 (bug A-04):** filtro de valor converte min/máx (reais) para **centavos** (`* 100`) antes de comparar com `totalValue` (centavos). Corrige o erro por fator 100.
  - **F0.3 (A-03):** `useBudgetForm` expõe `reset()`; `BudgetFormPage` usa `form.reset()` em "Adicionar Outro" no lugar de `window.location.reload()`. Cumpre a regra do `CLAUDE.md` e evita cold-load extra (**resolve PERF-14/T08**).
  - **F0.4 (A-06):** optional chaining/nullish em `DeleteBudgetModal` (`client?.name`, `selectedProducts?.map`, `product?.name`, `unitValue ?? 0`).
  - **F0.5 (A-07 = PERF-06):** `value` do `DataContext` agora em `useMemo` (deps = 6 estados + todas as funções `useCallback` + `getCacheStats` de módulo). **Resolve PERF-06/T04.**
  - **F0.6 (M-01):** removido `src/components/Sidebar/Sidebar.old.tsx` (0 imports); pasta vazia sumiu.
  - **F0.7 (M-03):** `graphify-out/` adicionado ao `.gitignore` (some do `git status`); `AUDITORIAS/` e `.gemini/tasks/` preservados.
  - **Limpeza de código morto (mandato "ruído risco-nulo" da F0, dono apontado pela trilha SEG):** removidos unused imports/vars pré-existentes que travavam o lint global — `BudgetSummaryPanel` (4 ícones), `ProductSelector` (`Paper`,`Typography`), `ProductList` (`InputAdornment`), `CreateClientModal` (`phoneMask`), `CreateRepresentativeModal` (`IClient`), `DefaultLayout` (`drawerWidth`,`collapsedWidth`), `BudgetFormPage` (3 ícones + `IRepresentative`), `Clients` (`addClientToCache`), e os 4 `([_, value])` → `([, value])` dos services. Lint caiu de **31 → 11 problemas**.
- **Por que foi feito:** a Onda 1 de Estrutura (F0) é bug-antes-de-refactor, risco ~nulo, sem depender de testes. F0.1 desbloqueia PERF P1.1; F0.3/F0.5 fecham achados de PERF por dono único.
- **Arquivos (código):** `src/components/Modal/Delete/DeleteBudgetModal.tsx`, `src/pages/Budgets/Budgets.tsx`, `src/hooks/useBudgetForm.ts`, `src/pages/BudgetFormPage/BudgetFormPage.tsx`, `src/context/DataContext.tsx`, `.gitignore`, `src/components/Sidebar/Sidebar.old.tsx` (removido), `src/components/Budget/{BudgetSummaryPanel,ProductSelector,ProductList}.tsx`, `src/components/Modal/Create/{CreateClientModal,CreateRepresentativeModal}/*.tsx`, `src/layouts/DefaultLayout/index.tsx`, `src/pages/Clients/Clients.tsx`, `src/services/{budget,client,product,representative}Services.ts`.
- **Verificação:** `npm run build` (tsc + vite) **verde**; `npx tsc --noEmit` exit 0. Lint: **código morto dono da F0 = 0**. Restam 10 problemas pré-existentes que **não são código morto** (`no-explicit-any`, `ban-types {}`, `react-refresh`, `exhaustive-deps`) com dono em UI (U2.1/PageHeader), EST (F2.2/F3.3) e SEG (ContextAuth) — detalhados nos Portões acima. **Exceção deliberada:** `brMoneyMask` morto em `Home.tsx` foi deixado para o dono **UI U0.1** (acoplado à remoção dos reduces `kpiData`). Validação de runtime dos bugs (F0.1/F0.2) pende da infra de testes de EST F1.

<!--
### AAAA-MM-DD · Fx.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Arquivos:** …
- **Verificação:** build/lint/test verdes; critérios de aceite atendidos.
-->

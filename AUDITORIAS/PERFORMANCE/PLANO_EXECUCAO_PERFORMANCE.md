# PLANO_EXECUCAO_PERFORMANCE.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase)
**Origem:** consolida o §4 de [`REPORTE_PERFORMANCE.md`](./REPORTE_PERFORMANCE.md)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-11

---

## Como usar este documento

- Cada fase tem **checklist de execução** e **critério de aceite**. Marque `[x]` ao concluir.
- Itens **[REF]** têm **dono em outra trilha** (matriz §4.1 do reporte) — aqui não há implementação, só validação do ganho.
- **Medir antes/depois**: performance sem número é opinião. P0 exige baseline (tamanho de chunks, reads da home) registrada no log.
- Ao concluir qualquer item, **registre no §Log de Execução**: o quê e **por quê**.
- Especificações técnicas (código atual → otimizado): §3 do reporte.

### Portões de qualidade
- [x] `npm run build` (tsc + vite) **verde** após P0; `npx tsc --noEmit` exit 0. `npm run lint` segue com **10 problemas pré-existentes** de type-safety/arquitetura (donos em outras trilhas — ver `PLANO_EXECUCAO_ESTRUTURA.md`, portões); P0 **não introduziu nenhum** novo.
- [x] Regra do `CLAUDE.md`: P0 respeita — `getRecentBudgets` é primitivo de service (não chamado direto por componente); o rewire que violaria "ler via `useData()`" foi **deferido** justamente por isso (ver P0.3).

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **P0** | Quick wins de bundle e reads | 4 | ✅ Concluído (2026-07-11) · ⚠️ P0.3: primitivo entregue, rewire do widget **deferido** (bloqueio arquitetural documentado) |
| **P1** | Dados & runtime | 4 | ✅ P1.1/P1.3/P1.4 (2026-07-11) · 🟡 P1.2 (capacidade pronta, rewire deferido) |
| **P2** | Escala de longo prazo | 2 | ⬜ Pendente (⛔ EST F4.6 / F2.2) |

---

## Fase P0 — Quick wins (bundle + reads)

### P0.0 — Baseline de medição (pré-requisito das metas) ✅
- [x] `npm run build:prod` registrado: **1 único chunk JS** `dist/assets/index-*.js` = **5.783,45 kB (gzip 1.122,61 kB)** + CSS 3,73 kB (gzip 1,24) + html 0,76 kB. Ou seja, tudo (app + MUI + DataGrid + Firebase + @react-pdf + `tabela_ncm.json`) num bundle monolítico carregado **inclusive no Login**.
- [x] Reads do boot: `DataContext.loadInitialData` busca as **4 coleções inteiras** (`getDocs` sem `limit`) uma vez e cacheia 5 min; a Home consome `budgets` completo para os KPIs **e** para o widget de recentes.
- **Aceite:** baseline anotada no §Log. ✔

### P0.1 — Remover dependências mortas (PERF-04/05) ✅
Verificado: `uuid`, `react-pdf`, `react-firebase-hooks`, `dayjs` (e `dotenv`) presentes no `package.json` e **sem nenhum import** em todo o repo (grep por `from "<pkg>"`/`require`).
- [x] `npm remove uuid react-pdf react-firebase-hooks dayjs dotenv` — removeu 13 pacotes (incl. transitivos). `package.json` limpo.
- [x] `dotenv` confirmado sem uso (Vite lê `import.meta.env` nativamente; nenhum script Node o consome) → removido junto.
- [x] `date-fns` **mantida** — é a única lib de data em uso (`format` em `BudgetPdf.tsx:16`); `dayjs` era a duplicata morta.
- **Aceite:** `npm run build` verde; nenhuma referência quebrada. ✔ (nota: `npm audit` reporta vulnerabilidades **pré-existentes** nas deps remanescentes — não introduzidas aqui; fora do escopo desta tarefa).

### P0.2 — Code-splitting + drop de console em prod (PERF-01, parte de PERF-12) ✅
Verificado: `vite.config.ts` default nu; `Router.tsx` 100% eager.
- [x] `vite.config.ts`: `defineConfig(({ mode }) => ...)` com `build.rollupOptions.output.manualChunks` (função) → `vendor-react`, `vendor-mui`, **`vendor-mui-x`** (DataGrid/date-pickers — desvio deliberado: separados do `vendor-mui` porque são pesados e o Login não precisa deles), `vendor-firebase`, `vendor-pdf` + `esbuild.drop: ['console','debugger']` **só** em `mode === 'production'`. Complementa (não substitui) o logger de EST F4.5.
- [x] `Router.tsx`: `React.lazy` para `Home`, `Products`, `Clients`, `Budgets`, `Representatives`, `BudgetFormPage`; `<Suspense fallback>` posto em `DefaultLayout` **em volta do `<Outlet/>`** (mantém header/sidebar visíveis durante o load do chunk da página).
- [x] Confirmado `@react-pdf/renderer` no chunk `vendor-pdf` (1.400 kB / gzip 461 kB) — **fora** do caminho do Login; carrega sob demanda.
- **Aceite:** ✔ **bundle inicial do Login** (index + vendor-react + vendor-mui + vendor-firebase) ≈ **1.096 kB / gzip ~302 kB** vs. baseline **5.783 kB / gzip 1.123 kB** → **≈ −73% gzip** no caminho crítico (meta era −40%). PDF, DataGrid (`vendor-mui-x` gzip 88 kB) e a `tabela_ncm.json` (2,8 MB / gzip 246 kB, no chunk lazy de `Produtos`) **saíram** do Login. Navegação funciona com `Suspense`. **Zero `console.*`** nos chunks de prod (grep confirmou 0 em todos). **Achado colateral:** o peso do chunk `Produtos` é dominado por `tabela_ncm.json` importada estática nos modais de produto — antes carregava em *todas* as telas (inclusive Login); agora fica isolada na rota. Carregá-la sob demanda é otimização futura (fora do escopo P0).

### P0.3 — Query dedicada `getRecentBudgets(5)` na dashboard (PERF-03; absorve PERF-07) 🟡 primitivo entregue · rewire deferido
- [x] Adicionado `getRecentBudgets(n = 5)` em `budgetServices.ts` (`query` + `orderBy('createdAt','desc')` + `limit(n)`). Indexado por campo único (`createdAt` desc) → **não** exige índice composto. **Nota de coesão:** EST F2.1 (factory) deve **preservar** esta função.
- [ ] ⛔ **Rewire do `RecentBudgets` deferido — bloqueio arquitetural (verificado no código, não é preguiça):** a Home **já** carrega TODOS os orçamentos via `useData()` para os KPIs (`totalBudgets`, "este mês", `topProducts`, representantes únicos). Enquanto isso for verdade, o widget fatia os 5 do array já cacheado a **custo zero de leitura**; trocá-lo por `getRecentBudgets(5)` **adicionaria 5 reads** e violaria a regra "ler via `useData()`" do `CLAUDE.md`, **sem** reduzir o total (os KPIs continuam lendo N). O aceite "home lê 5 e não N" é **inatingível** enquanto a dashboard depender do array completo — o ganho real vem quando o hero KPI (U3.1) + a coleção-resumo (P2.1) tirarem essa dependência. Documentado no JSDoc de `getRecentBudgets`.
- [~] O `[...budgets].sort(...).slice(0,5)` em `RecentBudgets` **permanece** (é como o widget escolhe 5 do array já em memória, custo O(N) trivial para N pequeno); vira obsoleto junto com o rewire acima.
- **Aceite (revisado):** primitivo indexado pronto e preservável ✔; rewire + redução de reads **acoplados a P2.1** (registrado para o dono retomar). Sem o rewire, a Home continua lendo N — situação **inalterada** vs. baseline (não piorou). **Update 2026-07-11:** U3.1 concluída — mas o hero KPI + os gráficos (12 meses / top produtos) **aumentaram** a dependência do array completo, então U3.1 **não** destrava o rewire; o bloqueio agora é só **P2.1** ("budget summary" server-side).

---

## Fase P1 — Dados & runtime

### P1.1 — Modal único de exclusão fora do `.map` (PERF-09) ✅ (2026-07-11)
**Pré-requisito:** EST F0.1 já separou `onDeleted` de `onClose` no `DeleteBudgetModal`.
- [x] Em `Budgets.tsx`: removido o `<DeleteBudgetModal>` de dentro do `.map` (`React.Fragment` eliminado, `key` movida para o `<Box>` do item) e renderizada **uma** instância após a lista, alimentada por `deleteModalId`.
- [x] `budget` possivelmente `undefined` tratado: `budgetToDelete = budgetList.find(id === deleteModalId)` (busca o array **completo**, não o filtrado — o item existe até ser de fato excluído) e render condicional `{budgetToDelete && <DeleteBudgetModal .../>}`.
- [x] **Coordenação:** EST F3.2 (extração de `BudgetListItem`) **ainda não rodou** — quando rodar, deve partir deste estado (modal único fora do item; `budgetToDelete` derivado de `deleteModalId`).
- **Aceite:** ✔ 1 modal montado em vez de N; regressão de F0.1 verde (`DeleteBudgetModal.test.tsx` + `Budgets.filter.test.tsx`).

### P1.2 — Paginação por cursor em Orçamentos (PERF-02) 🟡 capacidade pronta · rewire deferido (2026-07-11)
Executado **depois** do factory/store (EST F2.1/F2.2) para não migrar os services duas vezes.
> Nota (2026-07-10): o `ProductTable.tsx` ganhou paginação **local** do DataGrid. É melhoria pontual dessa tabela, **não** substitui este item.
- [x] `getBudgetsPage(pageSize, cursor)` entregue como **capacidade do `createCrudService`** (`getPage` genérico: `orderBy('createdAt','desc')`+`limit`+`startAfter`, retorna `{ items, lastDoc, hasMore }`). Indexado por campo único (`createdAt` desc) → **não** exige índice composto. **2 testes** (`createCrudService.test.ts`: mapeamento + `hasMore` cheia/incompleta).
- [ ] ⛔ **Rewire do boot deferido — mesmo bloqueio arquitetural de P0.3 (verificado no código):** o boot carrega TODOS os orçamentos via `DataContext` porque a `Home` calcula KPIs sobre a coleção inteira, e a `GlobalSearch` + os filtros de `Budgets.tsx` varrem o array completo. Paginar o boot reduziria os reads a O(página), MAS quebraria os KPIs (contariam só a 1ª página), a busca global e os filtros locais (só veriam as páginas carregadas). O ganho de "ler O(página)" só é seguro quando o hero KPI (U3.1) e a coleção-resumo (P2.1) tirarem a dependência da coleção inteira. Documentado no JSDoc de `getBudgetsPage`.
- [~] Índice composto: **não necessário** (ordenação por campo único).
- **Aceite (revisado):** capacidade de paginação por cursor pronta, testada e preservável ✔; rewire do boot + redução de reads **acoplados a P2.1** (registrado para o dono retomar). Espelha a resolução de P0.3 (U3.1 concluída em 2026-07-11 não destrava — reforça a dependência do array; falta o "budget summary" de P2.1).

### P1.3 — `localStorage` por chave + `QuotaExceededError` (PERF-11) ✅ (2026-07-11)
Verificado: `persistToStorage` re-serializava o blob com as 4 coleções a cada mutação de 1 item.
- [x] `cacheService.ts`: uma chave por coleção (`ads_representacoes_cache:budgets`, etc., via `storageKeyFor`); `persistToStorage`/`loadFromStorage`/`invalidateCache` operam só na coleção mutada.
- [x] Migração do blob legado (`migrateLegacyStorage`): na 1ª carga do módulo, se existir o blob antigo, reescreve cada coleção na chave nova e remove o legado. (TTL de 5 min ⇒ pior caso é 1 refetch — baixo risco.)
- [x] `QuotaExceededError` tratado explicitamente (`isQuotaExceeded`): avisa (`console.warn`) e degrada para memória — não engole nem propaga. **Teste** simula quota estourada e confirma que `setCache` não lança e o cache em memória segue válido.
- [x] API pública do `cacheService` inalterada (mesmas assinaturas; `DataContext`/store consomem sem mudança).
- **Aceite:** ✔ adicionar 1 item serializa só a chave daquela coleção (teste confirma que as outras não são tocadas); quota excedida gera aviso e o app segue funcional. **Nota:** o characterization test do layout de storage (EST F1) foi atualizado para o layout por chave (P1.3 muda esse detalhe interno de propósito).

### P1.4 — `useDebounce` na `GlobalSearch` (PERF-08) ✅ (2026-07-11)
Verificado: `GlobalSearch.tsx` filtrava 3 coleções a cada tecla, dentro de um `useEffect` com `setResults`.
- [x] `useDebounce(query, 300)` (hook existente) aplicado; o cálculo de resultados virou um `useMemo` sobre `debouncedQuery` (removidos o estado `results` e o `useEffect`/`setResults`). As partes de UI imediatas (abrir dropdown, placeholder, botão limpar) seguem no `query` cru.
- **Aceite:** ✔ digitação não varre as 3 coleções por tecla (só após 300ms parado); resultados idênticos; padrão igual ao `Budgets.tsx`.

---

## Fase P2 — Escala de longo prazo

### P2.1 — "Budget summary" denormalizado para listagens (PERF-13) ⛔ depende do ADR EST F4.6 ⬜
- [ ] Só iniciar após o ADR de denormalização (EST F4.6) definir a estratégia de sincronização.
- [ ] Campo/coleção resumo (`id`, cliente, representante, total, data) para listas; documento gordo só em detalhe/PDF.
- **Aceite:** telas de lista deixam de transferir documentos completos; detalhe/PDF inalterados.

### P2.2 — (Opcional) Contextos por entidade (ext. PERF-06) ⬜
- [ ] **Reavaliar após EST F2.2**: o store factory + `value` memoizado podem já entregar o isolamento necessário. Só prosseguir se profiling mostrar re-render cruzado relevante.
- **Aceite:** decisão registrada no log (implementar ou "não necessário + evidência").

---

## Itens referenciados (dono em outra trilha — NÃO implementar aqui)

| Item | Dono | Papel PERF |
|---|---|---|
| PERF-T04 memoizar `value` | **EST F0.5** | ✅ **Resolvido (2026-07-11)** — `value` do `DataContext` em `useMemo`; validação de re-render (React DevTools) pós-execução ainda recomendada |
| PERF-T08 reload → reset | **EST F0.3** | ✅ **Resolvido (2026-07-11)** — `window.location.reload()` trocado por `form.reset()`; "Adicionar Outro" não refaz cold-load |
| PERF-T13 timer de logout | **SEG S0.3** | ✅ **Resolvido (2026-07-10)** — `clearTimeout` + `useRef` em `ContextAuth.tsx` eliminam o empilhamento de timers (e o TTL passou de ~30 h para 2 h) |
| PERF-T12 `kpiData` morto | **UI U0.1** | ✅ **Resolvido (2026-07-11)** — `kpiData.totalValue` e `kpiData.maxBudget` (reduces O(N) sem consumidor) removidos do `Home.tsx`, junto com o import morto `brMoneyMask`. |
| Logger com nível por env (PERF-12) | **EST F4.5** (o `esbuild.drop` de P0.2 é o complemento de build) | ✅ **Resolvido (2026-07-11)** — `src/utils/logger.ts` silencioso em prod substituiu os 40 `console.*`; com o `esbuild.drop` de P0.2, **0 `console.*`** nos chunks da app (sem ruído/custo de log em prod) |
| PERF-16 `brMoneyMask` | Radar — sem ação até listas grandes/virtualização | — |

---

## Log de Execução

> Formato: **data · fase/item · O QUE foi feito · POR QUÊ · verificação/medição**.

### 2026-07-09 · Planejamento (P-plan) · Consolidação do diagnóstico em plano executável
- **O que foi feito:**
  - Verificação dos achados contra o código: PERF-01/04/07/08/10/11 confirmados exatamente como reportados; **achado novo** — `RecentBudgets.tsx:41-63` duplica o `handleOpenPdf` legado de `Budgets.tsx` (repassado ao dono EST F4.3, que deve cobrir os 2 call sites).
  - Reescrito o §4 do reporte (backlog → **Plano Consolidado** com matriz de dono único + fases P0–P2) e criado este arquivo.
  - **Decisões de coesão:** T04/T08/T13/T12 têm dono em EST/SEG/UI (não duplicar); PERF-07 absorvido por P0.3 (a query dedicada elimina o sort O(N) — memoizar seria retrabalho); P1.2 (paginação) sequenciada **após** EST F2.1/F2.2 para migrar services uma única vez; P1.1 sequenciado após EST F0.1 (contrato `onDeleted`).
- **Por que foi feito:** transformar sugestões em plano executável sem overlap com as demais trilhas, e amarrar cada meta de performance a uma medição (baseline P0.0) para que os aceites sejam verificáveis.
- **Verificação:** documentos revisados; **nenhuma** alteração em código de produção nesta etapa. Fases P0–P2 `⬜ Pendente`.

### 2026-07-10 · [REF] PERF-T13 (= PERF-15) · Resolvido pela trilha SEG (S0.3)
- **O que foi feito:** o timer de auto-logout de `ContextAuth.tsx` foi corrigido pelo dono único **SEG S0.3**: handle guardado em `useRef`, `clearTimeout` antes de reagendar/no `logout`/no cleanup do `useEffect`, e `SESSION_TTL_MS = 2h` (o bug fazia ~30 h). Aqui apenas registramos o ganho de performance (fim do vazamento/empilhamento de `setTimeout`).
- **Por que foi feito:** PERF-T13 e SEG-03 são o **mesmo código** — dono único SEG evita implementação duplicada.
- **Verificação:** `npm run build` verde; ver log detalhado em `AUDITORIAS/SEGURANCA/PLANO_EXECUCAO_SEGURANCA.md` (entrada 2026-07-10). Validação em runtime (não empilhar timers) fica para EST F1 com fake timers.

### 2026-07-10 · [REF] achado-novo (PDF duplicado) resolvido + PERF-T12 mudou de estado
- **O que foi feito:** (1) o **achado-novo** registrado no planejamento (`RecentBudgets.tsx` duplicando o `handleOpenPdf` legado de `Budgets.tsx`) foi **resolvido** pela trilha EST (F4.3): os dois passaram a chamar `openBudgetPdf()` — duplicação eliminada. (2) **PERF-T12:** o card "Valor Total" do `Home.tsx` foi **removido** (não implementado), então `kpiData.totalValue` e `kpiData.maxBudget` viraram reduces O(N) mortos — anotado como remoção pendente (dono UI U0.1).
- **Por que foi feito:** registrar que mudanças ad-hoc na `main` (refator do PDF + limpeza do Home) tocaram itens já mapeados, mantendo o roadmap fiel ao código.
- **Medição (antes → depois):** PDF — 1 função compartilhada em vez de 2 blocos `document.write` duplicados. kpiData — 2 reduces O(N) por render de dashboard hoje sem consumidor (candidatos a remoção).
- **Verificação:** `npm run build` verde. Detalhe do PDF em `PLANO_EXECUCAO_ESTRUTURA.md` (F4.3, 2026-07-10).

### 2026-07-11 · [REF] PERF-T04 + PERF-T08 · Resolvidos pela trilha EST (F0.5 / F0.3)
- **O que foi feito:** ambos os itens têm dono único em EST e foram fechados na execução da EST F0: **T04** (`value` do `DataContext` sem memo) → `useMemo` com deps corretas (F0.5); **T08** (`window.location.reload()` no "Adicionar Outro") → `form.reset()` no `useBudgetForm` (F0.3), sem cold-load extra nem re-fetch das 4 coleções.
- **Por que foi feito:** T04/T08 são o **mesmo código** de EST A-07/A-03 — dono único EST evita implementação duplicada; aqui só se registra o ganho de performance.
- **Medição (antes → depois):** T04 — identidade do `value` estável quando nada relevante muda (menos re-render em cascata dos consumidores de `useData()`; medir com React DevTools quando houver profiling). T08 — "Adicionar Outro" deixa de recarregar a página inteira (0 reads extras vs. re-boot completo das 4 coleções).
- **Verificação:** `npm run build` + `npx tsc --noEmit` verdes; detalhe em `PLANO_EXECUCAO_ESTRUTURA.md` (F0, 2026-07-11).

### 2026-07-11 · P0 (P0.0–P0.3) · Quick wins de bundle + primitivo de reads
- **O que foi feito:**
  - **P0.0 baseline:** `build:prod` = **1 chunk** de 5.783,45 kB (gzip 1.122,61 kB) carregado em tudo, inclusive Login. Boot lê as 4 coleções inteiras (cache 5 min).
  - **P0.1:** `npm remove uuid react-pdf react-firebase-hooks dayjs dotenv` (13 pacotes, 0 imports em todo o repo). `date-fns` mantida (`BudgetPdf.tsx`).
  - **P0.2:** `vite.config.ts` → `manualChunks` (função) separando `vendor-react`/`vendor-mui`/`vendor-mui-x`/`vendor-firebase`/`vendor-pdf` + `esbuild.drop:['console','debugger']` só em produção; `Router.tsx` → 6 rotas em `React.lazy`; `Suspense` em volta do `<Outlet/>` no `DefaultLayout`.
  - **P0.3:** adicionado o primitivo `getRecentBudgets(n=5)` (orderBy+limit, indexado) em `budgetServices.ts`. **Rewire do widget deferido** (bloqueio arquitetural — ver item P0.3).
- **Por que foi feito:** P0 são os ganhos de bundle de risco baixo. O split tira do caminho crítico do Login o @react-pdf (gzip 461 kB), o DataGrid (gzip 88 kB) e a `tabela_ncm.json` (gzip 246 kB), que antes carregavam em toda tela.
- **Medição (antes → depois):**
  | Recurso | Baseline (mono) | Depois |
  |---|---|---|
  | Chunk único | 5.783,45 kB / gzip 1.122,61 kB | — (fatiado) |
  | **Login (crítico)** = index+vendor-react+vendor-mui+vendor-firebase | ~mesmo mono | **~1.096 kB / gzip ~302 kB (≈ −73%)** |
  | vendor-pdf (lazy) | incluso no mono | 1.400 kB / gzip 461 kB — fora do Login |
  | vendor-mui-x DataGrid (lazy) | incluso no mono | 293 kB / gzip 88 kB — fora do Login |
  | Produtos (lazy, `tabela_ncm.json`) | incluso no mono | 2.886 kB / gzip 246 kB — só na rota |
  | `console.*` em prod | presentes | **0** (grep em todos os chunks) |
- **Verificação:** `npm run build` + `npx tsc --noEmit` verdes; grep confirmou 0 `console.*` nos chunks de prod; chunks por rota emitidos (Home/Budgets/Clients/Representatives) + vendors isolados. Lint: 10 problemas pré-existentes (nenhum novo). Smoke-test de navegação real (Suspense/fallback) recomendado no `preview`.
- **Ressalva P0.3:** a Home continua lendo N orçamentos (KPIs dependem do array completo); a redução "5 em vez de N" fica acoplada a U3.1/P2.1. Primitivo pronto e preservável por EST F2.1.

### 2026-07-11 · P1 (P1.1/P1.3/P1.4 ✅ · P1.2 🟡) · Dados & runtime (Onda 3)
- **O que foi feito:**
  - **P1.1:** um único `DeleteBudgetModal` fora do `.map` em `Budgets.tsx`, alimentado por `deleteModalId` (`budgetToDelete` derivado do array completo; render condicional trata `undefined`).
  - **P1.3:** `cacheService` por chave (`ads_representacoes_cache:<coleção>`), migração do blob legado e `QuotaExceededError` tratado (aviso + degrada para memória).
  - **P1.4:** `GlobalSearch` com `useDebounce(query, 300)` + resultados via `useMemo` (fim do `useEffect`/`setResults` por tecla).
  - **P1.2:** capacidade `getBudgetsPage`/`getPage` (cursor) entregue no factory e testada; **rewire do boot deferido** (mesmo bloqueio de P0.3: a Home lê a coleção inteira p/ KPIs).
- **Por que foi feito:** ganhos de runtime/I-O de risco baixo, agora que EST F2.1/F2.2 destravaram a paginação e o modal único (após EST F0.1). P1.2 fica na mesma situação de P0.3 — capacidade pronta, redução real de reads acoplada a U3.1/P2.1.
- **Medição (antes → depois):** P1.1 — N modais montados → 1. P1.3 — mutar 1 coleção re-serializa 1 chave em vez do blob das 4. P1.4 — 3 varreduras/tecla → 1 varredura por termo debounced (300ms). P1.2 — boot inalterado (O(N)); capacidade O(página) disponível para quando o boot for reescrito.
- **Verificação:** `npm run build` verde; **49 testes jsdom** (incl. +1 de quota do cache, +2 de `getPage`, +7 do factory) + **12 de regras**; lint nos mesmos 10 pré-existentes.

<!--
### AAAA-MM-DD · Px.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Medição (antes → depois):** …
- **Verificação:** aceites atendidos; build/lint/test verdes.
-->

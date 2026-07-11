# PLANO_EXECUCAO_PERFORMANCE.md — Execução por Fases

**Projeto:** ADS Representações (React + TypeScript + Vite + Firebase)
**Origem:** consolida o §4 de [`REPORTE_PERFORMANCE.md`](./REPORTE_PERFORMANCE.md)
**Sequenciamento global:** [Plano Diretor](../SUMARIO_CONSOLIDADO.md)
**Criado em:** 2026-07-09 · **Última atualização:** 2026-07-10

---

## Como usar este documento

- Cada fase tem **checklist de execução** e **critério de aceite**. Marque `[x]` ao concluir.
- Itens **[REF]** têm **dono em outra trilha** (matriz §4.1 do reporte) — aqui não há implementação, só validação do ganho.
- **Medir antes/depois**: performance sem número é opinião. P0 exige baseline (tamanho de chunks, reads da home) registrada no log.
- Ao concluir qualquer item, **registre no §Log de Execução**: o quê e **por quê**.
- Especificações técnicas (código atual → otimizado): §3 do reporte.

### Portões de qualidade
- [ ] `npm run build` + `npm run lint` verdes; (quando EST F1 existir) `npm run test` verde
- [ ] Regra do `CLAUDE.md`: leitura via `useData()`; escrita via service + função de cache; nunca `window.location.reload()`

---

## Painel de progresso

| Fase | Objetivo | Itens | Status |
|---|---|---|---|
| **P0** | Quick wins de bundle e reads | 3 | ⬜ Pendente |
| **P1** | Dados & runtime | 4 | ⬜ Pendente (P1.1 ⛔ EST F0.1 · P1.2 ⛔ EST F2) |
| **P2** | Escala de longo prazo | 2 | ⬜ Pendente (⛔ EST F4.6 / F2.2) |

---

## Fase P0 — Quick wins (bundle + reads)

### P0.0 — Baseline de medição (pré-requisito das metas) ⬜
- [ ] `npm run build:prod` e registrar no log: tamanho dos chunks (gzip) do `dist/`.
- [ ] Registrar reads do boot (4 coleções × N docs) e da home no estado atual.
- **Aceite:** baseline anotada no §Log (sem ela, os aceites de P0.2/P0.3 não são verificáveis).

### P0.1 — Remover dependências mortas (PERF-04/05) ⬜
Verificado: `uuid`, `react-pdf`, `react-firebase-hooks`, `dayjs` presentes no `package.json` e sem nenhum import em `src/`.
- [ ] `npm remove uuid react-pdf react-firebase-hooks dayjs`.
- [ ] Verificar `dotenv` (Vite usa `import.meta.env` nativamente; se nenhum script Node o usa, remover também).
- [ ] Padronizar datas em `date-fns` (única lib usada — `BudgetPdf.tsx`).
- **Aceite:** build/lint verdes; `npm ls` sem as deps; nenhuma referência quebrada.

### P0.2 — Code-splitting + drop de console em prod (PERF-01, parte de PERF-12) ⬜
Verificado: `vite.config.ts` default nu; `Router.tsx` 100% eager.
- [ ] `vite.config.ts`: `build.rollupOptions.output.manualChunks` (`vendor-react`, `vendor-mui`, `vendor-firebase`, `vendor-pdf`) + `esbuild.drop: ['console','debugger']` **apenas** em `mode === 'production'` (§3.1 do reporte). O drop complementa (não substitui) o logger de **EST F4.5**.
- [ ] `Router.tsx`: `React.lazy` para `Home`, `Products`, `Clients`, `Budgets`, `Representatives`, `BudgetFormPage` + `<Suspense fallback>` no ramo autenticado.
- [ ] Confirmar que `@react-pdf/renderer` caiu no chunk `vendor-pdf` carregado sob demanda (visualizer).
- **Aceite:** bundle inicial (gzip) reduzido vs. baseline (meta: PDF fora do chunk crítico, ~-40%); navegação entre rotas funciona com fallback; sem `console.*` no bundle de prod.

### P0.3 — Query dedicada `getRecentBudgets(5)` na dashboard (PERF-03; absorve PERF-07) ⬜
- [ ] Adicionar `getRecentBudgets(n=5)` em `budgetServices.ts` (`orderBy('createdAt','desc')` + `limit(n)`, §3.2). **Nota de coesão:** EST F2.1 (factory) deve **preservar** esta função ao migrar.
- [ ] `RecentBudgets` deixa de receber o array completo: busca os 5 via query dedicada (com cache próprio de 5 min no `cacheService` se necessário) e ganha **loading próprio** (skeleton).
- [ ] Remover o `[...budgets].sort(...).slice(0,5)` — o `useMemo` de PERF-07 fica **obsoleto** (não implementar).
- [ ] Criar índice no Firestore se o console sugerir (`createdAt desc`).
- **Aceite:** home lê **5 docs** de orçamento (não N) no widget; comportamento visual idêntico.

---

## Fase P1 — Dados & runtime

### P1.1 — Modal único de exclusão fora do `.map` (PERF-09) ⛔ depende de EST F0.1 ⬜
**Pré-requisito:** EST F0.1 já separou `onDeleted` de `onClose` no `DeleteBudgetModal`.
- [ ] Em `Budgets.tsx`: remover o `<DeleteBudgetModal>` de dentro do `.map` e renderizar **uma** instância após a lista, alimentada por `deleteModalId` (§3.4 do reporte).
- [ ] Tratar `budget` possivelmente `undefined` (item filtrado enquanto o modal abre).
- [ ] **Coordenação:** se EST F3.2 (extração de `BudgetListItem`) ainda não rodou, avisar no log — F3.2 deve partir deste estado.
- **Aceite:** 1 Dialog montado em vez de N; excluir/cancelar preservam o comportamento de EST F0.1.

### P1.2 — Paginação por cursor em Orçamentos (PERF-02) ⛔ depende de EST F2.1/F2.2 ⬜
Executar **depois** do factory/store para não migrar os services duas vezes.
> Nota (2026-07-10): o `ProductTable.tsx` ganhou paginação **local** do DataGrid (`initialState` pageSize 10) + `sortComparator` numérico no `id`. É melhoria pontual dessa tabela, **não** substitui este item — P1.2 é paginação por **cursor no Firestore** dos Orçamentos (boot O(página) em vez de O(N)); o DataGrid ainda carrega o array completo.
- [ ] `getBudgetsPage(pageSize, cursor)` com `orderBy`+`limit`+`startAfter` (§3.2) — idealmente como capacidade do `createCrudService`.
- [ ] Integração no `DataContext`/store: cache passa a ser por página; "carregar mais" anexa a próxima página.
- [ ] Criar índice composto se o console sugerir.
- [ ] Avaliar impacto nos filtros client-side de `Budgets.tsx` (filtro local só vê as páginas carregadas — decidir e documentar o comportamento no log).
- **Aceite:** boot lê O(página) em vez de O(N); "carregar mais" funcional; filtros com comportamento documentado.

### P1.3 — `localStorage` por chave + `QuotaExceededError` (PERF-11) ⬜
Verificado: `persistToStorage` re-serializa o blob com as 4 coleções a cada mutação de 1 item.
- [ ] `cacheService.ts`: uma chave por coleção (`ads_representacoes_cache:budgets`, etc. — §3.5); `persistToStorage`/`loadFromStorage` passam a operar só na coleção mutada.
- [ ] Migração: ler o blob antigo se existir (1ª carga) e remover a chave legada.
- [ ] Tratar `QuotaExceededError` explicitamente (avisar + degradar para memória, não engolir).
- [ ] Manter a API pública do `cacheService` (o `DataContext`/EST F2.2 consome-a sem mudança).
- **Aceite:** adicionar 1 orçamento serializa apenas `budgets`; quota excedida gera aviso e o app segue funcional.

### P1.4 — `useDebounce` na `GlobalSearch` (PERF-08) ⬜
Verificado: `GlobalSearch.tsx:54` filtra 3 coleções a cada tecla.
- [ ] Aplicar `useDebounce(query, 300)` (hook já existe) e usar o valor debounced no `useEffect`.
- [ ] Converter o cálculo de resultados para `useMemo` sobre o termo debounced (remove o `setResults` em effect).
- **Aceite:** digitação sem varredura por tecla; resultados idênticos; padrão igual ao resto do app.

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
| PERF-T04 memoizar `value` | **EST F0.5** | Validar re-render (React DevTools) pós-execução |
| PERF-T08 reload → reset | **EST F0.3** | Validar que "Adicionar Outro" não refaz cold-load |
| PERF-T13 timer de logout | **SEG S0.3** | ✅ **Resolvido (2026-07-10)** — `clearTimeout` + `useRef` em `ContextAuth.tsx` eliminam o empilhamento de timers (e o TTL passou de ~30 h para 2 h) |
| PERF-T12 `kpiData` morto | **UI U0.1** | ⚠️ **Mudou (2026-07-10):** o card "Valor Total" foi **removido** (não implementado) no `Home.tsx`. Agora **`totalValue` E `maxBudget`** são reduces O(N) calculados e **nunca usados** em `kpiData` → remover ambos (ou religar se voltarem a exibir o valor). |
| Logger com nível por env | **EST F4.5** (o `esbuild.drop` de P0.2 é o complemento de build) | — |
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

<!--
### AAAA-MM-DD · Px.y · <título curto>
- **O que foi feito:** …
- **Por que foi feito:** …
- **Medição (antes → depois):** …
- **Verificação:** aceites atendidos; build/lint/test verdes.
-->

# REPORTE_PERFORMANCE.md — Fase 3: Desempenho, Escalabilidade e Recursos

**Projeto:** ADS Representações — React + TypeScript + Vite + Firebase (Firestore)
**Data:** 2026-07-09
**Escopo:** Varredura exaustiva de gargalos de desempenho, escalabilidade e uso de recursos.
**Método:** Análise estática do código + topologia do Graphify (`graphify-out/GRAPH_REPORT.md`).
**Plano consolidado em:** 2026-07-09 (revisado após verificação do código-fonte)

> **Status deste documento:** deixou de ser apenas um diagnóstico com backlog solto.
> As seções **§1–§3** permanecem como base de evidência e especificação técnica (código atual → otimizado).
> O antigo "§4 Backlog" virou um **§4 Plano de Implementação Consolidado**, com **matriz de dono único**
> (vários itens PERF são executados por outra trilha — não há implementação duplicada) e roadmap por fases.
> Checklists de execução + log do que foi feito e por quê: [`PLANO_EXECUCAO_PERFORMANCE.md`](./PLANO_EXECUCAO_PERFORMANCE.md).
> Sequenciamento global entre as 4 auditorias: [Plano Diretor](../SUMARIO_CONSOLIDADO.md).

> **Nota sobre o modelo de execução.** Esta é uma SPA client-only: todo o processamento roda no navegador do usuário. Não há servidor de aplicação, ORM ou pool de conexões. Portanto os gargalos "clássicos de backend" (N+1 em ORM, conexões não fechadas, thread pool) se traduzem aqui em: **(a) reads do Firestore** (cobrados por documento e limitados por quota), **(b) trabalho na main thread do navegador** (re-renders, serialização, filtros), e **(c) peso do bundle JavaScript** (TTI / First Contentful Paint). O relatório está organizado nesses três eixos.

---

## 1. Sumário Executivo

A aplicação já implementou uma camada de cache (memória + `localStorage`, TTL 5 min) que resolveu o problema de **reads repetidos** dentro de uma sessão — esse foi um ganho real e está bem-feito. Contudo, a análise revela que os gargalos remanescentes se concentram em quatro frentes, todas com efeito multiplicador conforme a base cresce:

| # | Eixo | Gravidade dominante | Achado-síntese |
|---|------|---------------------|----------------|
| 1 | **Bundle / Carregamento** | 🔴 Alta | Zero code-splitting. `@react-pdf/renderer`, `@mui/x-data-grid`, `firebase` e `sweetalert2` entram todos no bundle inicial. 4 dependências mortas instaladas. |
| 2 | **Camada de dados (Firestore)** | 🔴 Alta | Todas as leituras são *full-collection scans* sem `limit()`/paginação/cursor. A dashboard lê **todos** os orçamentos para exibir 5. |
| 3 | **Runtime React (re-render)** | 🟠 Média | O `value` do `DataContext` (God Provider) não é memoizado → cascata de re-render em toda a árvore autenticada. `N` modais pesados montados na lista de orçamentos. |
| 4 | **Cache / I/O `localStorage`** | 🟠 Média | Cada mutação de 1 item re-serializa (`JSON.stringify`) as **4 coleções inteiras** de forma síncrona na main thread. |

**Diagnóstico de escalabilidade (o ponto central):** o custo de quase tudo neste app é **O(N) sobre o total de registros**, materializado a cada cold-load, a cada tecla digitada na busca global, e a cada operação de CRUD. Enquanto a base for pequena (dezenas de docs) nada disso dói. O objetivo desta fase é remover os multiplicadores **antes** de a base crescer, para que o custo passe a ser O(página) e O(delta), não O(total).

### Evidência do Graphify

- **God node `useData()` — 30 edges, betweenness 0.140** (maior ponte entre comunidades). Confirma que o `DataContext` é o hub central: qualquer re-render dele propaga para 8 comunidades distintas (Product Management, Budget Form, App Header, Tables, etc.). Isso é exatamente o custo descrito em **PERF-06**.
- **God node `brMoneyMask()` — 21 edges.** Função de formatação chamada em todos os hot paths de renderização de listas/PDF (encadeamento de 3 `.replace` com regex por chamada). Alto volume de chamadas, mas custo unitário baixo — ver **PERF-16 (Info)**.
- **`IBudget` — 24 edges**, embute `IClient` + `IRepresentative` + snapshots de `IProduct`. Documentos "gordos" → cada read de orçamento transfere e desserializa muito mais dados do que as telas de lista consomem (**PERF-02**, **PERF-13**).
- **Import cycles: nenhum.** Bom — não há ciclo de dependência penalizando tree-shaking.

---

## 2. Inventário Exaustivo de Gargalos

Formato: **ID · Gravidade · Arquivo:Linha · Diagnóstico**. Gravidade = ganho de performance/escalabilidade esperado ao corrigir.

### Eixo 1 — Bundle e Carregamento Inicial

---

#### 🔴 PERF-01 — ALTA — Ausência total de code-splitting / lazy loading
**Arquivos:** [vite.config.ts](vite.config.ts) (config vazia), [src/Router.tsx:1-13](src/Router.tsx#L1-L13)

`vite.config.ts` é o default nu (`plugins: [react()]`) — sem `build.rollupOptions.output.manualChunks`. O `Router.tsx` importa **todas** as páginas de forma estática/eager no topo (`Home`, `Products`, `Clients`, `Budgets`, `Representatives`, `BudgetFormPage`). Não existe `React.lazy`, `Suspense` nem `import()` dinâmico em nenhum ponto do `src/` (verificado por varredura).

Consequência: um único chunk principal carrega, já no primeiro paint, bibliotecas que só são necessárias em telas específicas:
- **`@react-pdf/renderer` (^4.1.5)** — pesadíssima (embute um motor tipo PDFKit + fontes). Só é usada ao clicar "Ver PDF" / "Pré-visualizar".
- **`@mui/x-data-grid` (^7.7.0)** — só usada nas tabelas de Clientes/Produtos/Representantes.
- **`firebase` (^10.10.0)**, **`sweetalert2`**, **`@mui/material` + `@mui/icons-material`** — todos no bundle inicial.

**Impacto:** Time-to-Interactive e First Contentful Paint inflados; o usuário baixa e faz parse do gerador de PDF antes mesmo de ver a tela de login. É o item de **maior ganho isolado** de toda a fase.

---

#### 🟠 PERF-04 — MÉDIA — Dependências mortas no bundle/instalação
**Arquivo:** [package.json:16-35](package.json#L16-L35)

Varredura de imports em `src/` confirma que **não são usadas em lugar nenhum**:
- `uuid` (^11.1.0) — IDs são gerados por transação Firestore (`getNextBudgetId`), não por uuid.
- `react-pdf` (^10.3.0) — biblioteca de **exibição** de PDFs (pdf.js); o projeto usa `@react-pdf/renderer` (geração), que é outra lib. `react-pdf` é peso morto.
- `react-firebase-hooks` (^5.1.1) — nenhum import.
- `dayjs` (^1.11.13) — nenhum import (só `date-fns` é usado, em `BudgetPdf.tsx`).

**Impacto:** peso de instalação/CI e risco de acabarem no bundle se importadas por engano. `react-pdf` em especial é grande. Remoção é de baixo risco e ganho imediato no `node_modules` e no grafo de dependências.

---

#### 🟡 PERF-05 — BAIXA — Bibliotecas de data redundantes
**Arquivo:** [package.json:24-25](package.json#L24-L25)

`date-fns` (^3.6.0) **e** `dayjs` (^1.11.13) coexistem. Apenas `date-fns` é usada (`BudgetPdf.tsx`). Além disso, `@mui/x-date-pickers` traz seus próprios adapters. Manter duas libs de data é bloat puro. (Sub-item de PERF-04, destacado por ser um par clássico de duplicação.)

**Impacto:** bundle e superfície de manutenção. Padronizar em `date-fns`.

---

### Eixo 2 — Camada de Dados (Firestore)

---

#### 🔴 PERF-02 — ALTA — *Full-collection scans* sem `limit`, paginação ou cursor
**Arquivos:** [budgetServices.ts:24-32](src/services/budgetServices.ts#L24-L32), [clientServices.ts:24-32](src/services/clientServices.ts#L24-L32), [productServices.ts:24-32](src/services/productServices.ts#L24-L32), [representativeServices.ts:24-32](src/services/representativeServices.ts#L24-L32)

Todos os quatro `get*()` executam `getDocs(collection(db, "..."))` — leem a **coleção inteira**. Não há `query()`, `where()`, `orderBy()`, `limit()` nem `startAfter()` em nenhum ponto do código. No boot, o `DataContext` dispara os quatro em paralelo ([DataContext.tsx:200-209](src/context/DataContext.tsx#L200-L209)), carregando **100% de cada coleção**.

O cache mitiga apenas os reads **repetidos dentro de 5 min**. Todo *cold-load* paga o N cheio: nova sessão, expiração de TTL, hard-refresh, aba anônima, `localStorage` limpo, e — criticamente — após o `window.location.reload()` de PERF-14. Como o Firestore **cobra por documento lido** e a arquitetura de cache foi criada justamente para caber na quota gratuita, este é o maior risco de escalabilidade da camada de dados.

**Impacto:** custo de reads e memória cresce O(N) linearmente com a base. Documentos de orçamento são "gordos" (embutem cliente + representante + produtos), agravando transferência e parse.

---

#### 🟠 PERF-03 — MÉDIA — Dashboard lê a base inteira de orçamentos para exibir 5
**Arquivos:** [Home.tsx:189](src/pages/Home/Home.tsx#L189), [RecentBudgets.tsx:66-68](src/components/Dashboard/RecentBudgets.tsx#L66-L68)

`RecentBudgets` recebe `budgets` (array completo) e faz `[...budgets].sort(...).slice(0, 5)`. Para mostrar 5 linhas, o custo de dados é N reads (via PERF-02) + uma cópia + sort O(N log N) do array inteiro. Uma consulta dedicada `query(collection, orderBy("createdAt","desc"), limit(5))` leria **5 documentos**.

**Impacto:** desperdício direto de reads e de CPU na tela mais acessada (home). Ganho grande em relação ao esforço.

---

#### 🟡 PERF-13 — BAIXA — Documentos denormalizados "gordos" pressionam transferência e `localStorage`
**Arquivos:** [ibudget.ts](src/interfaces/ibudget.ts), [cacheService.ts:145-153](src/services/cacheService.ts#L145-L153)

`IBudget` embute `IClient` + `IRepresentative` + snapshot completo de cada `IProduct` selecionado. Telas de lista (Orçamentos, RecentBudgets) só exibem `id`, nome do cliente/representante, total e data — mas cada read transfere o documento inteiro. Além do custo de rede/parse, isso enche o blob de `localStorage` (limite ~5 MB), aproximando o teto de quota (ver PERF-13-quota em PERF-11).

**Impacto:** teto de escalabilidade. Mitigação: coleção/campo de resumo ("budget summary") para listagens, mantendo o documento gordo apenas para a tela de detalhe/PDF.

---

### Eixo 3 — Runtime React (re-renders e montagem)

---

#### 🟠 PERF-06 — MÉDIA-ALTA — `value` do `DataContext` não memoizado → cascata de re-render global
**Arquivo:** [DataContext.tsx:361-404](src/context/DataContext.tsx#L361-L404)

O objeto `value` é recriado como literal novo a **cada render** do `DataProvider`. Como o `DataProvider` guarda **todo** o estado do app (budgets, clients, products, representatives, `loading`, `loadingEntities`), qualquer mudança de estado — inclusive um único flip em `loadingEntities` ou uma mutação de cache de outra entidade — gera um novo `value` e **re-renderiza todos os consumidores de `useData()`**. O Graphify confirma o alcance: `useData()` é ponte para 8 comunidades (betweenness 0.140). Logo, atualizar `products` re-renderiza `Budgets` (que só usa `budgets`), `GlobalSearch`, todas as tabelas e o `useBudgetForm`.

Os handlers já estão em `useCallback`, então a correção é direta: envolver `value` em `useMemo`.

**Impacto:** re-renders desnecessários em toda a árvore autenticada. Baixo esforço, ganho amplo.

---

#### 🟠 PERF-09 — MÉDIA — `N` `DeleteBudgetModal` montados simultaneamente na lista
**Arquivo:** [Budgets.tsx:477-483](src/pages/Budgets/Budgets.tsx#L477-L483)

Dentro do `.map(filteredBudgets)`, um `<DeleteBudgetModal>` é instanciado **por linha de orçamento** — mesmo que apenas um possa estar aberto por vez. Modais do MUI (Dialog) são componentes pesados (portal, backdrop, focus-trap, listeners). Renderizar N Dialogs para N orçamentos multiplica o custo de montagem e a árvore de componentes.

Correção: renderizar **um único** modal fora do `.map`, controlado por `deleteModalId`, e passar o orçamento correspondente. (Também corrige o bug funcional A-01 do relatório de estrutura, em que `onClose` do cancelamento remove do cache.)

**Impacto:** árvore de componentes O(N) → O(1) para modais; menos memória e menos trabalho de reconciliação.

---

#### 🟡 PERF-07 — BAIXA — `RecentBudgets` copia + ordena todo o array a cada render (sem `useMemo`)
**Arquivo:** [RecentBudgets.tsx:66-68](src/components/Dashboard/RecentBudgets.tsx#L66-L68)

`recentBudgets` é computado no corpo do componente, fora de `useMemo`. Toda vez que o componente re-renderiza (e, por PERF-06, isso acontece com frequência), refaz `[...budgets].sort(...).slice(0,5)`. Deve ser `useMemo(() => ..., [budgets])`.

**Impacto:** CPU redundante na home. Trivial de corrigir.

---

#### 🟡 PERF-08 — BAIXA — `GlobalSearch` faz 3 varreduras O(N) por tecla, sem debounce
**Arquivo:** [GlobalSearch.tsx:54-110](src/components/Layout/AppHeader/GlobalSearch.tsx#L54-L110)

O `useEffect` de busca roda a cada mudança de `query` (cada tecla) e filtra `clients`, `budgets` e `products` — três passagens O(N) síncronas na main thread — enquanto o resto do app já usa `useDebounce` (Budgets, useBudgetForm). Além disso, o effect depende de `[query, clients, budgets, products]`; por PERF-06, as referências desses arrays trocam com frequência, disparando re-buscas mesmo sem digitação.

Correção: aplicar `useDebounce` (já existe em `src/hooks/useDebounce`) à `query` e/ou memoizar. Padroniza com o resto do app.

**Impacto:** digitação mais fluida e menos jank conforme a base cresce.

---

#### 🟡 PERF-10 — BAIXA — Computação morta em `kpiData` (valores calculados e nunca exibidos)
**Arquivo:** [Home.tsx:37-43](src/pages/Home/Home.tsx#L37-L43) vs [Home.tsx:136-143](src/pages/Home/Home.tsx#L136-L143)

`kpiData` calcula `totalValue` (reduce O(N)) e `maxBudget` (reduce O(N)) sobre todos os orçamentos, mas o card "Valor Total em Orçamentos" está **hardcoded** em `R$ ---,--` ("Em desenvolvimento") e `maxBudget` nunca é lido. São duas passagens O(N) inteiramente desperdiçadas a cada recálculo do memo.

**Impacto:** CPU desperdiçada. Remover o cálculo morto (ou concluir a feature e usar o valor).

---

#### ⚪ PERF-16 — INFO — `brMoneyMask` reexecuta 3 regex por célula renderizada
**Arquivos:** [Masks.ts:11-16](src/utils/Masks.ts#L11-L16); chamadores em [Budgets.tsx:354](src/pages/Budgets/Budgets.tsx#L354), [Budgets.tsx:393](src/pages/Budgets/Budgets.tsx#L393), [RecentBudgets.tsx:167](src/components/Dashboard/RecentBudgets.tsx#L167), [ProductList.tsx](src/components/Budget/ProductList.tsx), [BudgetPdf.tsx](src/utils/PDFGenerator/BudgetPdf.tsx)

`brMoneyMask` encadeia 3 `.replace` com regex por chamada, e é o 3º god node do grafo (21 edges) — invocada por célula de valor em cada linha e por item de produto. Custo unitário é baixo; só se torna relevante em listas muito grandes sem virtualização. Sem ação imediata; mantido no radar caso listas cresçam.

---

### Eixo 4 — Cache / I/O `localStorage`

---

#### 🟠 PERF-11 — MÉDIA — Amplificação de escrita: cada mutação de 1 item re-serializa as 4 coleções
**Arquivos:** [cacheService.ts:145-154](src/services/cacheService.ts#L145-L154), [cacheService.ts:211-250](src/services/cacheService.ts#L211-L250)

Fluxo de `addItemToCache`/`updateItemInCache`/`removeItemFromCache`:
1. `getCache(key)` → pode `JSON.parse` do blob inteiro do `localStorage`.
2. Recria o array (spread/`map`/`filter` — O(N)).
3. `setCache` → `persistToStorage` → `localStorage.getItem` (blob inteiro) → `JSON.parse` (**budgets + clients + products + representatives**) → muta uma chave → `JSON.stringify` (**tudo de novo**) → `localStorage.setItem`.

Ou seja: adicionar **um** orçamento re-serializa síncronamente **as quatro coleções inteiras** na main thread. `localStorage` é I/O **bloqueante**. Com base grande, cada CRUD vira um stall perceptível de UI. `updateItemInCache` ainda faz `.map` sobre o array todo para trocar 1 item.

**Impacto:** latência de escrita O(N) por operação; principal fonte de jank em CRUD conforme a base cresce.

**Sub-item PERF-11-quota (BAIXA):** `persistToStorage` engole exceções em `catch → console.error` ([cacheService.ts:151-153](src/services/cacheService.ts#L151-L153)). Se estourar o limite (~5 MB) via `QuotaExceededError`, a persistência falha **silenciosamente** e o cache para de sobreviver a reloads sem aviso — teto de escalabilidade oculto.

---

#### 🟡 PERF-12 — BAIXA — `console.*` em hot paths, sem stripping em produção
**Arquivos:** [cacheService.ts](src/services/cacheService.ts) (10 ocorrências), [DataContext.tsx:139-145](src/context/DataContext.tsx#L139-L145) (3), +19 arquivos / 45 no total

`getCache` loga HIT/MISS a **cada chamada** ([cacheService.ts:60,67,74](src/services/cacheService.ts#L60)), e é chamado dentro de cada mutação de cache (que chama `getCache` e depois `setCache`, que também loga). Em loop/hot path, `console.log` tem custo de CPU e serialização de argumentos, e vai para produção (sem `esbuild.drop`/flag de debug). Também vaza informação operacional (cross-ref relatório de segurança).

**Impacto:** ruído + CPU em produção. Mitigar com `esbuild: { drop: ['console'] }` no build de prod ou um wrapper de logger com flag.

---

### Eixo 5 — I/O bloqueante e ciclo de vida

---

#### 🟠 PERF-14 — MÉDIA — `window.location.reload()` após criar orçamento descarta toda a SPA
**Arquivo:** [BudgetFormPage.tsx:149](src/pages/BudgetFormPage/BudgetFormPage.tsx#L149)

No fluxo "Adicionar Outro" após salvar, o código faz `window.location.reload()`. Isso **destrói e recria toda a árvore React**, re-parseia o bundle e re-executa o boot do `DataContext` (relê `localStorage`, e se o TTL/estado exigir, refaz os full-scans de PERF-02). O orçamento já foi inserido no cache via `addBudgetToCache` na linha 136 — o reload é puro desperdício e contradiz a arquitetura de cache/SPA (a própria `CLAUDE.md` proíbe `window.location.reload()`).

Correção: resetar o estado do formulário localmente (limpar `form`/`selectedProducts`) em vez de recarregar.

**Impacto:** elimina um reload completo do app no caminho de criação em lote — ganho grande de percepção de velocidade.

---

#### 🟡 PERF-15 — BAIXA — `setTimeout` de auto-logout acumula timers e usa valor errado (~30 h)
**Arquivo:** [ContextAuth.tsx:66-80](src/context/ContextAuth.tsx#L66-L80)

`scheduleAutoLogout` é chamado no `login` **e** a cada disparo de `onAuthStateChanged` ([ContextAuth.tsx:98](src/context/ContextAuth.tsx#L98)), sempre criando um `setTimeout` novo **sem limpar o anterior** (não há `clearTimeout`, nenhuma `ref`). Em múltiplas transições de auth, timers se acumulam (vazamento leve). Além disso, `6 * 60 * 60 * 5000` ≈ **30 h**, apesar do comentário "2 horas" (cross-ref SEG-03, ali como bug de sessão; aqui como recurso não liberado).

**Impacto:** vazamento de timers e comportamento de sessão incorreto. Guardar o id do timer em `useRef` e `clearTimeout` antes de reagendar.

---

## 3. Propostas Técnicas de Otimização (código atual → otimizado)

### 3.1 · PERF-01 + PERF-04/05 — Code-splitting + limpeza de dependências

**`vite.config.ts` — adicionar manualChunks e drop de console em prod:**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": ["@mui/material", "@mui/icons-material", "@mui/x-data-grid"],
          "vendor-firebase": ["firebase/app", "firebase/auth", "firebase/firestore"],
          "vendor-pdf": ["@react-pdf/renderer"],
        },
      },
    },
  },
  // Remove console.* no bundle de produção (mitiga PERF-12)
  esbuild: mode === "production" ? { drop: ["console", "debugger"] } : {},
}));
```

**`Router.tsx` — lazy loading por rota (isola PDF e telas pesadas):**
```tsx
import { lazy, Suspense, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CircularProgress } from "@mui/material";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthContext } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { DataProvider } from "./context/DataContext";

const Home = lazy(() => import("./pages/Home/Home").then(m => ({ default: m.Home })));
const Products = lazy(() => import("./pages/Products/Products"));
const Clients = lazy(() => import("./pages/Clients/Clients"));
const Budgets = lazy(() => import("./pages/Budgets/Budgets"));
const Representatives = lazy(() => import("./pages/Representatives/Representatives"));
const BudgetFormPage = lazy(() => import("./pages/BudgetFormPage")); // arrasta @react-pdf p/ chunk próprio

// ...dentro do ramo autenticado, envolver <Routes> em <Suspense fallback={<CircularProgress/>}>
```

**`package.json` — remover dependências mortas (PERF-04/05):**
```bash
npm remove uuid react-pdf react-firebase-hooks dayjs
# manter: date-fns (única lib de data efetivamente usada)
```

---

### 3.2 · PERF-02 + PERF-03 — Paginação e consulta dedicada de "recentes"

**Consulta dedicada para a dashboard (5 docs em vez de N):**
```ts
// budgetServices.ts
import { query, orderBy, limit } from "firebase/firestore";

export const getRecentBudgets = async (n = 5): Promise<IBudget[]> => {
  const q = query(collection(db, "budgets"), orderBy("createdAt", "desc"), limit(n));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as IBudget[];
};
```

**Listagem paginada com cursor (Orçamentos):**
```ts
import { query, orderBy, limit, startAfter, QueryDocumentSnapshot } from "firebase/firestore";

export const getBudgetsPage = async (
  pageSize = 50,
  cursor?: QueryDocumentSnapshot
): Promise<{ items: IBudget[]; nextCursor?: QueryDocumentSnapshot }> => {
  const base = query(collection(db, "budgets"), orderBy("id", "desc"), limit(pageSize));
  const q = cursor ? query(base, startAfter(cursor)) : base;
  const snap = await getDocs(q);
  return {
    items: snap.docs.map((d) => ({ id: d.id, ...d.data() })) as IBudget[],
    nextCursor: snap.docs[snap.docs.length - 1],
  };
};
```
> Requer índice composto (Firestore sugere no console) e integração de cursor no `DataContext`. Mantém o cache como camada de página; o "carregar mais" anexa a página seguinte.

---

### 3.3 · PERF-06 — Memoizar o `value` do `DataContext`

```tsx
// DataContext.tsx — substituir o objeto literal (linha ~361) por useMemo
import { useMemo } from "react";

const value = useMemo<DataContextState>(() => ({
  budgets, clients, products, representatives,
  loading, loadingEntities,
  refreshAll, refreshBudgets, refreshClients, refreshProducts, refreshRepresentatives,
  searchBudgetsLocal, searchClientsLocal, searchProductsLocal, searchRepresentativesLocal,
  addBudgetToCache: addBudgetToCacheHandler,
  updateBudgetInCache: updateBudgetInCacheHandler,
  removeBudgetFromCache: removeBudgetFromCacheHandler,
  addClientToCache: addClientToCacheHandler,
  updateClientInCache: updateClientInCacheHandler,
  removeClientFromCache: removeClientFromCacheHandler,
  addProductToCache: addProductToCacheHandler,
  updateProductInCache: updateProductInCacheHandler,
  removeProductFromCache: removeProductFromCacheHandler,
  addRepresentativeToCache: addRepresentativeToCacheHandler,
  updateRepresentativeInCache: updateRepresentativeInCacheHandler,
  removeRepresentativeFromCache: removeRepresentativeFromCacheHandler,
  getCacheStats,
}), [
  budgets, clients, products, representatives, loading, loadingEntities,
  refreshAll, refreshBudgets, refreshClients, refreshProducts, refreshRepresentatives,
  searchBudgetsLocal, searchClientsLocal, searchProductsLocal, searchRepresentativesLocal,
  addBudgetToCacheHandler, updateBudgetInCacheHandler, removeBudgetFromCacheHandler,
  addClientToCacheHandler, updateClientInCacheHandler, removeClientFromCacheHandler,
  addProductToCacheHandler, updateProductInCacheHandler, removeProductFromCacheHandler,
  addRepresentativeToCacheHandler, updateRepresentativeInCacheHandler, removeRepresentativeFromCacheHandler,
]);
```
> Ganho adicional (opcional, maior refatoração): dividir em contextos por entidade (`BudgetsContext`, `ProductsContext`, …) para que mudar `products` não re-renderize consumidores de `budgets`.

---

### 3.4 · PERF-09 — Um único modal de exclusão fora do `.map`

```tsx
// Budgets.tsx — remover o <DeleteBudgetModal> de dentro do map (linhas 477-483)
// e renderizar UMA vez, após a lista:
{(() => {
  const target = filteredBudgets.find((b) => b.id === deleteModalId);
  return (
    <DeleteBudgetModal
      open={deleteModalId !== null}
      onClose={() => setDeleteModalId(null)}        // cancelar NÃO mexe no cache
      onDeleted={() => { removeBudgetFromCache(deleteModalId!); setDeleteModalId(null); }}
      budget={target}
    />
  );
})()}
```
> `1` Dialog no lugar de `N`. Também separa "cancelar" de "excluído" (corrige A-01/SEG do fluxo de exclusão).

---

### 3.5 · PERF-11 — Persistência por chave (evita re-serializar as 4 coleções)

```ts
// cacheService.ts — uma chave de localStorage por coleção, isolando a serialização
const storageKeyFor = (key: CacheKey) => `${STORAGE_KEY}:${key}`;

const persistToStorage = <T>(key: CacheKey, entry: CacheEntry<T>): void => {
  try {
    localStorage.setItem(storageKeyFor(key), JSON.stringify(entry)); // só a coleção mutada
  } catch (error) {
    if (error instanceof DOMException && error.name === "QuotaExceededError") {
      console.error("[Cache] Quota excedida — persistência desativada p/ esta chave");
      // opcional: invalidar coleções menos usadas / degradar p/ só-memória
    }
  }
};

const loadFromStorage = <T>(key: CacheKey): CacheEntry<T> | null => {
  try {
    const raw = localStorage.getItem(storageKeyFor(key));
    return raw ? (JSON.parse(raw) as CacheEntry<T>) : null;
  } catch { return null; }
};
```
> Adicionar 1 orçamento passa a serializar **apenas** `budgets`, não as 4 coleções. Trata `QuotaExceededError` explicitamente (PERF-11-quota). Ideal ainda: debounce/`requestIdleCallback` na escrita para tirar o I/O do caminho crítico.

---

### 3.6 · PERF-14 — Resetar formulário em vez de recarregar a página

```tsx
// BudgetFormPage.tsx — no ramo "Adicionar Outro" (substituir window.location.reload())
} else {
  // limpa o estado local do formulário; o cache já foi atualizado via addBudgetToCache
  form.setBudget({ ...DEFAULT_BUDGET } as IBudget);
  form.setProductSearchTerm("");
  form.setRepresentativeSearchInput("");
  // (expor um form.reset() no hook useBudgetForm é a forma mais limpa)
}
```

### 3.7 · PERF-08 / PERF-07 — Debounce na busca global e memo nos recentes

```tsx
// GlobalSearch.tsx
const debouncedQuery = useDebounce(query, 300);
useEffect(() => { /* usa debouncedQuery em vez de query */ }, [debouncedQuery, clients, budgets, products]);

// RecentBudgets.tsx
const recentBudgets = useMemo(
  () => [...budgets].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 5),
  [budgets]
);
```

### 3.8 · PERF-15 — Timer de logout com `useRef` + `clearTimeout`

```tsx
const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const scheduleAutoLogout = () => {
  const loginTime = sessionStorage.getItem("loginTime");
  if (!loginTime) return;
  if (logoutTimer.current) clearTimeout(logoutTimer.current); // limpa o anterior
  const SESSION_MS = 2 * 60 * 60 * 1000; // 2 h de verdade (corrige o ~30 h)
  const remaining = SESSION_MS - (Date.now() - parseInt(loginTime, 10));
  if (remaining > 0) logoutTimer.current = setTimeout(logout, remaining);
  else logout();
};
// no cleanup do useEffect de onAuthStateChanged: if (logoutTimer.current) clearTimeout(logoutTimer.current);
```

---

## 4. Plano de Implementação Consolidado de Performance

> Esta seção substitui o antigo backlog. Define **dono único por item**, fases (P0–P2) e critérios de aceite.
> Checklists operacionais e log: [`PLANO_EXECUCAO_PERFORMANCE.md`](./PLANO_EXECUCAO_PERFORMANCE.md).

### 4.0 Verificação do diagnóstico contra o código-fonte (2026-07-09)

- ✅ PERF-01: `vite.config.ts` é o default nu; `Router.tsx` importa todas as páginas eager (0 `lazy`/`Suspense`).
- ✅ PERF-04/05: `package.json` contém `uuid`, `react-pdf`, `react-firebase-hooks`, `dayjs` (candidato extra a verificar: `dotenv`, desnecessário em app Vite).
- ✅ PERF-11: `cacheService.ts:145-154` — `persistToStorage` faz `getItem` + `JSON.parse` do blob inteiro, muta 1 chave e `JSON.stringify` **do blob com as 4 coleções**; `catch` genérico engole `QuotaExceededError`.
- ✅ PERF-08: `GlobalSearch.tsx:54` — `useEffect` roda a cada tecla, sem `useDebounce`.
- ✅ PERF-07/PERF-03: `RecentBudgets.tsx:66-68` — sort do array completo, fora de `useMemo`; recebe as coleções inteiras.
- ✅ PERF-10: `Home.tsx:37-43` calcula `totalValue`/`maxBudget` (2 reduces O(N)).
- ⚠️ **Achado novo na verificação:** `RecentBudgets.tsx:41-63` **duplica** o `handleOpenPdf` legado de `Budgets.tsx` (`document.write` + `ReactDOM.render`) — a rota React de PDF (EST F4.3) deve cobrir **os dois** call sites.

### 4.1 Matriz de dono único (itens PERF executados por outra trilha)

Vários achados desta fase são o **mesmo código** apontado por outra auditoria. Para não haver dois checklists
mudando o mesmo arquivo, cada item tem **um** dono (regra do [Plano Diretor](../SUMARIO_CONSOLIDADO.md)):

| Item PERF | Dono da execução | Papel da trilha PERF |
|---|---|---|
| PERF-T04 (memoizar `DataContext.value`) | **EST F0.5** | Validar ganho (re-render) após execução |
| PERF-T08 (`window.location.reload` → reset) | **EST F0.3** | Validar que o cold-load O(N) não é mais re-disparado |
| PERF-T13 (timer de logout) | **SEG S0.3** | Referência (mesmo `setTimeout` de SEG-03) |
| PERF-T12 (cálculo morto em `kpiData`) | **UI U0.1** (exibir `totalValue` real resolve; remover `maxBudget` se seguir sem uso) | Referência |
| PERF-T11 (logger com flag) | **EST F4.5** (logger) · o `esbuild.drop` em prod fica **aqui** (P0.2, junto do vite.config) | Executa só o drop de build |
| PERF-T10 (`useMemo` em `recentBudgets`) | **Absorvido por P0.3** — com `getRecentBudgets(5)`, o sort O(N) no cliente deixa de existir | — |
| PERF-T15 (split de contexto por entidade) | Opcional pós-**EST F2.2** (store factory já isola por entidade) | Reavaliar necessidade após F2.2 |

### 4.2 Roadmap por fases (itens de dono PERF)

| Fase | Item | Achado | Pré-requisito |
|---|---|---|---|
| **P0** | P0.1 Remover deps mortas (`uuid`, `react-pdf`, `react-firebase-hooks`, `dayjs`; verificar `dotenv`) | PERF-04/05 | — |
| **P0** | P0.2 Code-splitting: `React.lazy` por rota + `manualChunks` + `esbuild.drop` console em prod | PERF-01 (+parte de PERF-12) | — |
| **P0** | P0.3 `getRecentBudgets(5)` dedicado para a dashboard (com loading próprio do widget) | PERF-03 (+absorve PERF-07) | — |
| **P1** | P1.1 Modal único de exclusão fora do `.map` | PERF-09 | **EST F0.1** (contrato `onDeleted`) |
| **P1** | P1.2 Paginação por cursor em Orçamentos | PERF-02 | **EST F2.1/F2.2** (não migrar services 2×) |
| **P1** | P1.3 `localStorage` por chave + tratar `QuotaExceededError` | PERF-11 | — |
| **P1** | P1.4 `useDebounce` na `GlobalSearch` | PERF-08 | — |
| **P2** | P2.1 "Budget summary" denormalizado para listagens | PERF-13 | ADR **EST F4.6** |
| **P2** | P2.2 (Opcional) contextos por entidade | PERF-06 ext. | EST F2.2 |

A tabela original abaixo permanece como **referência de spec** (ganho esperado por tarefa); a execução segue
a matriz de dono acima e o `PLANO_EXECUCAO_PERFORMANCE.md`.

| ID | Prioridade | Esforço | Tarefa | Ganho esperado | Ref. |
|----|-----------|---------|--------|----------------|------|
| **PERF-T01** | P0 | M | Code-splitting: `React.lazy` por rota + `manualChunks` (Vite). Isolar `@react-pdf/renderer` em chunk sob demanda. | **Alto** — TTI/FCP iniciais; PDF sai do bundle crítico. | PERF-01 |
| **PERF-T02** | P0 | S | Remover deps mortas: `uuid`, `react-pdf`, `react-firebase-hooks`, `dayjs`. | **Médio-alto** — bundle + instalação; risco baixo. | PERF-04/05 |
| **PERF-T03** | P0 | S | Consulta dedicada `getRecentBudgets(5)` (`orderBy`+`limit`) para a dashboard. | **Alto** — de N reads → 5 na tela mais acessada. | PERF-03 |
| **PERF-T04** | P0 | S | Memoizar `value` do `DataContext` com `useMemo`. | **Alto** — corta cascata de re-render global. | PERF-06 |
| **PERF-T05** | P1 | S | Um único `DeleteBudgetModal` fora do `.map` em `Budgets`. | **Médio-alto** — N Dialogs → 1; corrige A-01. | PERF-09 |
| **PERF-T06** | P1 | M | Paginação por cursor (`limit`+`startAfter`) em Orçamentos + integração no cache. | **Alto** (escala) — reads O(página) em vez de O(N). | PERF-02 |
| **PERF-T07** | P1 | M | `localStorage` por chave (1 blob por coleção) + tratar `QuotaExceededError`. | **Médio** — remove stall O(N) por CRUD. | PERF-11 |
| **PERF-T08** | P1 | S | Trocar `window.location.reload()` por reset de formulário no "Adicionar Outro". | **Médio** — elimina reload completo do app. | PERF-14 |
| **PERF-T09** | P2 | S | `useDebounce` na `GlobalSearch`. | **Médio** — menos jank por tecla conforme base cresce. | PERF-08 |
| **PERF-T10** | P2 | S | `useMemo` em `recentBudgets` (`RecentBudgets`). | **Baixo-médio** — CPU redundante na home. | PERF-07 |
| **PERF-T11** | P2 | S | `esbuild.drop: ['console']` no build de produção (+ logger com flag). | **Baixo-médio** — CPU/ruído em prod; menos vazamento. | PERF-12 |
| **PERF-T12** | P2 | S | Remover cálculo morto de `totalValue`/`maxBudget` em `kpiData` (ou concluir a feature). | **Baixo** — 2 passagens O(N) por recálculo. | PERF-10 |
| **PERF-T13** | P3 | S | Timer de logout com `useRef`+`clearTimeout` e valor correto (2 h). | **Baixo** — vazamento de timers; corrige sessão. | PERF-15 |
| **PERF-T14** | P3 | L | Coleção/campo "budget summary" denormalizado para listagens (documento gordo só no detalhe/PDF). | **Alto** (escala longo prazo) — transferência/parse/`localStorage`. | PERF-13 |
| **PERF-T15** | P3 | M | (Opcional) Dividir `DataContext` em contextos por entidade. | **Médio** (escala) — isola re-render por domínio. | PERF-06 |

### Sequência de execução (consolidada)
1. **P0 — quick wins de dono PERF:** P0.1 (deps) → P0.2 (splitting + drop) → P0.3 (recentes). Em paralelo, os ganhos de T04/T08 chegam via **EST F0** (memoização e reset de form).
2. **P1 — dados & runtime:** P1.1 (modal único, após EST F0.1) → P1.3 (localStorage por chave) → P1.4 (debounce) → P1.2 (paginação, **após** EST F2.1/F2.2 para não migrar os services duas vezes).
3. **P2 — escala de longo prazo:** P2.1 (summary, após ADR EST F4.6) e P2.2 (split de contexto, reavaliar após EST F2.2).
4. **Medição:** após P0, rodar `vite build` + `rollup-plugin-visualizer` e trace do DevTools para quantificar os ganhos (baseline vs. resultado) — registrar no log do plano de execução.

---

## 5. Observações Finais e Limites da Análise

- **A base atual é pequena.** Nenhum destes gargalos causa dor perceptível hoje; todos são **multiplicadores latentes** que se materializam com crescimento. A prioridade P0 foca no que dá ganho **imediato** (bundle, dashboard, re-render) e no que é **barato agora e caro depois** (paginação).
- **O que a análise estática não mede:** números reais de TTI, tamanho exato dos chunks e tempo de serialização dependem de profiling em runtime. Recomenda-se, após T01/T02, rodar `vite build` e inspecionar o relatório de chunks (ex.: `rollup-plugin-visualizer`) e um trace do DevTools Performance para quantificar os ganhos.
- **Cross-referências:** PERF-15 ↔ SEG-03 (mesmo `setTimeout`), PERF-09 ↔ A-01 (mesmo modal), PERF-12 ↔ segurança (vazamento por `console`). Corrigir uma vez resolve nas duas frentes.
- **O que já está bom (não mexer):** o cache em si, a geração atômica de IDs por transação, o uso de `useDebounce` em Budgets/useBudgetForm, a virtualização interna do `@mui/x-data-grid` e a ausência de ciclos de import (bom para tree-shaking).

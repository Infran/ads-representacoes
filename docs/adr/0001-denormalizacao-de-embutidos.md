# ADR 0001 — Denormalização de objetos embutidos (`IBudget`, `IRepresentative`)

- **Status:** Aceito
- **Data:** 2026-07-11
- **Trilha/Item:** EST F4.6 (resolve o achado A-05 / PERF-13/T14)
- **Relacionado:** SEG (validação server-side em `firestore.rules`) · PERF P2.1 ("budget summary")

## Contexto

O modelo de dados do app duplica dados entre coleções de propósito:

- **`IBudget`** (`src/interfaces/ibudget.ts`) embute o **`IClient`** completo, o
  **`IRepresentative`** completo e uma lista de **`ISelectedProducts`** — cada um
  com um **snapshot de `IProduct`** + `quantity` + `customUnitValue` opcional.
- **`IRepresentative`** (`src/interfaces/irepresentative.ts`) embute o
  **`IClient`** completo do seu cliente-pai.

Ou seja: os objetos embutidos **não são referências** (foreign keys) resolvidas
em tempo de leitura — são **cópias** gravadas dentro do documento pai.

Isso é natural para o domínio: um **orçamento é um documento comercial** — ele
precisa refletir os dados do cliente, do representante e dos produtos **como eram
no momento em que foi emitido**. Se o preço de um produto mudar amanhã, os
orçamentos de ontem **não podem** mudar junto. O `customUnitValue` reforça isso:
é um override de preço **por orçamento** que, por decisão explícita, **não muta**
o produto base (`ISelectedProducts.customUnitValue` — ver comentário na interface).

## Decisão

**Tratar os objetos embutidos como snapshots imutáveis intencionais**, não como
dados a serem mantidos em sincronia com a coleção de origem.

1. **Não cascatear** atualizações de `clients`/`products`/`representatives` para
   documentos históricos de `budgets` (nem de `clients` para `representatives`
   já existentes). Editar um cliente atualiza a coleção `clients` e o cache; os
   orçamentos passados permanecem com o snapshot original — isso é **correto**.
2. **A fonte de verdade do estado atual** de uma entidade é a sua própria
   coleção (`clients`, `products`, `representatives`), lida via `useData()`. Um
   snapshot dentro de um `budget` é a fonte de verdade **daquele orçamento**, não
   da entidade "hoje".
3. Novas telas/relatórios que precisem do estado **atual** de um cliente/produto
   devem ler a coleção da entidade — **nunca** derivar do snapshot embutido.

## Consequências

**Positivas**
- **Correção de domínio:** o histórico de orçamentos é fiel ao momento da emissão.
- **Leitura barata (PERF):** listar orçamentos não exige N leituras extras para
  "resolver" cliente/representante/produtos — cada documento já é autossuficiente.
  É parte de por que o cache em `DataContext` cabe no free-tier do Firestore.

**Negativas / trade-offs**
- **Duplicação de dados** e documentos de `budget` **grandes** (carregam produtos
  inteiros). Isso infla a leitura da coleção `budgets` na Home/listagem →
  endereçado por **PERF P2.1 ("budget summary")**: projetar um resumo leve
  (id, cliente, total, data) para as telas de lista, sem baixar o objeto inteiro.
- **Sem integridade referencial automática:** as `firestore.rules` **não podem**
  presumir que o snapshot embutido bate com a coleção de origem. A validação
  server-side (trilha **SEG**) valida a **forma** do documento gravado (campos
  obrigatórios/tipos), não a consistência entre a cópia e o "original".
- Um dado corrigido (ex.: nome de cliente digitado errado) **não** se propaga
  retroativamente. Se algum dia for desejável "recarimbar" um orçamento com os
  dados atuais, isso precisa ser uma ação **explícita e opcional** do usuário
  (reabrir/reeditar o orçamento), nunca um efeito colateral de editar a entidade.

## Alternativas consideradas

- **Normalizar (guardar só IDs e resolver na leitura):** rejeitada — quebraria a
  imutabilidade histórica do orçamento e multiplicaria as leituras do Firestore
  (contra a otimização de PERF), além de exigir *joins* client-side.
- **Sincronização por cascata (Cloud Functions):** rejeitada — reescreveria o
  histórico, é cara em escritas e contradiz o requisito de domínio.

## Notas de implementação

- A limpeza de `undefined` e a criação atômica dos documentos vivem em
  `src/services/createCrudService.ts` (EST F2.1).
- Valores monetários embutidos (`unitValue`, `customUnitValue`, `totalValue`)
  são **centavos** inteiros (ver `src/utils/Masks.ts`).

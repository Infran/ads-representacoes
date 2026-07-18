# 0001 — Orçamento rápido a partir do contexto (produto / cliente / representante)

- **Status:** Rascunho
- **Prioridade:** Média
- **Esforço:** M
- **Origem:** Redesign "cockpit", agora em **Produtos, Clientes e Representantes**
  (`src/components/Cockpit/`). O painel de detalhes de cada tela tem um botão
  **"Novo orçamento"** (`onPrimaryAction`) que hoje só navega para o formulário
  vazio — ver `CockpitDetailPanel` e cada `*.tsx` (`navigate("/Orcamentos/Adicionar")`).
  Como o botão é o mesmo componente compartilhado, semear o formulário a partir do
  contexto passou a valer para as três entidades (produto, cliente, representante).
- **Relacionado:** `src/pages/BudgetFormPage/BudgetFormPage.tsx` ·
  `src/hooks/useBudgetForm.ts` · `src/interfaces/ibudget.ts` (`ISelectedProducts`) ·
  `src/components/Cockpit/CockpitDetailPanel.tsx` ·
  `src/Router.tsx` (rota `Orcamentos/Adicionar`) · `docs/adr/0001-denormalizacao-de-embutidos.md`.

## Contexto / Problema

Quando o usuário está olhando um produto (painel de detalhes em **Produtos**) e
decide orçá-lo, o botão **"Novo orçamento"** o leva para
`/Orcamentos/Adicionar` com o **formulário em branco**. Ele precisa então
**reencontrar e re-selecionar** o mesmo produto que acabou de ver — um passo
redundante num caminho comum (partir de um produto para cotá-lo).

O formulário de criação (`useBudgetForm`, modo `"create"`) hoje só aceita
`initialData?: IBudget | null` — usado no modo `"edit"`. Não há um jeito de
**semear** o formulário com um produto vindo de outra tela.

## Proposta

**"Orçamento rápido":** ao acionar "Novo orçamento" a partir do contexto de um
produto, abrir o formulário de criação **já com aquele produto adicionado**
(quantidade 1), pronto para o usuário escolher o representante e finalizar.

O produto entra como um `ISelectedProducts` (snapshot do `IProduct` atual +
`quantity: 1`), coerente com o modelo de dados — ver **Requisitos técnicos**.

## Requisitos técnicos

- **Passar o contexto para o formulário.** Duas opções:
  - **Router state** — `navigate("/Orcamentos/Adicionar", { state: { productId } })`.
    Simples e não expõe nada na URL; **porém se perde no refresh** (F5 volta ao
    formulário vazio).
  - **Query param** — `/Orcamentos/Adicionar?produto=<id>`. Sobrevive a refresh e
    é compartilhável; exige ler/validar o param.
  - Decidir entre os dois é uma **pergunta em aberto** (abaixo).
- **Semear o `useBudgetForm`.** Estender `UseBudgetFormOptions` com algo como
  `initialSelectedProducts?: ISelectedProducts[]` (ou um seed geral no modo
  `create`), e inicializar `selectedProducts` a partir dele. Hoje a assinatura é
  só `{ initialData?: IBudget | null }`.
- **Resolver o produto pelo cache, não pelo Firestore.** `BudgetFormPage` já lê
  via `useData()`; buscar `products.find(p => p.id === id)` — **zero leitura
  extra** (respeita a otimização de cache do `DataContext`).
- **Snapshot imutável (ADR 0001).** O produto embutido no orçamento é uma **cópia
  do estado atual**, não uma referência. Semear com o snapshot corrente e deixar
  o `customUnitValue` como override **por orçamento** (não muta o produto base).
- **Dinheiro em centavos.** `unitValue`/`customUnitValue` são inteiros em centavos
  (`src/utils/Masks.ts`); o seed não deve reconverter nada.

## Fora de escopo (por ora)

- **Salvar direto sem revisão.** O fluxo sempre abre o formulário para o usuário
  revisar/escolher representante — nada é gravado automaticamente.
- **Pré-selecionar cliente/representante.** Produto não carrega cliente; uma
  segunda fase pode semear representante quando a origem for uma tela que o tenha.
- **Adicionar múltiplos produtos de uma vez** (ex.: seleção em massa na tabela).

## Critérios de aceite

- [ ] No painel de detalhes de um produto, **"Novo orçamento"** abre o formulário
      de criação **com aquele produto já na lista** (`quantity: 1`), pronto para
      escolher representante e finalizar.
- [ ] Abrir `/Orcamentos/Adicionar` **sem contexto** continua exibindo o
      formulário **vazio** (comportamento atual preservado).
- [ ] O produto semeado usa o **snapshot atual** do catálogo; editar o produto
      depois **não** altera um orçamento já criado (ADR 0001).
- [ ] **Nenhuma leitura extra** ao Firestore (produto resolvido pelo cache).
- [ ] Se o `id` de contexto não existir mais no catálogo, o formulário abre vazio
      (degradação silenciosa, sem erro).

## Perguntas em aberto

- **Router state vs. query param?** State é mais simples e limpo; query param
  sobrevive a refresh e é linkável. Preferência do produto?
- Quando o produto **não tem preço** (`unitValue` ausente/0), o botão deve ficar
  desabilitado, ou permitir orçar e exigir `customUnitValue` no formulário?
- Os **três pontos de entrada já existem** (o botão "Novo orçamento" no painel de
  Produtos, Clientes e Representantes). Semear o formulário para todos de uma vez
  (produto → item; cliente → cliente pré-selecionado; representante → representante
  pré-selecionado), ou entregar só o caso do produto primeiro?

## Notas de implementação

- Ponto de entrada atual (stub): `ProductDetailPanel` recebe `onNewBudget` e
  `Products.tsx` faz `navigate("/Orcamentos/Adicionar")`. É só trocar por um
  navigate **com contexto** e ensinar o `BudgetFormPage`/`useBudgetForm` a lê-lo.
- Validação por seção já existe (`sectionValidation` em `useBudgetForm`): com o
  produto semeado, a seção **products** já nasce válida; faltará só representante
  e termos — bom para guiar o foco inicial da UI.

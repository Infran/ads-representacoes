# Capítulo 05: Dashboard e Visão Geral da Tela Inicial 🏠

A **Dashboard** é a tela inicial do sistema. Ela serve como um painel de controle onde você vê o resumo do desempenho comercial da ADS Representações através de cartões indicadores, gráficos de vendas e atalhos de navegação.

---

## 📋 1. O que é a Dashboard?

Quando você faz login no sistema, a primeira tela exibida é a Dashboard (ou Tela Inicial). O objetivo dela não é cadastrar dados, mas sim dar uma **visão rápida de tudo o que está acontecendo no sistema**. Em vez de abrir lista por lista para contar quantos clientes ou orçamentos você tem, a Dashboard resume tudo isso em um só lugar.

---

## 🗂️ 2. Cartões Indicadores (KPIs)

No topo da tela, você verá quatro blocos coloridos chamados de cartões de estatísticas ou KPIs. Eles mostram números acumulados calculados em tempo real:

| Nome do Cartão | O que ele exibe? | Texto de Apoio (Helper Text) |
| :--- | :--- | :--- |
| **Valor Total** | A soma total em dinheiro de todos os orçamentos já emitidos. | Exibe a quantidade de orçamentos somados. |
| **Orçamentos** | A quantidade total de propostas gravadas no sistema. | Mostra quantos orçamentos foram emitidos no mês atual (Ex: `+3 este mês`). |
| **Produtos** | O número total de produtos cadastrados no catálogo. | Exibe o texto fixed: `No catálogo`. |
| **Clientes** | A quantidade total de empresas/clientes cadastradas. | Mostra o nome do último cliente cadastrado para você acompanhar novidades. |

---

## 📊 3. Gráficos de Desempenho

Abaixo dos cartões indicadores, existem dois gráficos dinâmicos que ajudam a entender as tendências comerciais:

### Gráfico A: Evolução do Valor Orçado (Linha)
*   **O que mostra:** A variação do valor total orçado mês a mês ao longo dos últimos 12 meses.
*   **Para que serve:** Ajuda a identificar quais meses do ano são mais fortes em vendas e se o faturamento geral está subindo ou caindo ao longo do ano.

### Gráfico B: Produtos Mais Orçados (Barras)
*   **O que mostra:** O ranking dos produtos que mais aparecem nos orçamentos, ordenados pela quantidade total de itens pedidos.
*   **Para que serve:** Ajuda você a ver quais são os produtos campeões de vendas da sua representação, focando seus esforços comerciais no que tem mais saída.

---

## 🗂️ 4. Lista de Orçamentos Recentes

No meio da tela, há uma tabela compacta exibindo as últimas propostas que você ou sua equipe criaram.
*   **Informações rápidas:** Mostra o ID do orçamento, o nome do cliente, a data de emissão e o valor total.
*   **Acesso rápido:** Se você acabou de salvar um orçamento e quer conferir o PDF dele de forma rápida, basta procurá-lo nesta lista de recentes e clicar no ícone correspondente ao PDF.

---

## ⚡ 5. Cartões de Acesso Rápido

No final da tela inicial, existem três blocos que funcionam como "portais de atalho":

1.  **Atalho Clientes:** Exibe o número de empresas e possui o botão para levar você direto para a tela de Clientes.
2.  **Atalho Representantes:** Exibe a quantidade de representantes cadastrados e leva você para a tela correspondente.
3.  **Atalho Produtos:** Mostra a quantidade de produtos cadastrados e serve de atalho direto para o Catálogo.

---

## ❓ Perguntas Frequentes (FAQ)

**1. Fiz um orçamento agora, mas o valor no cartão "Valor Total" ou nos gráficos não mudou. O que fazer?**
O sistema atualiza a Dashboard com base no cache do navegador. Na maioria das vezes, a atualização é instantânea. Se não mudar, clique em outra tela (como "Clientes") e volte para "Dashboard", ou simplesmente recarregue a página do navegador (tecla `F5`). Isso forçará a limpeza do cache e re-calculará as métricas na hora.

**2. O que significa "Nenhum este mês" no cartão de Orçamentos?**
Isso significa apenas que, até o momento no mês atual, nenhum orçamento novo foi emitido no sistema. O contador zerará todo início de mês automático.

---

### Botões de Ação Rápida
*   **[Ir para a Tela Inicial (Dashboard) 🏠](route://Home)**
*   **[Criar Novo Orçamento Rápido ➕](route://Orcamentos/Adicionar)**
*   **[Voltar para o Sumário da Ajuda 📖](file:///d:/Dev/Frontend/CurrentProjects/ads-representacoes/docs/manual/README.md)**

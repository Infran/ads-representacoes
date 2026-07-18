# Capítulo 02: Cadastro de Representantes 👔

Os **Representantes** são os contatos comerciais e técnicos vinculados aos seus clientes. Nesta seção do manual, você aprenderá como cadastrá-los, associá-los de forma correta aos clientes e economizar tempo utilizando o recurso de preenchimento automático de endereços.

---

## 📋 1. O que é o Cadastro de Representante?

Diferente do Cliente (que representa a empresa/entidade jurídica), o **Representante** é a pessoa física que trabalha nessa empresa e que interage com você. É o contato direto (o vendedor, comprador, engenheiro ou diretor) que solicita a proposta e que terá seu nome impresso na folha de orçamento.

---

## 🗂️ 2. Tipos de Dados Aceitos e Formatos (Campos do Formulário)

Ao cadastrar um representante, atente-se aos seguintes campos:

| Nome do Campo | Obrigatório? | O que digitar? | Comportamento e Formatação |
| :--- | :--- | :--- | :--- |
| **Cliente** | Não (Mas Recomendado) | Digite o nome da empresa (cliente) cadastrado. | Campo de autocompletar. Mostra sugestões de empresas já cadastradas conforme você digita. |
| **Nome** | **Sim (Obrigatório)** | Nome completo do representante. | Aceita texto livre. Limite de **80 caracteres**. |
| **Cargo** | Não (Opcional) | Função na empresa (Ex: Comprador, Diretor). | Aceita texto livre. Limite de **50 caracteres**. |
| **Email** | Não (Opcional) | E-mail corporativo ou pessoal do contato. | Valida formato de e-mail. Limite de **80 caracteres**. |
| **Telefone** | Não (Opcional) | Telefone fixo comercial. | Formatação automática para `(00) 0000-0000`. |
| **Celular** | Não (Opcional) | Telefone celular (WhatsApp). | Formatação automática para `(00) 00000-0000`. |
| **CEP** | Não (Opcional) | CEP de trabalho do representante. | Formatação automática para `00000-000`. |
| **Endereço** | Não (Opcional) | Logradouro e número do escritório. | Aceita texto livre. Limite de **80 caracteres**. |
| **Estado** | Não (Opcional) | Sigla do Estado. | Aceita texto livre. Limite de **2 caracteres** (Ex: `RS`). |
| **Cidade** | Não (Opcional) | Nome da cidade. | Aceita texto livre. Limite de **50 caracteres**. |

---

## 💡 3. Recurso de Preenchimento Automático de Endereço

Para poupar digitação, o formulário de representante possui uma funcionalidade inteligente:

```mermaid
graph LR
    A[Selecionar Cliente na lista] -->|Autopreencher| B(CEP, Endereço, Cidade e Estado herdados do Cliente)
    B --> C[Opcional: Você pode alterar os campos se o representante trabalhar em outro endereço]
```

*   **Como funciona:** Logo no início do formulário, ao selecionar a empresa do cliente no campo **"Selecione um cliente"**, o sistema busca os dados de endereço cadastrados para essa empresa.
*   **O preenchimento é automático:** Os campos **CEP, Endereço, Cidade e Estado** do representante são preenchidos na mesma hora com os mesmos dados da empresa.
*   **Flexibilidade:** Se o representante trabalha em um escritório filial, home-office ou local diferente da matriz, você pode apagar o endereço preenchido automaticamente e digitar o endereço específico dele. Isso não afetará o endereço cadastrado no cliente!

---

## 🔄 4. O Fluxo de Trabalho Passo a Passo

### A. Como Acessar a Tela de Representantes
Clique no menu lateral esquerdo em **Representantes**. Você verá a lista de contatos com seus respectivos cargos, telefones e as empresas (clientes) às quais pertencem.

### B. Como Cadastrar um Representante
1.  Clique no botão **Adicionar Representante** (ou no símbolo `+` no canto superior direito da listagem).
2.  No formulário que abrir, selecione a empresa dele no campo **"Cliente"**. Digite o nome da empresa e clique na sugestão que aparecer na tela.
3.  Veja o endereço ser preenchido sozinho.
4.  Digite o **Nome** do representante (campo obrigatório).
5.  Preencha os demais dados como cargo, e-mail, telefone e celular.
6.  Clique em **Adicionar**. O registro é salvo na nuvem e atualizado no cache de forma instantânea.

### C. Como Pesquisar, Editar ou Excluir
*   **Pesquisar:** Digite o nome do representante na barra superior da listagem.
*   **Editar:** Clique no ícone de lápis na linha dele, faça as alterações necessárias (inclusive mudar o cliente associado) e clique em **Salvar**.
*   **Excluir:** Clique no ícone de lixeira vermelha na linha do representante e confirme a exclusão no aviso que aparecer.

---

## ❓ Perguntas Frequentes (FAQ)

**1. O que acontece se eu cadastrar um representante sem associar a um cliente?**
O sistema permite salvar um representante sem cliente associado (embora o campo de busca de cliente exista, a validação de formulário exige apenas o **Nome** do representante). No entanto, **recomendamos fortemente associar a um cliente**, pois ao criar um orçamento, você precisará selecionar o representante e o sistema determinará automaticamente o cliente do orçamento com base na associação do representante. Se o representante não tiver cliente, o fluxo de orçamentos não funcionará corretamente para ele.

**2. Posso associar mais de um cliente ao mesmo representante?**
Não. Cada representante é vinculado a uma única empresa (cliente). Se uma pessoa representa duas empresas diferentes, você deve cadastrá-la duas vezes, uma para cada cliente.

---

### Botões de Ação Rápida
*   **[Ir para a Tela de Representantes 👔](route://Representantes)**
*   **[Voltar para o Sumário da Ajuda 📖](file:///d:/Dev/Frontend/CurrentProjects/ads-representacoes/docs/manual/README.md)**

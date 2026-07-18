# Capítulo 01: Cadastro de Clientes 👥

A seção de **Clientes** permite que você gerencie as empresas e clientes parceiros para os quais a ADS Representações emite orçamentos. Aqui você aprenderá como pesquisar, cadastrar, editar e excluir clientes, além de entender quais dados são aceitos.

---

## 📋 1. O que é o Cadastro de Cliente?

Um cliente representa a pessoa jurídica ou física receptora das propostas comerciais. É no cadastro do cliente que guardamos informações cruciais como a razão social (nome), dados de faturamento (CNPJ), localização (CEP, Cidade, Estado e Endereço) e contato (telefone e e-mail).

---

## 🗂️ 2. Tipos de Dados Aceitos e Formatos (Campos do Formulário)

Ao preencher o formulário de cadastro de cliente, preste atenção nas regras de cada campo:

| Nome do Campo | Obrigatório? | O que digitar? | Máscaras e Formatação Automática |
| :--- | :--- | :--- | :--- |
| **Nome** | **Sim (Obrigatório)** | Nome ou Razão Social da empresa. | Aceita qualquer texto. Ex: `Metalúrgica Silva Ltda.` |
| **CNPJ** | Não (Opcional) | Cadastro Nacional da Pessoa Jurídica (14 números). | O sistema formata sozinho para `00.000.000/0000-00` enquanto você digita. |
| **Telefone** | Não (Opcional) | Número de telefone fixo ou celular (DDD + número). | O sistema formata sozinho para `(00) 0000-0000` ou `(00) 00000-0000`. |
| **Email** | Não (Opcional) | E-mail para contato da empresa. | Valida se possui `@` e terminação válida. Máximo de **50 caracteres**. |
| **CEP** | **Sim (Obrigatório)** | Código de Endereçamento Postal (8 números). | O sistema formata sozinho para `00000-000` enquanto você digita. |
| **Endereço** | Não (Opcional) | Logradouro, número, complemento. | Aceita texto livre. Ex: `Av. Brasil, 1500 - Sala 4` |
| **Cidade** | Não (Opcional) | Nome da cidade do cliente. | Aceita texto livre. Ex: `Caxias do Sul` |
| **Estado** | Não (Opcional) | Unidade Federativa (UF). | Aceita texto. Ex: `RS`, `SP`, `SC` |

---

## 🛡️ 3. Regras de Validação Especiais

Para manter a organização e evitar dados errados ou duplicados, o sistema possui duas travas de segurança:

1.  **Trava de Campos Obrigatórios:** Você **não conseguirá clicar em "Adicionar"** se os campos **Nome** e **CEP** não estiverem preenchidos. Se esses campos estiverem em branco, o botão de salvar ficará cinza (desabilitado).
2.  **Validação Inteligente do CNPJ:** Se você decidir digitar um CNPJ, o sistema aplicará uma validação matemática real baseada nos dígitos verificadores.
    *   *O que isso significa?* Se você digitar um CNPJ falso ou inventado (como `11.111.111/1111-11` ou `12.345.678/9012-34`), o sistema mostrará um aviso: **"CNPJ inválido. Verifique os dígitos."** e impedirá o salvamento até que você digite um CNPJ verdadeiro ou deixe o campo em branco.

---

## 🔄 4. O Fluxo de Trabalho Passo a Passo

### A. Como Acessar a Tela de Clientes
Clique no menu lateral esquerdo em **Clientes**. A tela exibirá uma barra de pesquisa e uma tabela com todos os clientes já cadastrados.

### B. Como Cadastrar um Novo Cliente
1.  Na tela de clientes, clique no botão **Adicionar Cliente** (ou no símbolo `+` no canto superior direito).
2.  Um formulário (janela modal) se abrirá no meio da tela.
3.  Preencha as informações do cliente. Lembre-se de preencher obrigatoriamente o **Nome** e o **CEP**.
4.  Se digitar o CNPJ, garanta que seja válido.
5.  Clique em **Adicionar**. O cliente será gravado na nuvem e aparecerá na lista na mesma hora.

### C. Como Pesquisar um Cliente Cadastrado
1.  Na barra superior da listagem, digite no campo **"Digite o nome do cliente"** o termo que deseja buscar.
2.  Você pode digitar o **Nome**, **E-mail**, **Telefone** ou o **Endereço** do cliente.
3.  A tabela se filtrará instantaneamente conforme você digita. Para voltar a ver todos os clientes, basta apagar o texto digitado.

### D. Como Editar um Cliente
1.  Localize o cliente na tabela.
2.  Clique no ícone de lápis correspondente à linha do cliente.
3.  A janela com as informações do cliente abrirá. Modifique o que for necessário.
4.  Clique em **Salvar**. A alteração entrará em vigor instantaneamente no sistema e no cache.

### E. Como Excluir um Cliente
1.  Localize o cliente e clique no ícone da lixeira vermelha na linha dele.
2.  Uma tela de confirmação perguntará se você realmente deseja excluir o cliente (exibindo o nome dele para evitar exclusões acidentais).
3.  Clique em **Confirmar**. O cliente será excluído permanentemente do banco de dados e do cache local.

---

## ❓ Perguntas Frequentes e Resolução de Problemas (FAQ)

> [!CAUTION]
> **Atenção:** Ao excluir um cliente, os orçamentos que já foram emitidos para ele continuam salvos no sistema contendo o snapshot das informações (ver Capítulo 00). No entanto, você não conseguirá criar *novos* orçamentos para este cliente excluído.

**1. Digitei o CEP mas o endereço não preencheu sozinho. O que houve?**
Nesta versão, a integração automática com buscadores de CEP está desligada. Você deve digitar o CEP e escrever manualmente o endereço nos campos Cidade, Estado e Endereço.

**2. Por que o botão "Adicionar" não faz nada ou está desativado?**
Verifique se você escreveu o **Nome** e o **CEP** do cliente. Caso tenha digitado um **CNPJ**, verifique se ele está correto e tem 14 dígitos válidos. Se houver algum erro de preenchimento, uma mensagem vermelha aparecerá no topo do formulário.

---

### Botões de Ação Rápida
*   **[Ir para a Tela de Clientes 👥](route://Clientes)**
*   **[Voltar para o Sumário da Ajuda 📖](file:///d:/Dev/Frontend/CurrentProjects/ads-representacoes/docs/manual/README.md)**

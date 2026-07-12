import React from "react";
import { Box, Typography, Card, CardActionArea } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import {
  SvgIconComponent,
  Home as HomeIcon,
  Apartment,
  Groups,
  Widgets,
  NoteAdd,
  PostAdd,
  MenuBook,
  SpaceDashboard,
  Bolt,
  Cloud,
  Speed,
  History,
  FactCheck,
  AccountTree,
  Payments,
  Insights,
  ArrowForward,
} from "@mui/icons-material";
import Button from "../../ui/Button";
import { HelpChapterMeta, CHAPTER_META } from "./helpMeta";
import {
  SectionTitle,
  Lead,
  Callout,
  FlowSteps,
  FieldTable,
  NumberedList,
  Bullets,
  SubHeading,
  Faq,
  Term,
} from "./helpPrimitives";

/**
 * Conteúdo da Central de Ajuda (/Ajuda) — transcrição estruturada do manual em
 * docs/manual, renderizada com as primitivas de `helpPrimitives`. Cada capítulo
 * recebe `HelpContentProps` para voltar ao Início; os atalhos navegam para as
 * telas reais do app. Registro exportado em `helpChapters`.
 */

export interface HelpContentProps {
  goToOverview: () => void;
  onOpen: (slug: string) => void;
}

// ---------------------------------------------------------------------------
// Atalhos de rodapé — navegam para as telas reais do sistema.
// ---------------------------------------------------------------------------
interface RouteAction {
  label: string;
  to: string;
  icon: SvgIconComponent;
}

const QuickActions: React.FC<{
  title?: string;
  actions: RouteAction[];
  onOverview?: () => void;
}> = ({ title = "Atalhos rápidos", actions, onOverview }) => {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        mt: 4,
        pt: 3,
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: 1 }}
      >
        {title}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25, mt: 1 }}>
        {actions.map((a, i) => (
          <Button
            key={a.to + a.label}
            variant={i === 0 ? "contained" : "outlined"}
            startIcon={<a.icon />}
            onClick={() => navigate(a.to)}
          >
            {a.label}
          </Button>
        ))}
        {onOverview && (
          <Button color="inherit" startIcon={<MenuBook />} onClick={onOverview}>
            Voltar ao início da Ajuda
          </Button>
        )}
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// Cartão de capítulo (sumário do Início).
// ---------------------------------------------------------------------------
const ChapterCard: React.FC<{ meta: HelpChapterMeta; onOpen: (slug: string) => void }> = ({
  meta,
  onOpen,
}) => (
  <Card
    variant="outlined"
    sx={{
      height: "100%",
      borderRadius: 3,
      transition: "border-color .18s ease, background-color .18s ease",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      "&:hover": {
        borderColor: "primary.main",
        bgcolor: (t) => alpha(t.palette.primary.main, 0.03),
      },
      "&:hover .chapter-card-arrow": { transform: "translateX(3px)", opacity: 1 },
    }}
  >
    <CardActionArea
      onClick={() => onOpen(meta.slug)}
      sx={{ height: "100%", p: 2.25, display: "block" }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2,
            flexShrink: 0,
            color: "primary.main",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          }}
        >
          <meta.Icon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <ArrowForward
          className="chapter-card-arrow"
          sx={{
            fontSize: 18,
            color: "primary.main",
            opacity: 0.5,
            transition: "transform .18s ease, opacity .18s ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }}
        />
      </Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5, lineHeight: 1.3 }}>
        {meta.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
        {meta.subtitle}
      </Typography>
    </CardActionArea>
  </Card>
);

// ---------------------------------------------------------------------------
// INÍCIO — visão geral (equivalente ao README do manual).
// ---------------------------------------------------------------------------
export const Overview: React.FC<HelpContentProps> = ({ onOpen }) => (
  <>
    <Lead>
      Bem-vindo à Central de Ajuda do <strong>ADS Representações</strong>. Este
      espaço foi criado para te acompanhar, passo a passo, no uso de cada tela do
      sistema. Gerenciar cadastros e emitir orçamentos pode parecer complicado no
      início — por isso o manual foi escrito com explicações simples e diretas.
    </Lead>

    <SectionTitle icon={MenuBook}>Manuais por tela</SectionTitle>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
      Escolha um capítulo para abrir o guia detalhado. Você pode voltar aqui a
      qualquer momento pelo menu lateral.
    </Typography>
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(3, 1fr)",
        },
      }}
    >
      {CHAPTER_META.map((meta) => (
        <ChapterCard key={meta.slug} meta={meta} onOpen={onOpen} />
      ))}
    </Box>

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={Bolt}>Atalhos para o sistema</SectionTitle>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
        Vá direto para uma tela de trabalho:
      </Typography>
    </Box>
    <QuickActions
      title="Ir para"
      actions={[
        { label: "Dashboard", to: "/Home", icon: HomeIcon },
        { label: "Clientes", to: "/Clientes", icon: Apartment },
        { label: "Representantes", to: "/Representantes", icon: Groups },
        { label: "Produtos", to: "/Produtos", icon: Widgets },
        { label: "Orçamentos", to: "/Orcamentos", icon: NoteAdd },
        { label: "Novo orçamento", to: "/Orcamentos/Adicionar", icon: PostAdd },
      ]}
    />
  </>
);

// ---------------------------------------------------------------------------
// 00 — Introdução e funcionamento geral.
// ---------------------------------------------------------------------------
export const ChapterIntroducao: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      Aqui você aprende as bases do sistema: como a tela se organiza, onde suas
      informações ficam guardadas com segurança e por que a navegação é tão
      rápida.
    </Lead>

    <SectionTitle icon={SpaceDashboard}>Como a tela é organizada</SectionTitle>
    <NumberedList
      items={[
        <>
          <strong>Menu lateral (Sidebar):</strong> fica à esquerda e dá acesso a
          todas as seções — Dashboard, Clientes, Representantes, Produtos,
          Orçamentos e Ajuda. No celular ele pode ser recolhido.
        </>,
        <>
          <strong>Barra superior (Header):</strong> no topo, mostra em qual seção
          você está, exibe notificações e traz o botão para sair com segurança.
        </>,
        <>
          <strong>Área de trabalho central:</strong> onde aparecem as tabelas,
          formulários e botões. É onde você interage com o sistema.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={Cloud} color=”info”>
        Onde as informações ficam salvas
      </SectionTitle>
    </Box>
    <Callout variant=”nota” title=”Nada se perde ao fechar o navegador”>
      Tudo o que você digita é enviado em tempo real e salvo com segurança nos
      servidores do <strong>Google Cloud</strong>. Fechar o navegador ou trocar
      de computador não apaga nada. Seus dados estão sempre seguros.
    </Callout>
    <Bullets
      items={[
        <>
          <strong>Armazenamento em nuvem:</strong> os registros ficam guardados
          online (nos servidores do Google) e você acessa de qualquer lugar com
          login, mesmo de outro computador.
        </>,
        <>
          <strong>Numeração automática:</strong> cada orçamento recebe um número
          único (1, 2, 3…) gerado automaticamente, sem pular números.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={Speed} color="success">
        Por que o sistema é tão rápido?
      </SectionTitle>
    </Box>
    <Bullets
      items={[
        <>
          <strong>Cópia rápida no seu navegador:</strong> quando você entra, o
          sistema traz as listas de clientes, produtos e representantes e as
          guarda localmente no seu navegador para acesso imediato.
        </>,
        <>
          <strong>Buscas e filtros instantâneos:</strong> as pesquisas não
          consultam a internet — rodam no seu computador, por isso aparecem em
          menos de um segundo.
        </>,
        <>
          <strong>Sempre atualizado:</strong> quando você adiciona, edita ou
          exclui algo, a mudança é salva na nuvem e no navegador
          automaticamente.
        </>,
        <>
          <strong>Sincronização automática:</strong> a cada{" "}
          <Term>5 minutos</Term>, o sistema verifica se algum colega digitou
          algo novo e atualiza sua tela automaticamente. Você nunca vê dados
          desatualizados por muito tempo.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={History} color=”warning”>
        A regra de ouro dos orçamentos
      </SectionTitle>
    </Box>
    <Callout variant=”importante” title=”Um orçamento nunca muda automaticamente”>
      Ao criar um orçamento, o sistema faz uma cópia exata de todos os dados do
      cliente, representante e produtos <strong>naquele dia e hora</strong>.
      Essa cópia fica congelada no tempo.
    </Callout>
    <Bullets
      items={[
        <>
          Se você emite um orçamento hoje com o produto X a <Term>R$ 100,00</Term>{“ “}
          e amanhã muda o preço na tabela para <Term>R$ 120,00</Term>, o
          orçamento de ontem <strong>continua com R$ 100,00</strong> para sempre.
          Isso garante que a proposta que você mandou ao cliente é honrada.
        </>,
        <>
          Se o cliente pedir para você atualizar um orçamento antigo com novos
          preços, abra-o em modo de edição, faça as mudanças e salve novamente.
          Esse será um novo orçamento.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    </Box>
    <Faq
      items={[
        {
          q: "Preciso de internet para usar o sistema?",
          a: (
            <>
              Sim, o sistema precisa de conexão para abrir, fazer login e salvar
              registros. Você pode pesquisar e navegar nos dados já carregados
              mesmo com internet lenta, mas para gravar algo novo é necessário
              conexão ativa.
            </>
          ),
        },
        {
          q: "E se dois colegas editarem o mesmo cliente ao mesmo tempo?",
          a: (
            <>
              Vale a alteração que foi salva por último (quem clicou em Salvar
              mais recentemente). A tela do outro colega se atualiza
              automaticamente em até 5 minutos, ou no próximo clique de
              "Atualizar".
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[
        { label: "Ir para o Dashboard", to: "/Home", icon: HomeIcon },
        { label: "Ver orçamentos", to: "/Orcamentos", icon: NoteAdd },
      ]}
      onOverview={goToOverview}
    />
  </>
);

// ---------------------------------------------------------------------------
// 01 — Clientes.
// ---------------------------------------------------------------------------
export const ChapterClientes: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      A seção de Clientes gerencia as empresas para as quais a ADS Representações
      emite orçamentos. Aqui guardamos razão social, dados de faturamento (CNPJ),
      localização e contato.
    </Lead>

    <SectionTitle icon={FactCheck}>Campos do formulário</SectionTitle>
    <FieldTable
      fields={[
        { name: "Nome", req: "req", input: "Nome ou razão social da empresa.", format: "Texto livre. Ex.: Metalúrgica Silva Ltda." },
        { name: "CNPJ", req: "opt", input: "CNPJ da empresa (14 números).", format: <>O sistema formata automaticamente para <Term>00.000.000/0000-00</Term>.</> },
        { name: "Telefone", req: "opt", input: "Telefone fixo ou celular com DDD.", format: <>O sistema formata automaticamente para <Term>(00) 0000-0000</Term>.</> },
        { name: "Email", req: "opt", input: "E-mail de contato da empresa.", format: "Máximo de 50 caracteres. Ex.: contato@empresa.com" },
        { name: "CEP", req: "req", input: "CEP com 8 números.", format: <>O sistema formata automaticamente para <Term>00000-000</Term>.</> },
        { name: "Endereço", req: "opt", input: "Logradouro, número e complemento.", format: "Texto livre. Ex.: Av. Brasil, 1500 - Sala 4." },
        { name: "Cidade", req: "opt", input: "Cidade do cliente.", format: "Texto livre. Ex.: Caxias do Sul." },
        { name: "Estado", req: "opt", input: "Sigla do estado (UF).", format: "Duas letras. Ex.: RS, SP, SC." },
      ]}
    />

    <SectionTitle icon={FactCheck} color=”warning”>
      O que é obrigatório
    </SectionTitle>
    <NumberedList
      items={[
        <>
          <strong>Nome e CEP são obrigatórios:</strong> o botão{“ “}
          <strong>Adicionar</strong> fica desabilitado (cinza) até esses campos
          estarem preenchidos.
        </>,
        <>
          <strong>CNPJ deve ser real (se digitado):</strong> o sistema valida o
          CNPJ e recusa CNPJs falsos. Se quiser deixar em branco, fica de boa.
        </>,
      ]}
    />
    <Callout variant=”atencao” title=”CNPJ inválido bloqueia o salvamento”>
      Se o CNPJ que você digitou for inválido (ex.:{“ “}
      <Term>11.111.111/1111-11</Term>), o sistema mostra a mensagem “CNPJ
      inválido. Verifique.” Você pode corrigir o número ou deixar o campo vazio.
    </Callout>

    <SectionTitle icon={AccountTree}>Fluxo de trabalho</SectionTitle>
    <SubHeading>A. Acessar a tela</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Clique em <strong>Clientes</strong> no menu lateral. A tela mostra a barra
      de pesquisa e a tabela com todos os clientes cadastrados.
    </Typography>

    <SubHeading>B. Cadastrar um novo cliente</SubHeading>
    <NumberedList
      items={[
        <>Clique em <strong>Adicionar Cliente</strong> (ou no <Term>+</Term> no canto superior direito).</>,
        <>Preencha o formulário — <strong>Nome</strong> e <strong>CEP</strong> são obrigatórios.</>,
        <>Se digitar o CNPJ, garanta que seja válido.</>,
        <>Clique em <strong>Adicionar</strong>. O cliente aparece na lista na hora.</>,
      ]}
    />

    <SubHeading>C. Pesquisar</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Digite no campo de busca por <strong>nome</strong>, <strong>e-mail</strong>,{" "}
      <strong>telefone</strong> ou <strong>endereço</strong>. A tabela filtra
      conforme você digita; apague o texto para ver todos novamente.
    </Typography>

    <SubHeading>D. Editar e E. Excluir</SubHeading>
    <Bullets
      items={[
        <>
          <strong>Editar:</strong> clique no ícone de lápis da linha, altere e
          clique em <strong>Salvar</strong>.
        </>,
        <>
          <strong>Excluir:</strong> clique na lixeira vermelha e confirme na tela
          que exibe o nome do cliente (evita exclusões acidentais).
        </>,
      ]}
    />
    <Callout variant="cuidado" title="Excluir um cliente">
      Os orçamentos já emitidos para ele continuam salvos com o snapshot dos
      dados. Porém você não conseguirá criar <strong>novos</strong> orçamentos
      para um cliente excluído.
    </Callout>

    <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    <Faq
      items={[
        {
          q: "Digitei o CEP mas o endereço não preencheu sozinho. Por quê?",
          a: (
            <>
              Nesta versão a busca automática de CEP está desligada. Digite o CEP e
              escreva manualmente Cidade, Estado e Endereço.
            </>
          ),
        },
        {
          q: 'Por que o botão "Adicionar" está desativado?',
          a: (
            <>
              Verifique se <strong>Nome</strong> e <strong>CEP</strong> estão
              preenchidos e se o CNPJ (caso digitado) é válido. Erros aparecem em
              vermelho no topo do formulário.
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[{ label: "Ir para Clientes", to: "/Clientes", icon: Apartment }]}
      onOverview={goToOverview}
    />
  </>
);

// ---------------------------------------------------------------------------
// 02 — Representantes.
// ---------------------------------------------------------------------------
export const ChapterRepresentantes: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      O representante é a pessoa física vinculada a um cliente — o contato direto
      (comprador, engenheiro, diretor) que solicita a proposta e cujo nome sai no
      orçamento.
    </Lead>

    <SectionTitle icon={FactCheck}>Campos do formulário</SectionTitle>
    <FieldTable
      fields={[
        { name: "Cliente", req: "rec", input: "Empresa (cliente) já cadastrada no sistema.", format: "Digite o nome e escolha da lista de sugestões." },
        { name: "Nome", req: "req", input: "Nome completo do representante.", format: "Texto livre. Até 80 caracteres." },
        { name: "Cargo", req: "opt", input: "Função na empresa (ex.: comprador, diretor).", format: "Texto livre. Até 50 caracteres." },
        { name: "Email", req: "opt", input: "E-mail corporativo ou pessoal.", format: "Até 80 caracteres. Ex.: nomes@empresa.com" },
        { name: "Telefone", req: "opt", input: "Telefone fixo comercial.", format: <>O sistema formata automaticamente para <Term>(00) 0000-0000</Term>.</> },
        { name: "Celular", req: "opt", input: "Celular ou WhatsApp.", format: <>O sistema formata automaticamente para <Term>(00) 00000-0000</Term>.</> },
        { name: "CEP", req: "opt", input: "CEP do local de trabalho.", format: <>O sistema formata automaticamente para <Term>00000-000</Term>.</> },
        { name: "Endereço", req: "opt", input: "Logradouro e número do escritório.", format: "Texto livre. Até 80 caracteres." },
        { name: "Estado", req: "opt", input: "Sigla do estado (UF).", format: "Duas letras (ex.: RS, SP)." },
        { name: "Cidade", req: "opt", input: "Cidade onde trabalha.", format: "Texto livre. Até 50 caracteres." },
      ]}
    />

    <SectionTitle icon={AccountTree} color=”info”>
      O sistema preenche o endereço automaticamente
    </SectionTitle>
    <FlowSteps
      nodes={[
        { label: “Você escolhe o cliente”, detail: “Digite o nome e clique na sugestão.” },
        { label: “Endereço preenchido na hora”, detail: “O CEP, Endereço, Cidade e Estado do cliente entram sozinhos.” },
        { label: “Pode mudar se precisar”, detail: “Se o representante trabalha em outra filial, você pode editar.” },
      ]}
    />
    <Bullets
      items={[
        <>
          Quando você seleciona uma empresa, seus endereço e CEP aparecem
          automaticamente — assim você não precisa digitar duas vezes.
        </>,
        <>
          Se o representante trabalha em outro local (filial, home-office), você
          pode editar esses campos — isso <strong>não muda</strong> o cadastro da
          empresa original.
        </>,
      ]}
    />

    <SectionTitle icon={AccountTree}>Fluxo de trabalho</SectionTitle>
    <SubHeading>A. Cadastrar</SubHeading>
    <NumberedList
      items={[
        <>Clique em <strong>Adicionar Representante</strong> (ou no <Term>+</Term>).</>,
        <>No campo <strong>Cliente</strong>, digite o nome da empresa e clique na sugestão.</>,
        <>Veja o endereço ser preenchido sozinho.</>,
        <>Digite o <strong>Nome</strong> (obrigatório) e os demais dados.</>,
        <>Clique em <strong>Adicionar</strong>.</>,
      ]}
    />
    <SubHeading>B. Pesquisar, editar e excluir</SubHeading>
    <Bullets
      items={[
        <><strong>Pesquisar:</strong> digite o nome do representante na barra de busca.</>,
        <><strong>Editar:</strong> lápis na linha, altere (inclusive o cliente associado) e salve.</>,
        <><strong>Excluir:</strong> lixeira vermelha e confirme o aviso.</>,
      ]}
    />

    <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    <Faq
      items={[
        {
          q: "Posso cadastrar um representante sem cliente associado?",
          a: (
            <>
              O sistema permite (só o <strong>Nome</strong> é obrigatório), mas{" "}
              <strong>recomendamos associar a um cliente</strong>: ao criar um
              orçamento, o cliente é determinado pela associação do representante.
              Sem cliente, o fluxo de orçamentos não funciona corretamente para
              ele.
            </>
          ),
        },
        {
          q: "Posso associar mais de um cliente ao mesmo representante?",
          a: (
            <>
              Não. Cada representante pertence a uma única empresa. Se a pessoa
              representa duas, cadastre-a duas vezes — uma para cada cliente.
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[{ label: "Ir para Representantes", to: "/Representantes", icon: Groups }]}
      onOverview={goToOverview}
    />
  </>
);

// ---------------------------------------------------------------------------
// 03 — Produtos.
// ---------------------------------------------------------------------------
export const ChapterProdutos: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      O catálogo é o inventário virtual do sistema. Cadastre cada produto uma vez
      e, na hora do orçamento, basta selecioná-lo: nome, preço e descrição padrão
      são carregados automaticamente.
    </Lead>

    <SectionTitle icon={FactCheck}>Campos do formulário</SectionTitle>
    <FieldTable
      fields={[
        { name: "NCM", req: "req", input: "Código fiscal do produto (8 números).", format: "Ex.: 84811000. Usado para buscar descrição padrão." },
        { name: "ICMS (%)", req: "opt", input: "Percentual de imposto sobre o produto.", format: <>Ex.: 12 ou 18 (o símbolo <Term>%</Term> é adicionado automaticamente).</> },
        { name: "Nome do produto", req: "req", input: "Nome comercial do produto.", format: "Texto livre. Ex.: Válvula reguladora 3/4." },
        { name: "Qtd. em estoque", req: "locked", input: "Campo desabilitado, sempre zero.", format: "O sistema é para fazer orçamentos, não gerenciar estoque." },
        { name: "Valor unitário", req: "req", input: "Preço de uma unidade do produto.", format: <>Digite apenas números (ex.: 1500 para R$ 15,00). O símbolo <Term>R$</Term> aparece sozinho.</> },
        { name: "Descrição", req: "opt", input: "Detalhes do produto para o orçamento.", format: "Geralmente vem pronto do NCM, mas você pode editar." },
      ]}
    />

    <SectionTitle icon={AccountTree} color="info">
      O sistema busca a descrição automaticamente
    </SectionTitle>
    <FlowSteps
      nodes={[
        { label: "Você digita o código NCM", detail: "8 números (ex.: 84811000)." },
        { label: "Sistema procura na tabela", detail: "Busca o código na tabela de classificação." },
        { label: "Descrição preenchida", detail: "Se acha, preenche automaticamente. Se não, deixa em branco." },
      ]}
    />
    <Bullets
      items={[
        <>
          Quando você digita um NCM válido (ex.: <Term>84811000</Term>), a{" "}
          <strong>Descrição</strong> preenchida automaticamente — você não precisa
          digitar à mão.
        </>,
        <>
          Você pode editar a descrição livremente para adicionar detalhes
          comerciais ou especificar modelos.
        </>,
      ]}
    />

    <SectionTitle icon={Payments} color="success">
      Como o preço é digitado
    </SectionTitle>
    <Callout variant="nota" title="Contas sempre certas, sem erros de arredondamento">
      Você digita só números inteiros e os centavos ficam implícitos. Para um
      produto de <Term>R$ 12,50</Term>, você digita <Term>1250</Term>. Na tela e
      nos orçamentos ele aparece normalmente como <Term>R$ 12,50</Term> — sem você
      precisar digitar o separador decimal.
    </Callout>

    <SectionTitle icon={AccountTree}>Fluxo de trabalho</SectionTitle>
    <SubHeading>A. Cadastrar</SubHeading>
    <NumberedList
      items={[
        <>Clique em <strong>Adicionar Produto</strong> (ou no <Term>+</Term>).</>,
        <>Digite o <strong>NCM</strong> — a descrição é buscada automaticamente.</>,
        <>Preencha o <strong>ICMS</strong> (se aplicável) e o <strong>Nome</strong>.</>,
        <>Informe o <strong>Valor unitário</strong> e complemente a descrição se quiser.</>,
        <>Clique em <strong>Adicionar</strong>.</>,
      ]}
    />
    <Callout variant="dica" title="Dica de digitação">
      Pense em centavos: <Term>R$ 15,00</Term> = digite{" "}
      <Term>1500</Term>. <Term>R$ 1.500,50</Term> = digite{" "}
      <Term>150050</Term>. Sem ponto, sem vírgula — só números.
    </Callout>
    <SubHeading>B. Pesquisar, editar e excluir</SubHeading>
    <Bullets
      items={[
        <><strong>Pesquisar:</strong> por <strong>nome</strong> ou <strong>NCM</strong> (com ou sem formatação).</>,
        <><strong>Editar:</strong> lápis na linha, altere (valor, NCM…) e salve.</>,
        <><strong>Excluir:</strong> lixeira vermelha e confirme.</>,
      ]}
    />

    <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    <Faq
      items={[
        {
          q: "Mudar o preço no catálogo altera orçamentos antigos?",
          a: (
            <>
              Não. Orçamentos guardam um snapshot dos dados de quando foram
              emitidos. O novo preço só vale para orçamentos criados a partir da
              mudança.
            </>
          ),
        },
        {
          q: "O NCM não preencheu a descrição. E agora?",
          a: (
            <>
              O código pode não constar na tabela embarcada. Sem problema: clique
              no campo <strong>Descrição</strong> e escreva manualmente — o
              cadastro funciona normalmente.
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[{ label: "Ir para Produtos", to: "/Produtos", icon: Widgets }]}
      onOverview={goToOverview}
    />
  </>
);

// ---------------------------------------------------------------------------
// 04 — Orçamentos.
// ---------------------------------------------------------------------------
export const ChapterOrcamentos: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      O orçamento é a proposta comercial enviada ao cliente. Ele reúne quem vende
      (representante e seu cliente), o que se vende (produtos, quantidades e
      preços) e as condições do negócio — e gera uma folha timbrada em PDF.
    </Lead>

    <SectionTitle icon={AccountTree}>Formulário em 3 passos</SectionTitle>
    <FlowSteps
      nodes={[
        { label: "Representante", detail: "Escolha o contato; o cliente entra sozinho." },
        { label: "Produtos", detail: "Adicione itens, quantidades e preços." },
        { label: "Condições", detail: "Prazos, frete, validade e referência." },
        { label: "Salvar", detail: "Habilita quando os 3 passos estão válidos." },
      ]}
    />

    <SubHeading>Aba 1 · Representante</SubHeading>
    <Bullets
      items={[
        <>Busque e selecione o <strong>representante</strong> na lista de sugestões.</>,
        <>O sistema identifica o <strong>cliente</strong> vinculado e preenche os dados dele automaticamente.</>,
        <>Se o representante não tiver empresa associada, o orçamento fica sem cliente.</>,
      ]}
    />

    <SubHeading>Aba 2 · Produtos</SubHeading>
    <Bullets
      items={[
        <>Pesquise por <strong>nome</strong> ou <strong>NCM</strong> e clique no produto para adicioná-lo.</>,
        <>Defina a quantidade com os botões <Term>-</Term> / <Term>+</Term> ou digitando.</>,
        <>Remova um item pela lixeira vermelha na linha dele.</>,
      ]}
    />
    <Callout variant="dica" title="Preço customizado (só neste orçamento)">
      No valor unitário do item, apague o preço padrão e digite o preço combinado.
      A alteração vale só para este orçamento — o catálogo permanece intacto.
    </Callout>

    <SubHeading>Aba 3 · Condições comerciais</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 1 }}>
      Cinco campos são obrigatórios para a validação:
    </Typography>
    <NumberedList
      items={[
        <><strong>Prazo para entrega:</strong> ex.: “A combinar” ou “20 dias úteis”.</>,
        <><strong>Validade da proposta:</strong> ex.: “15 dias úteis” ou “Até 30/08/2026”.</>,
        <><strong>Garantia:</strong> vem pré-preenchida e pode ser editada livremente.</>,
        <><strong>Condição de entrega:</strong> <Term>CIF</Term> (frete do emitente) ou <Term>FOB</Term> (frete do destinatário).</>,
        <><strong>Referência:</strong> título da proposta. Ex.: “Proposta de fornecimento de válvulas”.</>,
      ]}
    />
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Opcionais: <strong>Condição de pagamento</strong> (ex.: “28 dias” ou “À
      vista”) e <strong>Imposto</strong> (pré-preenchido com o texto padrão).
    </Typography>

    <SectionTitle icon={FactCheck} color="success">
      Painel de resumo (vê tudo de uma vez)
    </SectionTitle>
    <Bullets
      items={[
        <><strong>Valor total:</strong> atualiza na hora conforme você adiciona produtos.</>,
        <><strong>Status das abas:</strong> um visto verde mostra quando está tudo pronto, e um alerta mostra o que falta.</>,
        <><strong>Botão Salvar:</strong> fica ativo (clicável) só quando as 3 abas estão preenchidas e validadas.</>,
      ]}
    />

    <SectionTitle icon={FactCheck}>Pré-visualizar e exportar o PDF</SectionTitle>
    <NumberedList
      items={[
        <>Com o formulário válido, clique em <strong>Visualizar PDF</strong>.</>,
        <>Confira a folha oficial: logomarca, contato, tabela de produtos e condições.</>,
        <>Encontrou um erro? Feche o popup, ajuste e confira de novo.</>,
        <>Estando tudo certo, clique em <strong>Salvar Orçamento</strong>.</>,
      ]}
    />

    <SectionTitle icon={AccountTree}>Fluxo de trabalho</SectionTitle>
    <SubHeading>Gerar o PDF de um orçamento salvo</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Na lista de orçamentos, localize pelo ID ou pelo cliente e clique no ícone
      de <strong>PDF</strong> (azul). O popup permite <strong>imprimir</strong> ou{" "}
      <strong>baixar</strong> pelo próprio navegador.
    </Typography>
    <SubHeading>Editar um orçamento existente</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Clique no lápis da linha, faça as alterações e clique em{" "}
      <strong>Salvar Alterações</strong>. O documento é regravado com a nova data
      de modificação.
    </Typography>

    <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    <Faq
      items={[
        {
          q: 'Por que o botão “Salvar” está cinza?',
          a: (
            <>
              O orçamento ainda não está completo. Olhe o <strong>Painel de
              Resumo</strong> (lado direito) — ele vai mostrar qual aba falta
              preencher. Geralmente é porque nenhum produto foi adicionado, ou
              faltam informações na aba “Condições”.
            </>
          ),
        },
        {
          q: "Posso cadastrar um produto ou cliente pela tela de orçamento?",
          a: (
            <>
              Não por aqui. Cadastre na tela correspondente (Clientes,
              Representantes ou Produtos) e volte — graças ao cache, o novo
              registro já aparece na busca na hora.
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[
        { label: "Novo orçamento", to: "/Orcamentos/Adicionar", icon: PostAdd },
        { label: "Ver orçamentos", to: "/Orcamentos", icon: NoteAdd },
      ]}
      onOverview={goToOverview}
    />
  </>
);

// ---------------------------------------------------------------------------
// 05 — Dashboard.
// ---------------------------------------------------------------------------
export const ChapterDashboard: React.FC<HelpContentProps> = ({ goToOverview }) => (
  <>
    <Lead>
      A Dashboard é a tela inicial. Em vez de abrir lista por lista, ela resume o
      desempenho comercial em cartões indicadores, gráficos e atalhos.
    </Lead>

    <SectionTitle icon={Insights}>Cartões indicadores (KPIs)</SectionTitle>
    <Bullets
      items={[
        <><strong>Valor Total:</strong> soma em dinheiro de todos os orçamentos, com a quantidade acumulada.</>,
        <><strong>Orçamentos:</strong> total de propostas gravadas; o apoio mostra quantas neste mês (ex.: “+3 este mês”).</>,
        <><strong>Produtos:</strong> total no catálogo.</>,
        <><strong>Clientes:</strong> total de empresas, com o nome do último cliente cadastrado.</>,
      ]}
    />

    <SectionTitle icon={Insights} color="info">
      Gráficos de desempenho
    </SectionTitle>
    <SubHeading>Evolução do valor orçado (linha)</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Mostra o valor total orçado mês a mês nos últimos 12 meses — útil para ver
      os meses mais fortes e a tendência de faturamento.
    </Typography>
    <SubHeading>Produtos mais orçados (barras)</SubHeading>
    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
      Ranking dos produtos que mais aparecem nos orçamentos, por quantidade — mostra
      os campeões de venda para focar seus esforços.
    </Typography>

    <SectionTitle icon={History}>Orçamentos recentes e atalhos</SectionTitle>
    <Bullets
      items={[
        <><strong>Orçamentos recentes:</strong> tabela com ID, cliente, data e valor; clique no ícone para o PDF.</>,
        <><strong>Cartões de acesso rápido:</strong> Clientes, Representantes e Produtos, cada um com a contagem e um atalho direto.</>,
      ]}
    />

    <SectionTitle icon={FactCheck}>Perguntas frequentes</SectionTitle>
    <Faq
      items={[
        {
          q: "Criei um orçamento mas o Valor Total no painel não mudou. E agora?",
          a: (
            <>
              Isso é raro, mas pode acontecer se a tela não atualizou. Tente
              sair da Dashboard e voltar, ou pressione <Term>F5</Term> para
              recarregar a página. Os totais vão aparecer certos.
            </>
          ),
        },
        {
          q: 'O cartão de Orçamentos mostra "+0 este mês". É normal?',
          a: (
            <>
              Sim, significa que nenhum orçamento novo foi criado no mês atual. A
              contagem zera automaticamente no primeiro dia do mês. Continua
              mostrando o total geral (todos os orçamentos de todos os tempos) no
              número maior.
            </>
          ),
        },
      ]}
    />

    <QuickActions
      actions={[
        { label: "Ir para o Dashboard", to: "/Home", icon: HomeIcon },
        { label: "Novo orçamento", to: "/Orcamentos/Adicionar", icon: PostAdd },
      ]}
      onOverview={goToOverview}
    />
  </>
);

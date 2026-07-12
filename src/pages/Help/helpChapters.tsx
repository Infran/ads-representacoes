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
      <SectionTitle icon={Cloud} color="info">
        Onde as informações ficam salvas
      </SectionTitle>
    </Box>
    <Callout variant="nota" title="Nada se perde ao fechar o navegador">
      Tudo o que você digita é enviado em tempo real e salvo com segurança nos
      servidores do <strong>Google Cloud</strong>. Fechar o
      navegador ou trocar de computador não apaga nada. Seus dados estão sempre seguros.
    </Callout>
    <Bullets
      items={[
        <>
          <strong>Armazenamento em nuvem:</strong> os registros ficam guardados online (nos servidores do Google) e você acessa de qualquer lugar com login, mesmo de outro computador.
        </>,
        <>
          <strong>Identificação sequencial:</strong> cada item recebe um número
          único e sequencial (1, 2, 3…), gerado automaticamente, sem repetições
          nem “buracos” na numeração.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={Speed} color="success">
        O sistema de cache (por que é tão rápido?)
      </SectionTitle>
    </Box>
    <Bullets
      items={[
        <>
          <strong>Cópia local:</strong> ao entrar, o sistema baixa uma cópia
          temporária das listas de clientes, produtos e representantes e guarda no
          seu navegador.
        </>,
        <>
          <strong>Velocidade instantânea:</strong> pesquisas e listagens são lidas
          desse cache local, aparecendo em menos de um segundo.
        </>,
        <>
          <strong>Atualização inteligente:</strong> ao adicionar, editar ou
          excluir, a mudança vai para a nuvem e o cache local é atualizado
          automaticamente.
        </>,
        <>
          <strong>Renovação (TTL):</strong> o cache é renovado a cada{" "}
          <Term>5 minutos</Term> para você não ver dados desatualizados se um
          colega cadastrar algo ao mesmo tempo.
        </>,
      ]}
    />

    <Box sx={{ mt: 4 }}>
      <SectionTitle icon={History} color="warning">
        A regra de ouro dos orçamentos
      </SectionTitle>
    </Box>
    <Callout variant="importante" title="Um orçamento nunca muda automaticamente">
      Ao criar um orçamento, o sistema tira uma “foto” (snapshot) dos dados do
      cliente, do representante e dos produtos exatamente como estavam{" "}
      <strong>naquele momento</strong>.
    </Callout>
    <Bullets
      items={[
        <>
          Se hoje você emite um orçamento com o produto X a <Term>R$ 100,00</Term>{" "}
          e amanhã altera o catálogo para <Term>R$ 120,00</Term>, o orçamento de
          ontem <strong>continua com R$ 100,00</strong>. Isso protege
          juridicamente as propostas já enviadas.
        </>,
        <>
          Se o cliente pedir para você atualizar um orçamento antigo com novos preços, abra-o em modo de edição, faça as mudanças e salve novamente. Esse será um novo orçamento.
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
              Sim, o sistema precisa de conexão para abrir, fazer login e salvar registros. Você pode pesquisar e navegar nos dados já carregados mesmo com internet lenta, mas para gravar algo novo é necessário conexão ativa.
            </>
          ),
        },
        {
          q: "E se dois colegas editarem o mesmo cliente ao mesmo tempo?",
          a: (
            <>
              Vale a alteração que foi salva por último (quem clicou em Salvar mais recentemente). A tela do outro colega se atualiza automaticamente em até 5 minutos, ou no próximo clique de "Atualizar".
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
        { name: "CNPJ", req: "opt", input: "CNPJ da empresa (14 números).", format: <>Formata sozinho para <Term>00.000.000/0000-00</Term>.</> },
        { name: "Telefone", req: "opt", input: "Telefone fixo ou celular (DDD + número).", format: <>Formata para <Term>(00) 0000-0000</Term> ou <Term>(00) 00000-0000</Term>.</> },
        { name: "Email", req: "opt", input: "E-mail de contato da empresa.", format: "Valida o formato. Máximo de 50 caracteres." },
        { name: "CEP", req: "req", input: "CEP (8 números).", format: <>Formata para <Term>00000-000</Term>.</> },
        { name: "Endereço", req: "opt", input: "Logradouro, número e complemento.", format: "Texto livre. Ex.: Av. Brasil, 1500 - Sala 4." },
        { name: "Cidade", req: "opt", input: "Cidade do cliente.", format: "Texto livre. Ex.: Caxias do Sul." },
        { name: "Estado", req: "opt", input: "Unidade Federativa (UF).", format: "Texto. Ex.: RS, SP, SC." },
      ]}
    />

    <SectionTitle icon={FactCheck} color="warning">
      Regras de validação
    </SectionTitle>
    <NumberedList
      items={[
        <>
          <strong>Campos obrigatórios:</strong> o botão <strong>Adicionar</strong>{" "}
          fica desabilitado (cinza) enquanto <strong>Nome</strong> e{" "}
          <strong>CEP</strong> não estiverem preenchidos.
        </>,
        <>
          <strong>Validação do CNPJ:</strong> se você digitar um CNPJ, o sistema
          confere os dígitos verificadores de verdade.
        </>,
      ]}
    />
    <Callout variant="atencao" title="CNPJ inválido bloqueia o salvamento">
      Um CNPJ falso (como <Term>11.111.111/1111-11</Term>) exibe o aviso
      “CNPJ inválido. Verifique os dígitos.” e impede salvar até você corrigir ou
      deixar o campo em branco.
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
        { name: "Cliente", req: "rec", input: "Empresa (cliente) já cadastrada.", format: "Autocompletar: mostra sugestões conforme você digita." },
        { name: "Nome", req: "req", input: "Nome completo do representante.", format: "Texto livre. Limite de 80 caracteres." },
        { name: "Cargo", req: "opt", input: "Função na empresa (comprador, diretor…).", format: "Texto livre. Limite de 50 caracteres." },
        { name: "Email", req: "opt", input: "E-mail corporativo ou pessoal.", format: "Valida o formato. Limite de 80 caracteres." },
        { name: "Telefone", req: "opt", input: "Telefone fixo comercial.", format: <>Formata para <Term>(00) 0000-0000</Term>.</> },
        { name: "Celular", req: "opt", input: "Celular / WhatsApp.", format: <>Formata para <Term>(00) 00000-0000</Term>.</> },
        { name: "CEP", req: "opt", input: "CEP de trabalho.", format: <>Formata para <Term>00000-000</Term>.</> },
        { name: "Endereço", req: "opt", input: "Logradouro e número do escritório.", format: "Texto livre. Limite de 80 caracteres." },
        { name: "Estado", req: "opt", input: "Sigla do estado.", format: "Texto. Limite de 2 caracteres (ex.: RS)." },
        { name: "Cidade", req: "opt", input: "Cidade.", format: "Texto livre. Limite de 50 caracteres." },
      ]}
    />

    <SectionTitle icon={AccountTree} color="info">
      Preenchimento automático de endereço
    </SectionTitle>
    <FlowSteps
      nodes={[
        { label: "Selecione o cliente", detail: "No campo “Selecione um cliente”." },
        { label: "Endereço herdado", detail: "CEP, Endereço, Cidade e Estado do cliente entram sozinhos." },
        { label: "Ajuste se precisar", detail: "Filial ou home-office? Reescreva sem afetar o cliente." },
      ]}
    />
    <Bullets
      items={[
        <>
          Ao escolher a empresa, os campos <strong>CEP, Endereço, Cidade e
          Estado</strong> são preenchidos na hora com os dados do cliente.
        </>,
        <>
          Se o representante trabalha em outro local, apague e digite o endereço
          específico — isso <strong>não altera</strong> o cadastro do cliente.
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
        { name: "NCM", req: "req", input: "Código NCM do produto (8 números).", format: "Classificação fiscal. Usado para buscar a descrição padrão." },
        { name: "ICMS (%)", req: "opt", input: "Alíquota de ICMS aplicável.", format: <>Exibe o símbolo <Term>%</Term>. Ex.: 12, 18.</> },
        { name: "Nome do produto", req: "req", input: "Nome comercial do produto.", format: "Texto livre. Ex.: Válvula reguladora de pressão 3/4." },
        { name: "Qtd. em estoque", req: "locked", input: "Campo desabilitado, fixo em 0.", format: "O sistema gerencia propostas, não estoque físico." },
        { name: "Valor (unitário)", req: "req", input: "Valor de tabela do produto.", format: <>Formata em Real. Você digita só os números e o <Term>R$</Term> entra sozinho.</> },
        { name: "Descrição", req: "opt", input: "Texto detalhado do produto.", format: "Costuma vir do NCM, mas aceita edição livre." },
      ]}
    />

    <SectionTitle icon={AccountTree} color="info">
      Busca automática de NCM
    </SectionTitle>
    <FlowSteps
      nodes={[
        { label: "Digite o NCM", detail: "8 dígitos; o sistema remove traços e pontos." },
        { label: "Consulta interna", detail: "Pesquisa na tabela NCM oficial embarcada." },
        { label: "Preenche a descrição", detail: "Se achar, completa; se não, deixa em branco." },
      ]}
    />
    <Bullets
      items={[
        <>
          Ao digitar um NCM válido (ex.: <Term>84811000</Term>), a{" "}
          <strong>Descrição</strong> recebe automaticamente o texto técnico
          oficial — sem digitar tudo à mão.
        </>,
        <>
          O campo continua aberto: complemente a descrição com detalhes
          comerciais quando quiser.
        </>,
      ]}
    />

    <SectionTitle icon={Payments} color="success">
      Valores em centavos
    </SectionTitle>
    <Callout variant="nota" title="Contas sempre exatas">
      Para nunca arredondar errado, o valor é gravado em centavos: um produto de{" "}
      <Term>R$ 12,50</Term> é salvo como o inteiro <Term>1250</Term>. Na tela ele
      aparece normalmente como R$ 12,50 — a conversão é invisível.
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
    <Callout variant="dica" title="Digitando o valor">
      Digite apenas os números, com os centavos ao final. Para{" "}
      <Term>R$ 1.500,00</Term>, digite <Term>150000</Term>.
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
      Painel de resumo (validação ao vivo)
    </SectionTitle>
    <Bullets
      items={[
        <><strong>Valor total acumulado:</strong> atualiza em tempo real conforme você monta a proposta.</>,
        <><strong>Status das seções:</strong> visto verde quando completa, alerta quando falta algo obrigatório.</>,
        <><strong>Salvar Orçamento</strong> só habilita quando as três abas estão válidas.</>,
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
          q: 'O botão "Salvar" está desativado. O que falta?',
          a: (
            <>
              Olhe o <strong>Painel de Resumo</strong> à direita: ele lista as abas
              incompletas. Em geral falta um dos 5 campos obrigatórios de
              “Condições Comerciais” ou nenhum produto foi adicionado.
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
          q: "Fiz um orçamento e o Valor Total não mudou. O que fazer?",
          a: (
            <>
              A Dashboard usa o cache do navegador. Normalmente atualiza na hora;
              se não, troque de tela e volte, ou recarregue a página (<Term>F5</Term>)
              para recalcular as métricas.
            </>
          ),
        },
        {
          q: 'O que significa "Nenhum este mês" no cartão de Orçamentos?',
          a: (
            <>
              Apenas que nenhum orçamento novo foi emitido no mês atual. O contador
              zera no início de cada mês automaticamente.
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

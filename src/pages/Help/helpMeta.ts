import {
  SvgIconComponent,
  Apartment,
  Groups,
  Widgets,
  NoteAdd,
  AutoStories,
  SpaceDashboard,
  MenuBook,
} from "@mui/icons-material";

/**
 * Metadados dos capítulos da Central de Ajuda (dados puros, sem JSX). Fonte
 * única para o sumário (Início), a trilha lateral e o registro em
 * `helpRegistry.ts`. Mantém `helpChapters.tsx` livre de exports não-componente.
 */
export interface HelpChapterMeta {
  slug: string;
  number: string;
  title: string;
  subtitle: string;
  keywords: string;
  Icon: SvgIconComponent;
}

export const OVERVIEW_META: HelpChapterMeta = {
  slug: "inicio",
  number: "",
  title: "Início",
  subtitle: "Visão geral e atalhos",
  keywords: "início visão geral sumário atalhos bem-vindo central de ajuda",
  Icon: MenuBook,
};

export const CHAPTER_META: HelpChapterMeta[] = [
  {
    slug: "introducao",
    number: "00",
    title: "Introdução e conceitos gerais",
    subtitle: "Como o sistema salva seus dados, o cache e a regra dos orçamentos.",
    keywords: "nuvem firestore cache ttl snapshot histórico id sequencial",
    Icon: AutoStories,
  },
  {
    slug: "clientes",
    number: "01",
    title: "Cadastro de clientes",
    subtitle: "Cadastrar empresas, aplicar máscaras e validar o CNPJ.",
    keywords: "cliente empresa cnpj cep razão social máscara validação",
    Icon: Apartment,
  },
  {
    slug: "representantes",
    number: "02",
    title: "Cadastro de representantes",
    subtitle: "Associar contatos aos clientes e herdar o endereço.",
    keywords: "representante contato vendedor comprador cargo celular endereço",
    Icon: Groups,
  },
  {
    slug: "produtos",
    number: "03",
    title: "Catálogo de produtos",
    subtitle: "Preenchimento por NCM, ICMS e valores em centavos.",
    keywords: "produto ncm icms preço centavos catálogo descrição",
    Icon: Widgets,
  },
  {
    slug: "orcamentos",
    number: "04",
    title: "Geração de orçamentos",
    subtitle: "Montar a proposta em 3 passos e exportar o PDF.",
    keywords: "orçamento proposta pdf acordeão preço customizado cif fob validação",
    Icon: NoteAdd,
  },
  {
    slug: "dashboard",
    number: "05",
    title: "Dashboard e visão geral",
    subtitle: "Ler os KPIs, os gráficos e os atalhos da tela inicial.",
    keywords: "dashboard kpi gráfico valor total faturado recentes atalhos",
    Icon: SpaceDashboard,
  },
];

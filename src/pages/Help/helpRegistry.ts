import React from "react";
import { HelpChapterMeta, CHAPTER_META, OVERVIEW_META } from "./helpMeta";
import {
  HelpContentProps,
  Overview,
  ChapterIntroducao,
  ChapterClientes,
  ChapterRepresentantes,
  ChapterProdutos,
  ChapterOrcamentos,
  ChapterDashboard,
} from "./helpChapters";

/**
 * Registro da Central de Ajuda: junta os metadados (helpMeta) com o componente
 * de conteúdo de cada capítulo (helpChapters). Consumido por `Help.tsx` para
 * dirigir a trilha lateral e o painel de conteúdo.
 */
export interface HelpChapter extends HelpChapterMeta {
  Component: React.FC<HelpContentProps>;
}

const COMPONENTS: Record<string, React.FC<HelpContentProps>> = {
  inicio: Overview,
  introducao: ChapterIntroducao,
  clientes: ChapterClientes,
  representantes: ChapterRepresentantes,
  produtos: ChapterProdutos,
  orcamentos: ChapterOrcamentos,
  dashboard: ChapterDashboard,
};

export const helpChapters: HelpChapter[] = [OVERVIEW_META, ...CHAPTER_META].map(
  (m) => ({ ...m, Component: COMPONENTS[m.slug] })
);

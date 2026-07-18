// Utilitários compartilhados do padrão "cockpit" (barra de filtros horizontal +
// tabela selecionável + painel de detalhes colapsável). Usado por Produtos,
// Clientes e Representantes — mantém as três telas idênticas por construção.
import { tokens } from "../../theme/tokens";

export type Density = "compact" | "comfortable";

export interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

export interface DetailField {
  label: string;
  value: string;
  /** Usa numerais tabulares (bom para CNPJ, valores, códigos). */
  mono?: boolean;
}

/** Contagem por id (ex.: orçamentos por cliente/representante). */
export type CountById = Map<string, number>;

// Tom determinístico por id (paleta decorativa em tokens.ts), para que um
// registro mantenha a mesma cor de avatar entre renders. Texto branco por cima.
export const tintForId = (id: string | number): string => {
  const s = String(id);
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) | 0;
  return tokens.avatarTints[Math.abs(hash) % tokens.avatarTints.length];
};

/** Iniciais a partir de um nome (até 2 palavras significativas). */
export const initials = (text?: string): string => {
  if (!text) return "?";
  const significant = text.split(" ").filter((w) => w.length > 2);
  const source = significant.length ? significant : text.split(" ").filter(Boolean);
  const result = source
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return result || "?";
};

/** Valores distintos e ordenados (pt-BR, numérico), ignorando vazios. */
export const distinctSorted = (
  values: (string | undefined | null)[]
): string[] =>
  [...new Set(values.filter((v): v is string => !!v))].sort((a, b) =>
    a.localeCompare(b, "pt-BR", { numeric: true })
  );

/** Baixa um CSV (separador `;`, BOM p/ acentos abrirem certo no Excel BR). */
export const downloadCsv = (
  filename: string,
  headers: string[],
  rows: string[][]
) => {
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv =
    "﻿" +
    [headers, ...rows].map((r) => r.map(escape).join(";")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

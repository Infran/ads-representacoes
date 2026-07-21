// Tabela das 27 UFs (sigla + nome) e os leitores/escritores de estado.
//
// Deliberadamente **sem** a lista de cidades: quase todo consumidor (cockpits,
// painéis de orçamento, PDF) só precisa mapear sigla ↔ nome. As ~5.500 cidades
// vivem em `cidades.ts`, carregadas sob demanda — só o formulário de endereço
// paga por elas.

/** Uma UF do Brasil. */
export interface Uf {
  sigla: string;
  nome: string;
}

/** As 27 UFs, ordenadas por nome — pronta para os dropdowns. */
export const ufs: Uf[] = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

/** Remove acentos/caixa e espaços das pontas para comparação tolerante. */
export const stripAccents = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim()
    .toLowerCase();

/**
 * Resolve uma UF a partir da sigla ("SP") ou do nome ("São Paulo"),
 * acento/caixa-insensível. Usado para casar valores legados no dropdown.
 */
export const normalizeUf = (input?: string): Uf | undefined => {
  if (!input) return undefined;
  const key = stripAccents(input);
  return ufs.find(
    (uf) => stripAccents(uf.sigla) === key || stripAccents(uf.nome) === key
  );
};

/**
 * Entidade que carrega estado — `state` guarda o **nome** ("São Paulo") e `uf`
 * a **sigla** ("SP"). Registros legados gravavam a sigla em `state` e não tinham
 * `uf`; os leitores abaixo toleram as duas formas.
 */
export interface ComEstado {
  state?: string;
  uf?: string;
}

/**
 * Patch canônico de estado: deriva nome e sigla da **mesma** fonte, num único
 * ponto de escrita, de modo que os dois campos não tenham como divergir.
 * Todo caminho que grava estado (dropdown, busca por CEP) deve passar por aqui.
 *
 * Retorna `null` quando o input é **não vazio e irreconhecível** — "não sei
 * interpretar" nunca pode virar "apaguei". O chamador pula o patch e preserva
 * o que já estava gravado. `{state:"", uf:""}` fica reservado para a limpeza
 * genuína (input vazio/ausente), ex.: o usuário limpar o dropdown.
 */
export const estadoPatch = (
  input?: string
): { state: string; uf: string } | null => {
  if (!input?.trim()) return { state: "", uf: "" };
  const uf = normalizeUf(input);
  return uf ? { state: uf.nome, uf: uf.sigla } : null;
};

/** Resolve a UF de uma entidade, tolerando o formato legado (`state` = sigla). */
export const resolverUf = (entity?: ComEstado): Uf | undefined =>
  normalizeUf(entity?.uf || entity?.state);

/**
 * Sigla da entidade ("SP"). Use para filtrar/exportar.
 *
 * Quando nada resolve, devolve o valor **cru** (`uf`, senão `state`) em vez de
 * "": um registro com grafia inesperada precisa continuar aparecendo como opção
 * de filtro. Devolver "" o tornaria invisível a qualquer filtro de UF, embora
 * ele siga exibindo um estado no card — dado escondido, não apenas sem rótulo.
 */
export const getUf = (entity?: ComEstado): string =>
  resolverUf(entity)?.sigla || entity?.uf || entity?.state || "";

/**
 * Nome da entidade ("São Paulo"). Use para exibir.
 *
 * Simétrico a `getUf`: cai no valor cru em vez de "", para que um rótulo de
 * menu/chip nunca fique em branco e sem forma de saber o que está filtrado.
 */
export const getEstadoNome = (entity?: ComEstado): string =>
  resolverUf(entity)?.nome || entity?.state || entity?.uf || "";

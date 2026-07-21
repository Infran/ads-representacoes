// Lista de cidades por UF, carregada **sob demanda**.
//
// `estados-cidade.json` tem 143 KB (~5.500 cidades). Só o formulário de
// endereço precisa dele, então o import é dinâmico: o chunk sai do bundle
// principal e é buscado na primeira vez que alguém abre um Autocomplete de
// cidade. O mapeamento sigla ↔ nome (que todo mundo usa) fica em `ufs.ts`.
import { normalizeUf, stripAccents } from "./ufs";

interface EstadoJson {
  sigla: string;
  cidades: string[];
}

// Promise memoizada: o JSON é parseado e indexado uma única vez por sessão.
let mapaPromise: Promise<Map<string, string[]>> | null = null;

const carregarMapa = (): Promise<Map<string, string[]>> => {
  if (!mapaPromise) {
    mapaPromise = import("../estados-cidade.json").then((modulo) => {
      const { estados } = modulo.default as { estados: EstadoJson[] };
      return new Map(estados.map((e) => [e.sigla.toUpperCase(), e.cidades]));
    });
  }
  return mapaPromise;
};

/**
 * Cidades de uma UF (na ordem do JSON), ou [] se a sigla for inválida/ausente.
 *
 * Devolve sempre uma **cópia**: o array indexado é compartilhado por toda a
 * sessão, e um chamador que fizesse `.sort()`/`.push()` no resultado corromperia
 * a lista para todas as aberturas de formulário seguintes.
 */
export const carregarCidades = async (sigla?: string): Promise<string[]> => {
  const uf = normalizeUf(sigla);
  if (!uf) return [];
  const mapa = await carregarMapa();
  return [...(mapa.get(uf.sigla) ?? [])];
};

/**
 * Nome canônico de uma cidade dentro da UF (bate acento/caixa), ou undefined
 * se não existir na lista — permite normalizar o retorno da BrasilAPI.
 */
export const normalizeCidade = async (
  sigla: string | undefined,
  cidade?: string
): Promise<string | undefined> => {
  if (!cidade) return undefined;
  const key = stripAccents(cidade);
  const cidades = await carregarCidades(sigla);
  return cidades.find((nome) => stripAccents(nome) === key);
};

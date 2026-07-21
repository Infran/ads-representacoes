import { logger } from "./logger";
import { normalizeCidade } from "./cidades";
import { normalizeUf } from "./ufs";

/** Resposta relevante da BrasilAPI (`GET /api/cep/v1/{cep}`) — `state` é a sigla da UF. */
interface BrasilApiCepResponse {
  cep: string;
  state: string;
  city: string;
  neighborhood?: string;
  street?: string;
  service?: string;
}

/** Endereço já normalizado contra o nosso estados-cidade.json. */
export interface EnderecoCep {
  /** Sigla da UF normalizada (ex.: "SP"). */
  uf: string;
  /** Nome canônico da cidade (da nossa lista quando houver correspondência). */
  cidade: string;
  /** Logradouro — pode vir vazio para CEPs únicos de cidade. */
  endereco: string;
}

/** Uma conexão pendurada deixaria o spinner para sempre; corta em 5s. */
const TIMEOUT_MS = 5000;

/**
 * Busca endereço por CEP na BrasilAPI e normaliza UF/cidade contra o nosso
 * estados-cidade.json.
 *
 * Retorna `null` para CEP incompleto (≠ 8 dígitos) ou **inexistente** (404).
 * Qualquer outra falha — rede, timeout, 5xx da BrasilAPI, 429 de rate limit —
 * **propaga** o erro. A distinção importa: colapsar 5xx em `null` faria a UI
 * culpar a digitação do usuário por um CEP perfeitamente válido.
 */
export const buscarCep = async (cep: string): Promise<EnderecoCep | null> => {
  const digits = (cep || "").replace(/\D/g, "");
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(
      `https://brasilapi.com.br/api/cep/v1/${digits}`,
      { signal: AbortSignal.timeout(TIMEOUT_MS) }
    );
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`BrasilAPI respondeu ${response.status}`);
    }

    const data: BrasilApiCepResponse = await response.json();
    const uf = normalizeUf(data.state)?.sigla ?? data.state;
    const cidade = (await normalizeCidade(uf, data.city)) ?? data.city;
    return { uf, cidade, endereco: data.street ?? "" };
  } catch (error) {
    logger.error("Erro ao buscar CEP na BrasilAPI:", error);
    throw error;
  }
};

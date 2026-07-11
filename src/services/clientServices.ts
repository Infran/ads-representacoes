import { IClient } from "../interfaces/iclient";
import { createCrudService } from "./createCrudService";
import { isValidCnpj } from "../utils/validators";

/**
 * Valida os dados do cliente antes de salvar.
 * @throws Error se os dados forem inválidos
 */
const validateClient = (client: Partial<IClient>): void => {
  if (!client.name?.trim()) {
    throw new Error("Nome do cliente é obrigatório");
  }
  if (!client.cep?.trim()) {
    throw new Error("CEP do cliente é obrigatório");
  }
  // CNPJ é opcional; quando informado, precisa ser estruturalmente válido (SEG S2.2).
  if (client.cnpj && client.cnpj.replace(/\D/g, "").length > 0) {
    if (!isValidCnpj(client.cnpj)) {
      throw new Error("CNPJ inválido. Verifique os dígitos.");
    }
  }
};

const clientCrud = createCrudService<IClient>({
  collectionName: "clients",
  metaIdDoc: "lastClientId",
  validate: validateClient,
});

// ============================================================================
// API PÚBLICA (preservada)
// ============================================================================

/**
 * Busca todos os clientes do Firestore.
 * NOTA: Prefira usar useData().clients do DataContext.
 */
export const getClients = clientCrud.getAll;

/** Busca um cliente pelo ID. */
export const getClientById = clientCrud.getById;

/** Gera o próximo ID de cliente de forma atômica. */
export const getNextClientId = clientCrud.getNextId;

/**
 * Adiciona um novo cliente (criação atômica: contador + doc na mesma transação).
 * @throws Error se a validação falhar
 */
export const addClient = clientCrud.add;

/**
 * Atualiza um cliente existente (recebe o objeto completo com `id`).
 * @throws Error se o ID não for fornecido ou a validação falhar
 */
export const updateClient = (client: IClient): Promise<void> =>
  clientCrud.update(client.id?.toString(), client);

/** Exclui um cliente pelo ID. */
export const deleteClient = clientCrud.remove;

/**
 * @deprecated Use useData().searchClientsLocal() para busca com cache local.
 * Esta função ainda faz chamadas ao Firestore - evite usá-la.
 */
export const searchClients = async (searchTerm: string): Promise<IClient[]> => {
  console.warn(
    "[DEPRECATED] searchClients está deprecated. Use searchClientsLocal do DataContext para evitar reads no Firestore."
  );

  const clients = await getClients();

  if (!searchTerm?.trim()) {
    return clients;
  }

  const term = searchTerm.toLowerCase();
  return clients.filter(
    (client) =>
      client.name?.toLowerCase().includes(term) ||
      client.email?.toLowerCase().includes(term) ||
      client.phone?.toLowerCase().includes(term) ||
      client.cnpj?.toLowerCase().includes(term)
  );
};

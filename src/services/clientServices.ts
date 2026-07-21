import { IClient } from "../interfaces/iclient";
import { createCrudService } from "./createCrudService";
import { withAudit } from "./withAudit";
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

const clientCrud = withAudit(
  createCrudService<IClient>({
    collectionName: "clients",
    metaIdDoc: "lastClientId",
    validate: validateClient,
  }),
  { entity: "clients", label: (c) => c?.name ?? "Cliente sem nome" }
);

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

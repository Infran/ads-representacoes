import { IRepresentative } from "../interfaces/irepresentative";
import { createCrudService } from "./createCrudService";

/**
 * Valida os dados do representante antes de salvar.
 * @throws Error se os dados forem inválidos
 */
const validateRepresentative = (
  representative: Partial<IRepresentative>
): void => {
  if (!representative.name?.trim()) {
    throw new Error("Nome do representante é obrigatório");
  }
};

const representativeCrud = createCrudService<IRepresentative>({
  collectionName: "representatives",
  metaIdDoc: "lastRepresentativeId",
  validate: validateRepresentative,
});

// ============================================================================
// API PÚBLICA (preservada)
// ============================================================================

/**
 * Busca todos os representantes do Firestore.
 * NOTA: Prefira usar useData().representatives do DataContext.
 */
export const getRepresentatives = representativeCrud.getAll;

/** Busca um representante pelo ID. */
export const getRepresentativeById = representativeCrud.getById;

/** Gera o próximo ID de representante de forma atômica. */
export const getNextRepresentativeId = representativeCrud.getNextId;

/**
 * Adiciona um novo representante (criação atômica: contador + doc na mesma transação).
 * @throws Error se a validação falhar
 */
export const addRepresentative = representativeCrud.add;

/**
 * Atualiza um representante existente (recebe o objeto completo com `id`).
 * @throws Error se o ID não for fornecido ou a validação falhar
 */
export const updateRepresentative = (
  representative: IRepresentative
): Promise<void> =>
  representativeCrud.update(representative.id?.toString(), representative);

/** Exclui um representante pelo ID. */
export const deleteRepresentative = representativeCrud.remove;

import { IProduct } from "../interfaces/iproduct";
import { createCrudService } from "./createCrudService";
import { withAudit } from "./withAudit";

/**
 * Valida os dados do produto antes de salvar.
 * @throws Error se os dados forem inválidos
 */
const validateProduct = (product: Partial<IProduct>): void => {
  if (!product.name?.trim()) {
    throw new Error("Nome do produto é obrigatório");
  }
  if (!product.ncm?.trim()) {
    throw new Error("NCM do produto é obrigatório");
  }
  if (product.unitValue === undefined || product.unitValue === null) {
    throw new Error("Valor unitário do produto é obrigatório");
  }
};

const productCrud = withAudit(
  createCrudService<IProduct>({
    collectionName: "products",
    metaIdDoc: "lastProductId",
    validate: validateProduct,
  }),
  { entity: "products", label: (p) => p?.name ?? "Produto sem nome" }
);

// ============================================================================
// API PÚBLICA (preservada)
// ============================================================================

/**
 * Busca todos os produtos do Firestore.
 * NOTA: Prefira usar useData().products do DataContext.
 */
export const getProducts = productCrud.getAll;

/** Busca um produto pelo ID. */
export const getProductById = productCrud.getById;

/** Gera o próximo ID de produto de forma atômica. */
export const getNextProductId = productCrud.getNextId;

/**
 * Adiciona um novo produto (criação atômica: contador + doc na mesma transação).
 * @throws Error se a validação falhar
 */
export const addProduct = productCrud.add;

/**
 * Atualiza um produto existente (recebe o objeto completo com `id`).
 * @throws Error se o ID não for fornecido ou a validação falhar
 */
export const updateProduct = (product: IProduct): Promise<void> =>
  productCrud.update(product.id?.toString(), product);

/** Exclui um produto pelo ID. */
export const deleteProduct = productCrud.remove;

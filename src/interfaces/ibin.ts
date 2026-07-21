import { Timestamp } from "firebase/firestore";

/**
 * Entidades com lixeira. Os valores são EXATAMENTE os nomes das coleções no
 * Firestore — `binService` e `restoreService` dependem disso para montar os
 * caminhos sem precisar de um mapa paralelo.
 */
export type BinEntity = "clients" | "products" | "representatives" | "budgets";

export const BIN_ENTITIES: BinEntity[] = [
  "clients",
  "products",
  "representatives",
  "budgets",
];

/** Rótulos pt-BR no singular, para a UI da lixeira. */
export const BIN_ENTITY_LABELS: Record<BinEntity, string> = {
  clients: "Cliente",
  products: "Produto",
  representatives: "Representante",
  budgets: "Orçamento",
};

/**
 * Envelope de um documento excluído, guardado em `bin/{entity}/items/{id}`.
 *
 * O documento original vive intacto em `data` — mesma forma que tinha na coleção
 * de origem, com os `Timestamp` preservados nativamente. É por isso que a
 * lixeira é uma coleção de verdade e não um snapshot JSON dentro do log: nada
 * precisa ser serializado, reidratado nem truncado.
 */
export interface IBinItem {
  /** Auto-ID da entrada na lixeira (NÃO é o id do documento original). */
  id: string;
  entity: BinEntity;
  /** ID visual do documento original — preservado na restauração. */
  originalId: string;
  /** Resumo pt-BR para listar sem precisar abrir `data`. */
  label: string;
  deletedAt: Timestamp;
  /**
   * `deletedAt` + 180 dias, espelhando `IAuditLog.expiresAt`.
   *
   * Sem isto a lixeira só cresceria: dados cadastrais de clientes (CNPJ,
   * endereço, telefone) de um registro "excluído" ficariam no Firestore para
   * sempre, o que é uma decisão de retenção que precisa ser explícita. O campo
   * existir desde o dia 1 é o que permite ligar uma TTL policy no Console
   * depois sem backfill — mesmo raciocínio já aplicado ao log de auditoria.
   */
  expiresAt?: Timestamp;
  deletedByUid: string;
  deletedByEmail: string;
  /** O documento original, verbatim. */
  data: Record<string, unknown>;
}

/** Retenção da lixeira, em dias. Igual à do log de auditoria. */
export const BIN_RETENTION_DAYS = 180;

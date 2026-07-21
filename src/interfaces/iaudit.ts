import { Timestamp } from "firebase/firestore";
import { BinEntity } from "./ibin";

export type AuditAction = "create" | "update" | "delete" | "restore" | "error";
export type AuditStatus = "success" | "failure";

/** `app` cobre o que não é uma entidade de negócio (erros de runtime). */
export type AuditEntity = BinEntity | "app";

/** Rótulos pt-BR das ações, para a UI. */
export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  create: "Criação",
  update: "Edição",
  delete: "Exclusão",
  restore: "Restauração",
  error: "Erro",
};

/**
 * Uma entrada do registro de auditoria (`auditLogs`), append-only.
 *
 * Exclusões NÃO carregam snapshot: o documento inteiro foi movido para a
 * lixeira e a entrada só referencia `binItemId`. Edições carregam apenas os
 * campos que MUDARAM — é o que a UI de diff precisa e mantém a entrada pequena.
 */
export interface IAuditLog {
  id: string;
  at: Timestamp;
  /** `at` + 180 dias. Permite ligar uma TTL policy depois, sem backfill. */
  expiresAt: Timestamp;

  actorUid: string;
  /** Denormalizado de propósito: o painel nunca precisa consultar o Auth. */
  actorEmail: string;

  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  /** Resumo legível: "Cliente ACME Ltda". */
  label: string;
  status: AuditStatus;

  // --- Edições ---
  changedFields?: string[];
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  /** Payload descartado por tamanho; só `changedFields` está disponível. */
  truncated?: boolean;

  // --- Exclusão / restauração ---
  binItemId?: string;
  restoredFrom?: string;
  /**
   * A exclusão aconteceu SEM ir para a lixeira, porque as regras negaram a
   * escrita em `bin/**` (tipicamente: hosting publicado antes das regras).
   * O registro é irrecuperável — por isso a entrada fica com `status: "failure"`.
   */
  binUnavailable?: boolean;

  // --- Falhas e erros de runtime ---
  errorCode?: string;
  /** Mensagem já traduzida por `getErrorMessage` — bate com o que o usuário viu. */
  errorMessage?: string;
  errorStack?: string;
  componentStack?: string;
  route?: string;
  /** Assinatura para agrupar/deduplicar erros repetidos. */
  fingerprint?: string;
  occurrences?: number;
}

/** O que quem chama fornece; o serviço preenche `at`, `expiresAt` e o ator. */
export type AuditLogInput = Omit<
  IAuditLog,
  "id" | "at" | "expiresAt" | "actorUid" | "actorEmail"
>;

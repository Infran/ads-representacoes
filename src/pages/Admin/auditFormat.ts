/**
 * Formatação e filtragem do registro de auditoria para a UI.
 *
 * Segue o padrão de `clientCockpit.ts`: interface de filtros + constante vazia
 * em escopo de módulo (necessária para o `resetFilters` do `useCockpit`
 * memoizar) + função de aplicação.
 */
import { Timestamp } from "firebase/firestore";
import { IAuditLog, AuditAction, AUDIT_ACTION_LABELS } from "../../interfaces/iaudit";
import { BIN_ENTITY_LABELS, BinEntity } from "../../interfaces/ibin";

export interface AuditFilters {
  action: string;
  entity: string;
  status: string;
  actor: string;
}

export const EMPTY_AUDIT_FILTERS: AuditFilters = {
  action: "",
  entity: "",
  status: "",
  actor: "",
};

/** Rótulo pt-BR de uma entidade (`app` não está em BIN_ENTITY_LABELS). */
export const entityLabel = (entity: string): string =>
  entity === "app"
    ? "Aplicativo"
    : (BIN_ENTITY_LABELS[entity as BinEntity] ?? entity);

export const actionLabel = (action: string): string =>
  AUDIT_ACTION_LABELS[action as AuditAction] ?? action;

/** `dd/MM/yyyy HH:mm` — o formato que o resto do app usa. */
export const formatDateTime = (value?: Timestamp): string => {
  if (!value?.toDate) return "—";
  try {
    return value.toDate().toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
};

/** "há 3 minutos", "há 2 horas" — para a Visão geral. */
export const formatRelative = (value?: Timestamp): string => {
  if (!value?.toDate) return "—";
  const diffMs = Date.now() - value.toDate().getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) return "agora mesmo";
  if (minutes < 60) return `há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "há 1 dia" : `há ${days} dias`;
};

/**
 * Filtro + busca livre, tudo no cliente sobre as páginas já carregadas.
 * É o que permite manter `firestore.indexes.json` sem índice composto nenhum.
 */
export const applyAuditFilters = (
  logs: IAuditLog[],
  filters: AuditFilters,
  search: string
): IAuditLog[] => {
  const term = search.trim().toLowerCase();

  return logs.filter((log) => {
    if (filters.action && log.action !== filters.action) return false;
    if (filters.entity && log.entity !== filters.entity) return false;
    if (filters.status && log.status !== filters.status) return false;
    if (filters.actor && log.actorEmail !== filters.actor) return false;

    if (!term) return true;
    return [log.label, log.actorEmail, log.entityId, log.errorMessage]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(term));
  });
};

/** Agrupa erros por assinatura, somando ocorrências. Para a tela de Erros. */
export interface ErrorGroup {
  fingerprint: string;
  label: string;
  errorMessage: string;
  errorCode?: string;
  route?: string;
  occurrences: number;
  lastAt?: Timestamp;
  actors: string[];
  sample: IAuditLog;
}

export const groupErrors = (logs: IAuditLog[]): ErrorGroup[] => {
  const groups = new Map<string, ErrorGroup>();

  for (const log of logs) {
    if (log.action !== "error") continue;
    const key = log.fingerprint ?? log.id;
    const existing = groups.get(key);

    if (existing) {
      existing.occurrences += log.occurrences ?? 1;
      if (!existing.actors.includes(log.actorEmail) && log.actorEmail) {
        existing.actors.push(log.actorEmail);
      }
      continue;
    }

    groups.set(key, {
      fingerprint: key,
      label: log.label,
      errorMessage: log.errorMessage ?? "Erro sem mensagem",
      errorCode: log.errorCode,
      route: log.route,
      occurrences: log.occurrences ?? 1,
      // Os logs chegam ordenados por `at` desc, então o primeiro é o mais recente.
      lastAt: log.at,
      actors: log.actorEmail ? [log.actorEmail] : [],
      sample: log,
    });
  }

  return [...groups.values()].sort((a, b) => b.occurrences - a.occurrences);
};

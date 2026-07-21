// Biblioteca atômica de UI tokenizada (UI U2.1).
// Ponto único de import dos átomos; tudo consome o tema (src/theme) — sem hex.
export { default as Button } from "./Button";
export { default as Field } from "./Field";
export { default as Modal } from "./Modal";
export { default as FormSection } from "./FormSection";
export { default as Card } from "./Card";
export { default as StatCard } from "./StatCard";
export { default as EmptyState } from "./EmptyState";
export { default as ErrorState } from "./ErrorState";
export { default as DataTable } from "./DataTable";
export type { DataTableProps } from "./DataTable";
export { ListSkeleton, CardGridSkeleton, TableSkeleton } from "./Skeletons";
export {
  confirmDialog,
  notifySuccess,
  notifyWarning,
  notifyError,
} from "./Feedback";
export { FeedbackProvider } from "./FeedbackProvider";


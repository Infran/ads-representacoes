import Swal, { SweetAlertResult } from "sweetalert2";
import { tokens } from "../theme/tokens";

/**
 * Wrapper de diálogos de confirmação/feedback tokenizado (UI U2.1).
 * Centraliza as cores de botão do Swal nos tokens de marca (elimina os
 * `#3085d6`/`#d33` hardcoded espalhados). Consumido por U3.4 / EST F4.1.
 */

interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: "warning" | "error" | "success" | "info" | "question";
}

/** Diálogo de confirmação (sim/não) com cores de marca. Resolve `true` se confirmado. */
export const confirmDialog = async ({
  title,
  text,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  icon = "warning",
}: ConfirmOptions): Promise<boolean> => {
  const result: SweetAlertResult = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    reverseButtons: true,
    confirmButtonColor: tokens.color.brand.main,
    cancelButtonColor: tokens.color.error,
  });
  return result.isConfirmed;
};

/** Toast/alerta simples de sucesso. */
export const notifySuccess = (title: string, text?: string) =>
  Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonColor: tokens.color.brand.main,
  });

/** Alerta de erro tokenizado. */
export const notifyError = (title: string, text?: string) =>
  Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonColor: tokens.color.brand.main,
  });

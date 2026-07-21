export type FeedbackType = "success" | "warning" | "error" | "info" | "question";

export interface ConfirmOptions {
  title: string;
  text?: string;
  confirmText?: string;
  cancelText?: string;
  icon?: FeedbackType;
  danger?: boolean;
}

type OpenConfirmFn = (options: ConfirmOptions, resolve: (val: boolean) => void) => void;
type AddToastFn = (
  title: string,
  text: string | undefined,
  type: "success" | "warning" | "error" | "info"
) => void;

type ReportErrorFn = (title: string, error: unknown) => void;

let openConfirmFn: OpenConfirmFn | null = null;
let addToastFn: AddToastFn | null = null;
let reportErrorFn: ReportErrorFn | null = null;

export const registerFeedbackMethods = (
  openConfirm: OpenConfirmFn | null,
  addToast: AddToastFn | null
) => {
  openConfirmFn = openConfirm;
  addToastFn = addToast;
};

/**
 * Liga o coletor de erros ao `notifyError`.
 *
 * É um registry (e não um import direto de `errorReporter`) porque o reporter
 * precisa de `getErrorMessage` DAQUI — importar nos dois sentidos seria um ciclo.
 * Com o registry, a dependência corre só numa direção: errorReporter → Feedback.
 *
 * Efeito prático: instrumenta de graça os 12 pontos de escrita da UI, que já
 * chamam `notifyError` ao falhar, sem tocar em nenhum deles.
 */
export const registerErrorReporter = (fn: ReportErrorFn | null) => {
  reportErrorFn = fn;
};

/** Forma que interessa de um erro capturado (Firebase, Firestore ou Error nativo). */
interface ErroConhecido {
  code?: string;
  cause?: { code?: string };
  message?: string;
}

// Mapeamento e parser inteligente de erros do Firebase/Firestore e Javascript.
// Exportado para o `errorReporter` gravar no log a MESMA mensagem que o usuário
// viu na tela — assim o relato ("deu erro de permissão") bate verbatim com a
// entrada de auditoria, sem tradutor duplicado.
export const getErrorMessage = (error: unknown): string => {
  if (!error) return "Ocorreu um erro inesperado. Por favor, tente novamente.";

  if (typeof error === "string") return error;

  const erro = error as ErroConhecido;

  // Extração de códigos do Firebase (incluindo causa aninhada)
  const code = erro.code || erro.cause?.code;
  if (code) {
    switch (code) {
      case "permission-denied":
      case "firestore/permission-denied":
        return "Você não tem permissão para realizar esta operação no banco de dados (permissão negada).";
      case "unavailable":
      case "firestore/unavailable":
        return "O serviço está temporariamente indisponível. Verifique sua conexão com a internet.";
      case "not-found":
        return "O registro solicitado não foi localizado ou já foi excluído do sistema.";
      case "already-exists":
        return "Este registro já existe no sistema e não pode ser duplicado.";
      case "auth/network-request-failed":
        return "Erro de rede. Não foi possível comunicar com o servidor de autenticação.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
        return "Credenciais inválidas. Verifique os dados inseridos (e-mail e senha) e tente novamente.";
      case "auth/user-not-found":
        return "Nenhum usuário correspondente a este e-mail foi localizado.";
      case "auth/email-already-in-use":
        return "Este endereço de e-mail já está associado a outra conta de usuário.";
      default:
        break;
    }
  }

  // Erros comuns baseados em mensagens conhecidas
  const message = erro.message || "";
  if (message) {
    if (message.includes("network") || message.includes("offline")) {
      return "Sem conexão com a internet. Verifique sua rede e tente novamente.";
    }
    return message;
  }

  return "Ocorreu um erro inesperado. Por favor, tente novamente.";
};

/** Diálogo de confirmação (sim/não) tokenizado com UI customizada. Resolve `true` se confirmado. */
export const confirmDialog = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    if (openConfirmFn) {
      openConfirmFn(options, resolve);
    } else {
      console.warn("FeedbackProvider não registrado para confirmDialog.");
      resolve(false);
    }
  });
};

/** Toast simples de sucesso. */
export const notifySuccess = (title: string, text?: string): Promise<void> => {
  if (addToastFn) {
    addToastFn(title, text, "success");
  } else {
    console.warn("FeedbackProvider não registrado para notifySuccess.");
  }
  return Promise.resolve();
};

/** Alerta de aviso com tradutor de erros para a descrição. */
export const notifyWarning = (
  title: string,
  textOrError?: unknown
): Promise<void> => {
  if (addToastFn) {
    const text =
      typeof textOrError === "string" ? textOrError : getErrorMessage(textOrError);
    addToastFn(title, text, "warning");
  } else {
    console.warn("FeedbackProvider não registrado para notifyWarning.");
  }
  return Promise.resolve();
};

/** Alerta de erro com tradutor de erros para a descrição. */
export const notifyError = (
  title: string,
  textOrError?: unknown
): Promise<void> => {
  if (addToastFn) {
    const text =
      typeof textOrError === "string" ? textOrError : getErrorMessage(textOrError);
    addToastFn(title, text, "error");
  } else {
    console.warn("FeedbackProvider não registrado para notifyError.");
  }

  // O toast é o caminho crítico; o registro é acessório e nunca pode
  // atrapalhá-lo. Por isso o report vem depois e vai dentro de um try.
  if (reportErrorFn && textOrError !== undefined) {
    try {
      reportErrorFn(title, textOrError);
    } catch {
      // Silêncio proposital: falar aqui reentraria no próprio notifyError.
    }
  }
  return Promise.resolve();
};

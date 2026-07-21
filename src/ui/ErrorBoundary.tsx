import React from "react";
import ErrorState from "./ErrorState";
import { captureError } from "../utils/errorReporter";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Texto de contexto no fallback (ex.: "Não foi possível abrir esta página."). */
  message?: string;
  /** Rótulo do botão de recuperação. */
  retryLabel?: string;
  /** Ação de recuperação. Sem isto, o botão recarrega a página. */
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * ErrorBoundary — o único class component do repo, porque `componentDidCatch`
 * não tem equivalente em hook.
 *
 * Até aqui o app não tinha nenhum: qualquer throw durante o render apagava a
 * árvore inteira para uma tela branca, sem registro. Agora o erro vira uma
 * entrada de auditoria e uma tela com saída.
 *
 * São usados dois: um externo no `Root` (rede de segurança final) e um interno
 * no `DefaultLayout`, chaveado pela rota — esse é o que importa, porque mantém
 * a sidebar viva e permite navegar até o painel de administração para ver o que
 * aconteceu.
 */
class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    captureError({
      source: "render",
      error,
      componentStack: info.componentStack ?? undefined,
    });
  }

  handleRetry = () => {
    if (this.props.onRetry) {
      this.setState({ hasError: false });
      this.props.onRetry();
      return;
    }
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <ErrorState
        title="Algo deu errado"
        message={
          this.props.message ??
          "A tela encontrou um erro inesperado. O problema foi registrado e você pode tentar novamente."
        }
        retryLabel={this.props.retryLabel ?? "Tentar novamente"}
        onRetry={this.handleRetry}
      />
    );
  }
}

export default ErrorBoundary;

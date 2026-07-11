import React from "react";
import { Box, Typography } from "@mui/material";
import { ErrorOutline } from "@mui/icons-material";
import Button from "./Button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  /** Rótulo do botão de nova tentativa. */
  retryLabel?: string;
  onRetry?: () => void;
}

/**
 * Estado de erro tokenizado (UI U2.1 / U2.3): ícone + mensagem + retry opcional.
 * Para substituir os `console.error` silenciosos das telas por feedback visível.
 */
const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Algo deu errado",
  message = "Não foi possível carregar os dados. Tente novamente.",
  retryLabel = "Tentar novamente",
  onRetry,
}) => (
  <Box sx={{ textAlign: "center", py: 8, px: 2, color: "text.secondary" }}>
    <ErrorOutline sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
    <Typography variant="h6" color="text.primary" gutterBottom>
      {title}
    </Typography>
    <Typography variant="body2" sx={{ mb: onRetry ? 3 : 0 }}>
      {message}
    </Typography>
    {onRetry && (
      <Button variant="outlined" color="error" onClick={onRetry}>
        {retryLabel}
      </Button>
    )}
  </Box>
);

export default ErrorState;

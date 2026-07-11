import React from "react";
import { Box, Modal as MuiModal, Typography } from "@mui/material";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Corpo do modal */
  children: React.ReactNode;
  /** Rodapé (botões de ação) */
  actions?: React.ReactNode;
  /** Mensagem de erro exibida abaixo do título */
  error?: string | null;
  /** Largura do painel (px). Padrão 600. Responsivo: limita a 90vw. */
  width?: number;
}

/**
 * Casca de modal tokenizada (UI U2.1) — header + body + footer.
 * Substitui os `modalStyle`/`FormControlStyled` locais dos 6 modais CRUD
 * (absorve a tokenização do antigo EST F4.7). Sem hex: cores vêm do tema.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  children,
  actions,
  error,
  width = 600,
}) => (
  <MuiModal open={open} onClose={onClose}>
    <Box
      sx={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: { xs: "90vw", sm: width },
        maxWidth: "90vw",
        maxHeight: "90vh",
        overflowY: "auto",
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius: 3,
        boxShadow: 24,
        border: "1px solid",
        borderColor: "divider",
        p: 4,
      }}
    >
      <Typography
        variant="h6"
        component="h2"
        gutterBottom
        sx={{
          borderBottom: "2px solid",
          borderColor: "primary.main",
          color: "primary.main",
          fontWeight: "bold",
          pb: 1,
          mb: 2,
        }}
      >
        {title}
      </Typography>

      {error && (
        <Typography
          color="error"
          variant="body2"
          sx={{ mb: 2, fontWeight: "bold" }}
        >
          {error}
        </Typography>
      )}

      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {children}
      </Box>

      {actions && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            mt: 4,
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  </MuiModal>
);

export default Modal;

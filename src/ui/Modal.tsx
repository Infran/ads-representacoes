import React from "react";
import { Box, IconButton, Modal as MuiModal, Typography, alpha } from "@mui/material";
import { Close, ErrorOutline } from "@mui/icons-material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import { tokens } from "../theme/tokens";

type IconType = OverridableComponent<SvgIconTypeMap>;

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Ícone do tile no cabeçalho (mesmo padrão do PageHeader — reforça a entidade). */
  icon?: IconType;
  /** Linha de apoio abaixo do título (opcional). */
  subtitle?: string;
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
 * Cabeçalho/rodapé sticky dentro do painel rolável — formulários longos não
 * perdem os botões de ação fora da tela.
 */
const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  title,
  icon: Icon,
  subtitle,
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
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.paper",
        color: "text.primary",
        borderRadius: 3,
        boxShadow: tokens.elevation.e4,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      {/* Cabeçalho (sticky) */}
      <Box
        sx={{
          flexShrink: 0,
          display: "flex",
          alignItems: "flex-start",
          gap: 1.5,
          p: 3,
          pb: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        {Icon && (
          <Box
            aria-hidden
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 44,
              height: 44,
              borderRadius: 2,
              flexShrink: 0,
              color: "primary.main",
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            }}
          >
            <Icon sx={{ fontSize: 24 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
          <Typography
            variant="h6"
            component="h2"
            sx={{ fontWeight: 700, lineHeight: 1.3 }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          size="small"
          sx={{ color: "text.secondary", flexShrink: 0, mt: -0.5, mr: -1 }}
        >
          <Close fontSize="small" />
        </IconButton>
      </Box>

      {/* Corpo (rolável) */}
      <Box sx={{ flex: 1, overflowY: "auto", p: 3 }}>
        {error && (
          <Box
            role="alert"
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              mb: 2,
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: (t) => alpha(t.palette.error.main, 0.08),
              borderLeft: "3px solid",
              borderColor: "error.main",
            }}
          >
            <ErrorOutline sx={{ fontSize: 18, color: "error.main", mt: "1px" }} />
            <Typography variant="body2" sx={{ color: "error.dark", fontWeight: 500 }}>
              {error}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {children}
        </Box>
      </Box>

      {/* Rodapé (sticky) */}
      {actions && (
        <Box
          sx={{
            flexShrink: 0,
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            p: 2.5,
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          {actions}
        </Box>
      )}
    </Box>
  </MuiModal>
);

export default Modal;

/**
 * Estilos compartilhados dos modais de CRUD (EST F2.3 / D-01, parte 1).
 *
 * Antes, cada um dos 6 modais (Create/Edit de Client/Product/Representative)
 * redefinia `modalStyle`, `FormControlStyled`, `StyledButton` e `StyledTextField`
 * localmente (~300 linhas duplicadas). Agora existe UM ponto de edição.
 *
 * As cores ficam em constantes nomeadas — NÃO usam `theme.palette.*` ainda (a
 * tokenização via tema fica com UI U2.1, que substitui este módulo pelos átomos
 * de `src/ui`; ver EST F4.7 → UI U2.1).
 */
import { Button, FormControl, TextField, SxProps, Theme } from "@mui/material";
import { styled } from "@mui/system";

export const MODAL_PRIMARY = "#1976d2";
export const MODAL_PRIMARY_HOVER = "#1565c0";
export const MODAL_BORDER = "#e0e0e0";

export const modalStyle: SxProps<Theme> = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  overflowY: "auto",
  background: "linear-gradient(145deg, #f5f5f5, #ffffff)",
  border: `1px solid ${MODAL_BORDER}`,
};

export const FormControlStyled = styled(FormControl)({
  display: "flex",
  flexDirection: "column",
  gap: "16px",
});

export const StyledButton = styled(Button)({
  textTransform: "none",
  fontWeight: "bold",
  borderRadius: 4,
  padding: "12px 24px",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
});

export const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    "& fieldset": {
      borderColor: MODAL_BORDER,
    },
    "&:hover fieldset": {
      borderColor: MODAL_PRIMARY,
    },
    "&.Mui-focused fieldset": {
      borderColor: MODAL_PRIMARY,
      borderWidth: 2,
    },
  },
});

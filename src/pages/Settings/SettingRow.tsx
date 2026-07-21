import { FC, ReactNode } from "react";
import { Box, Typography } from "@mui/material";

interface SettingRowProps {
  label: string;
  description?: string;
  /** Controle à direita (Switch, ToggleButtonGroup, Select, botão...). */
  control: ReactNode;
  /** `htmlFor`/`id` para associar rótulo ao controle (acessibilidade). */
  htmlFor?: string;
}

/**
 * Linha de uma opção de configuração: rótulo + descrição à esquerda, controle à
 * direita. Empilha no mobile. Reutilizada por todas as seções da página.
 */
const SettingRow: FC<SettingRowProps> = ({
  label,
  description,
  control,
  htmlFor,
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: { xs: "flex-start", sm: "center" },
      justifyContent: "space-between",
      flexDirection: { xs: "column", sm: "row" },
      gap: 1.5,
      py: 1.5,
    }}
  >
    <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
      <Typography
        component={htmlFor ? "label" : "div"}
        htmlFor={htmlFor}
        variant="body1"
        sx={{ fontWeight: 600 }}
      >
        {label}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {description}
        </Typography>
      )}
    </Box>
    <Box sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "center" } }}>
      {control}
    </Box>
  </Box>
);

export default SettingRow;

import React from "react";
import { Box, SvgIconProps, Typography } from "@mui/material";
import Card from "./Card";

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<SvgIconProps>;
  /** Cor semântica do ícone/realce. Padrão "primary". */
  color?: "primary" | "success" | "warning" | "error" | "info";
  /** Card em destaque (fundo colorido, texto contrastante) — KPI hero. */
  highlight?: boolean;
  /** Texto auxiliar sob o valor (ex.: tendência). */
  helperText?: string;
}

/**
 * Cartão de indicador (KPI) tokenizado (UI U2.1) — usado pela dashboard (U3.1).
 * `highlight` produz o hero KPI (fundo de marca). Sem hex: cores do tema.
 */
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon: Icon,
  color = "primary",
  highlight = false,
  helperText,
}) => (
  <Card
    sx={{
      height: "100%",
      ...(highlight && {
        bgcolor: `${color}.main`,
        color: `${color}.contrastText`,
        border: "none",
      }),
    }}
  >
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Box>
        <Typography
          variant="body2"
          sx={{ opacity: highlight ? 0.85 : 1, mb: 0.5 }}
          color={highlight ? "inherit" : "text.secondary"}
        >
          {label}
        </Typography>
        <Typography variant="h4" fontWeight={700} lineHeight={1.1}>
          {value}
        </Typography>
        {helperText && (
          <Typography
            variant="caption"
            sx={{ opacity: highlight ? 0.85 : 1 }}
            color={highlight ? "inherit" : "text.secondary"}
          >
            {helperText}
          </Typography>
        )}
      </Box>
      {Icon && (
        <Box
          sx={{
            display: "flex",
            color: highlight ? "inherit" : `${color}.main`,
            opacity: highlight ? 0.9 : 1,
          }}
        >
          <Icon sx={{ fontSize: 40 }} />
        </Box>
      )}
    </Box>
  </Card>
);

export default StatCard;

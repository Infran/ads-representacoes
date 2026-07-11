import React from "react";
import { Paper, PaperProps } from "@mui/material";

interface CardProps extends PaperProps {
  /** Preenchimento interno (unidades do tema). Padrão 3. */
  padding?: number;
}

/**
 * Superfície de conteúdo tokenizada (UI U2.1): um `Paper` com raio/elevação do
 * tema. Base para painéis, KPIs e blocos de tela — sem hex local.
 */
const Card: React.FC<CardProps> = ({ padding = 3, sx, children, ...rest }) => (
  <Paper
    elevation={0}
    {...rest}
    sx={{
      p: padding,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      ...sx,
    }}
  >
    {children}
  </Paper>
);

export default Card;

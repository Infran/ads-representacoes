import React from "react";
import { Paper, Typography } from "@mui/material";

interface EntityInfoCardProps {
  /** Rótulo acima do card (ex.: "Cliente", "Representante") */
  caption: string;
  /** Título em destaque dentro do card (ex.: o nome) */
  title?: string;
  /** Linhas de informação do card */
  children?: React.ReactNode;
}

/**
 * Card reutilizável para exibir dados de uma entidade (Cliente/Representante):
 * um rótulo (caption) acima de um Paper com título em destaque + linhas de info.
 * Extraído de BudgetFormPage (EST F3.1) para eliminar a duplicação dos 2 cards.
 */
const EntityInfoCard: React.FC<EntityInfoCardProps> = ({
  caption,
  title,
  children,
}) => (
  <>
    <Typography
      variant="caption"
      color="text.secondary"
      sx={{ mb: 0.5, display: "block" }}
    >
      {caption}
    </Typography>
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 2,
        bgcolor: "background.paper",
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {title && (
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {title}
        </Typography>
      )}
      {children}
    </Paper>
  </>
);

export default EntityInfoCard;

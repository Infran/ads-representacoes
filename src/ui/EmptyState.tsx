import React from "react";
import { Box, SvgIconProps, Typography } from "@mui/material";
import { Inbox } from "@mui/icons-material";
import Button from "./Button";

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ComponentType<SvgIconProps>;
  /** Rótulo do botão de ação (ex.: "Criar primeiro registro"). */
  actionLabel?: string;
  onAction?: () => void;
}

/**
 * Estado vazio tokenizado (UI U2.1 / U2.3): ícone + título + descrição + CTA.
 * Substitui os `.empty-state` ad-hoc espalhados pelas telas.
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon: Icon = Inbox,
  actionLabel,
  onAction,
}) => (
  <Box
    sx={{
      textAlign: "center",
      py: 8,
      px: 2,
      color: "text.secondary",
    }}
  >
    <Icon sx={{ fontSize: 64, color: "text.disabled", mb: 2 }} />
    <Typography variant="h6" color="text.primary" gutterBottom>
      {title}
    </Typography>
    {description && (
      <Typography variant="body2" sx={{ mb: actionLabel ? 3 : 0 }}>
        {description}
      </Typography>
    )}
    {actionLabel && onAction && (
      <Button variant="contained" onClick={onAction}>
        {actionLabel}
      </Button>
    )}
  </Box>
);

export default EmptyState;

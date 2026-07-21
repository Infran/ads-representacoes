import React from "react";
import { Box, Typography } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";

type IconType = OverridableComponent<SvgIconTypeMap>;

interface FormSectionProps {
  icon?: IconType;
  children: React.ReactNode;
}

/**
 * Legenda de seção de formulário (UI U2.1) — micro-caption uppercase, mesmo
 * estilo já usado no CockpitDetailPanel/CockpitFilterBar. Substitui o padrão
 * de `Typography variant="subtitle1"` com dois-pontos duplicado nos Forms.
 */
const FormSection: React.FC<FormSectionProps> = ({ icon: Icon, children }) => (
  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 1, mb: -0.5 }}>
    {Icon && <Icon sx={{ fontSize: 14, color: "text.secondary", opacity: 0.85 }} />}
    <Typography
      sx={{
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        color: "text.secondary",
        opacity: 0.85,
      }}
    >
      {children}
    </Typography>
  </Box>
);

export default FormSection;

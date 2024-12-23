import React, { FC } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";

interface PageHeaderProps {
  title: string;
  description: string;
  icon: OverridableComponent<SvgIconTypeMap<{}, "svg">>;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, icon: Icon }) => {
  const theme = useTheme();

  return (
    <Paper
      elevation={2}
      sx={{
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        display: "flex",
        alignItems: "center",
        gap: theme.spacing(2),
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {/* Ícone compacto */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 60,
          height: 60,
          backgroundColor: theme.palette.primary.light,
          borderRadius: "50%",
          color: theme.palette.primary.contrastText,
        }}
      >
        <Icon sx={{ fontSize: 32 }} />
      </Box>

      {/* Título e descrição compactos */}
      <Box>
        <Typography
          variant="h6"
          component="h1"
          sx={{
            fontWeight: "bold",
            fontSize: "1rem",
            color: theme.palette.text.primary,
          }}
        >
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: theme.palette.text.secondary,
            fontSize: "0.875rem",
          }}
        >
          {description}
        </Typography>
      </Box>
    </Paper>
  );
};

export default PageHeader;

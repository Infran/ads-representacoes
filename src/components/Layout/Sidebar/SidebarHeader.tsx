import React from "react";
import { Box, Typography, IconButton, Collapse } from "@mui/material";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";

interface SidebarHeaderProps {
  open: boolean;
  onClose: () => void;
}

const SidebarHeader: React.FC<SidebarHeaderProps> = ({ open, onClose }) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: open ? "space-between" : "center",
        padding: theme.spacing(0, 1),
        minHeight: 64,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Logo/Brand */}
      <Collapse in={open} orientation="horizontal" timeout={200}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pl: 1 }}>
          {/* Logo da empresa */}
          <Box
            component="img"
            src="/logo_clean.png"
            alt="ADS Representações"
            sx={{
              height: 40,
              width: "auto",
              objectFit: "contain",
            }}
          />
          <Typography
            noWrap
            sx={{
              fontWeight: 400,
              fontSize: "0.75rem",
              color: "text.secondary",
              lineHeight: 1.2,
            }}
          >
            Representações
          </Typography>
        </Box>
      </Collapse>

      {/* Logo pequena quando sidebar fechada */}
      {!open && (
        <Box
          component="img"
          src="/logo_clean.png"
          alt="ADS"
          sx={{
            height: 28,
            width: "auto",
            objectFit: "contain",
          }}
        />
      )}

      {/* Botão de fechar/abrir */}
      <IconButton
        onClick={onClose}
        aria-label={open ? "Recolher menu lateral" : "Expandir menu lateral"}
        sx={{
          transition: "all 0.2s ease",
          ml: open ? 0 : -5,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        {theme.direction === "rtl" ? (
          open ? (
            <ChevronRight />
          ) : (
            <ChevronLeft />
          )
        ) : open ? (
          <ChevronLeft />
        ) : (
          <ChevronRight />
        )}
      </IconButton>
    </Box>
  );
};

export default SidebarHeader;

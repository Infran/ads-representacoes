import React from "react";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
  Box,
  keyframes,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowForward } from "@mui/icons-material";
import { useHelpOnboarding } from "../../../hooks/useHelpOnboarding";
import type { MenuItem } from "./sidebarConfig";

interface SidebarItemProps {
  item: MenuItem;
  open: boolean;
}

// Animação da seta pulsante apontando para Ajuda
const pulse = keyframes`
  0%, 100% { opacity: 1; transform: translateX(0); }
  50% { opacity: 0.6; transform: translateX(4px); }
`;

const SidebarItem: React.FC<SidebarItemProps> = ({ item, open }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { showArrow, showBadge } = useHelpOnboarding();
  const isHelpItem = item.id === 'help';

  // Verifica se a rota está ativa (exata ou início)
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(item.path + "/");

  const handleClick = () => {
    navigate(item.path);
  };

  const IconComponent = item.icon;

  const content = (
    <ListItem disablePadding sx={{ display: "block", position: "relative" }}>
      {isHelpItem && showArrow && (
        <Box
          sx={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            color: "error.main",
            fontSize: 24,
            animation: `${pulse} 1s ease-in-out infinite`,
            zIndex: 10,
          }}
        >
          <ArrowForward />
        </Box>
      )}
      <ListItemButton
        onClick={handleClick}
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
          mx: 1,
          my: 0.5,
          borderRadius: 2,
          backgroundColor: isActive ? "action.selected" : "transparent",
          borderLeft: `3px solid ${
            isActive ? theme.palette.primary.main : "transparent"
          }`,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "action.hover",
            transform: "translateX(2px)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 2.5 : "auto",
            justifyContent: "center",
            color: isActive ? "primary.main" : "text.secondary",
            transition: "color 0.2s ease",
          }}
        >
          {isHelpItem && showBadge ? (
            <Badge badgeContent="●" color="error" max={99}>
              <IconComponent />
            </Badge>
          ) : (
            <IconComponent />
          )}
        </ListItemIcon>
        <ListItemText
          primary={item.label}
          sx={{
            opacity: open ? 1 : 0,
            transition: "opacity 0.2s ease",
            "& .MuiTypography-root": {
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "primary.main" : "text.primary",
              fontSize: "0.875rem",
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  // Tooltip quando sidebar está fechada para melhor acessibilidade
  if (!open) {
    return (
      <Tooltip title={item.label} placement="right" arrow>
        {content}
      </Tooltip>
    );
  }

  return content;
};

export default SidebarItem;

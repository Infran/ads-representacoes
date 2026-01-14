import React from "react";
import {
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Badge,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import type { MenuItem } from "./sidebarConfig";

interface SidebarItemProps {
  item: MenuItem;
  open: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, open }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Verifica se a rota está ativa (exata ou início)
  const isActive =
    location.pathname === item.path ||
    location.pathname.startsWith(item.path + "/");

  const handleClick = () => {
    navigate(item.path);
  };

  const IconComponent = item.icon;

  const content = (
    <ListItem disablePadding sx={{ display: "block" }}>
      <ListItemButton
        onClick={handleClick}
        sx={{
          minHeight: 48,
          justifyContent: open ? "initial" : "center",
          px: 2.5,
          mx: 1,
          my: 0.5,
          borderRadius: 2,
          backgroundColor: isActive
            ? "rgba(25, 118, 210, 0.12)"
            : "transparent",
          borderLeft: isActive ? "3px solid #1976D2" : "3px solid transparent",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: isActive
              ? "rgba(25, 118, 210, 0.18)"
              : "rgba(0, 0, 0, 0.04)",
            transform: "translateX(2px)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: open ? 2.5 : "auto",
            justifyContent: "center",
            color: isActive ? "#1976D2" : "rgba(0, 0, 0, 0.54)",
            transition: "color 0.2s ease",
          }}
        >
          {item.badge ? (
            <Badge badgeContent={item.badge} color="error" max={99}>
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
              color: isActive ? "#1976D2" : "rgba(0, 0, 0, 0.87)",
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

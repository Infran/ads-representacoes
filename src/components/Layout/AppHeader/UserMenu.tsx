import React, { useState } from "react";
import {
  Box,
  Avatar,
  Menu,
  MenuItem,
  Typography,
  Divider,
  ListItemIcon,
  Switch,
  IconButton,
} from "@mui/material";
import {
  Person,
  Settings,
  Logout,
  DarkMode,
  LightMode,
} from "@mui/icons-material";
import { useAuth } from "../../../context/ContextAuth";
import { useLayout } from "../LayoutContext";
import Swal from "sweetalert2";

const UserMenu: React.FC = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { currentUser, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useLayout();
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    Swal.fire({
      title: "Deseja sair?",
      text: "Você precisará fazer login novamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#1976D2",
      confirmButtonText: "Sim, sair",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  // Pegar iniciais do nome
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          p: 0.5,
          "&:hover": {
            backgroundColor: "rgba(25, 118, 210, 0.08)",
          },
        }}
      >
        <Avatar
          src={currentUser?.photoURL || undefined}
          alt={currentUser?.displayName || "Usuário"}
          sx={{
            width: 38,
            height: 38,
            backgroundColor: "#1976D2",
            fontSize: "0.875rem",
            fontWeight: 600,
            border: "2px solid rgba(25, 118, 210, 0.2)",
            transition: "all 0.2s ease",
            "&:hover": {
              transform: "scale(1.05)",
            },
          }}
        >
          {getInitials(currentUser?.displayName)}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        PaperProps={{
          elevation: 8,
          sx: {
            minWidth: 220,
            mt: 1,
            borderRadius: 2,
            overflow: "visible",
            "&::before": {
              content: '""',
              display: "block",
              position: "absolute",
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: "background.paper",
              transform: "translateY(-50%) rotate(45deg)",
              zIndex: 0,
            },
          },
        }}
      >
        {/* Header do usuário */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {currentUser?.displayName || "Usuário"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {currentUser?.email}
          </Typography>
        </Box>

        <Divider />

        {/* Menu items */}
        <MenuItem
          onClick={() => {
            handleClose();
            // Navegar para perfil quando implementado
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <Person fontSize="small" />
          </ListItemIcon>
          Meu Perfil
        </MenuItem>

        <MenuItem
          onClick={() => {
            handleClose();
            // Navegar para configurações quando implementado
          }}
          sx={{ py: 1.5 }}
        >
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Configurações
        </MenuItem>

        <Divider />

        {/* Dark mode toggle */}
        <MenuItem
          onClick={toggleDarkMode}
          sx={{
            py: 1.5,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <ListItemIcon>
              {darkMode ? (
                <DarkMode fontSize="small" />
              ) : (
                <LightMode fontSize="small" />
              )}
            </ListItemIcon>
            Modo Escuro
          </Box>
          <Switch
            size="small"
            checked={darkMode}
            onChange={toggleDarkMode}
            onClick={(e) => e.stopPropagation()}
          />
        </MenuItem>

        <Divider />

        {/* Logout */}
        <MenuItem
          onClick={handleLogout}
          sx={{
            py: 1.5,
            color: "error.main",
            "&:hover": {
              backgroundColor: "rgba(211, 47, 47, 0.08)",
            },
          }}
        >
          <ListItemIcon>
            <Logout fontSize="small" sx={{ color: "error.main" }} />
          </ListItemIcon>
          Sair
        </MenuItem>
      </Menu>
    </>
  );
};

export default UserMenu;

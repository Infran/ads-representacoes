import React from "react";
import { styled, Theme, CSSObject } from "@mui/material/styles";
import MuiDrawer from "@mui/material/Drawer";
import {
  Box,
  List,
  Divider,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
} from "@mui/material";
import { Logout } from "@mui/icons-material";
import Swal from "sweetalert2";

import { useLayout } from "../LayoutContext";
import { useAuth } from "../../../context/ContextAuth";
import SidebarHeader from "./SidebarHeader";
import SidebarGroup from "./SidebarGroup";
import { sidebarConfig } from "./sidebarConfig";

const drawerWidth = 260;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
  borderRight: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "none",
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(8)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(9)} + 1px)`,
  },
  borderRight: "1px solid rgba(0, 0, 0, 0.08)",
  boxShadow: "none",
});

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const Sidebar: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useLayout();
  const { logout } = useAuth();

  const handleLogout = () => {
    Swal.fire({
      title: "Deseja sair?",
      text: "Você precisará fazer login novamente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#1976D2",
      confirmButtonText: "Sim, sair",
      cancelButtonText: "Cancelar",
      background: "#fff",
      color: "#333",
      customClass: {
        popup: "swal-popup-custom",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
      }
    });
  };

  const logoutButton = (
    <ListItem disablePadding sx={{ display: "block" }}>
      <ListItemButton
        onClick={handleLogout}
        sx={{
          minHeight: 48,
          justifyContent: sidebarOpen ? "initial" : "center",
          px: 2.5,
          mx: 1,
          my: 0.5,
          borderRadius: 2,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(211, 47, 47, 0.08)",
            transform: "translateX(2px)",
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 0,
            mr: sidebarOpen ? 2.5 : "auto",
            justifyContent: "center",
            color: "#d32f2f",
          }}
        >
          <Logout />
        </ListItemIcon>
        <ListItemText
          primary="Sair"
          sx={{
            opacity: sidebarOpen ? 1 : 0,
            "& .MuiTypography-root": {
              fontWeight: 500,
              color: "#d32f2f",
              fontSize: "0.875rem",
            },
          }}
        />
      </ListItemButton>
    </ListItem>
  );

  return (
    <Drawer variant="permanent" open={sidebarOpen}>
      {/* Header com logo */}
      <SidebarHeader open={sidebarOpen} onClose={toggleSidebar} />

      {/* Menu Groups */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          overflowX: "hidden",
          py: 1,
          "&::-webkit-scrollbar": {
            width: 4,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: "rgba(0,0,0,0.1)",
            borderRadius: 2,
          },
        }}
      >
        {sidebarConfig.map((group, index) => (
          <React.Fragment key={group.id}>
            <SidebarGroup group={group} open={sidebarOpen} />
            {index < sidebarConfig.length - 1 && (
              <Divider sx={{ my: 1, mx: 2, opacity: 0.5 }} />
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Footer com logout */}
      <Divider sx={{ opacity: 0.5 }} />
      <List sx={{ py: 1 }}>
        {sidebarOpen ? (
          logoutButton
        ) : (
          <Tooltip title="Sair" placement="right" arrow>
            {logoutButton}
          </Tooltip>
        )}
      </List>
    </Drawer>
  );
};

export default Sidebar;

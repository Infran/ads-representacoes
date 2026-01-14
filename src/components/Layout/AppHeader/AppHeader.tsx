import React from "react";
import { styled } from "@mui/material/styles";
import MuiAppBar, { AppBarProps as MuiAppBarProps } from "@mui/material/AppBar";
import { Toolbar, Box, Typography, IconButton, Divider } from "@mui/material";
import { Menu as MenuIcon } from "@mui/icons-material";
import { useLocation } from "react-router-dom";

import { useLayout } from "../LayoutContext";
import Breadcrumbs from "./Breadcrumbs";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { routeTitles } from "../Sidebar/sidebarConfig";

const drawerWidth = 260;
const collapsedWidth = 73;

interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const StyledAppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  backgroundColor: "#fff",
  color: "#2C3E50",
  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
  borderBottom: "1px solid rgba(0, 0, 0, 0.08)",
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: collapsedWidth,
  width: `calc(100% - ${collapsedWidth}px)`,
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const AppHeader: React.FC = () => {
  const { sidebarOpen, toggleSidebar } = useLayout();
  const location = useLocation();

  // Obter título da página baseado na rota
  const getPageTitle = (): string => {
    // Verificar rota exata primeiro
    if (routeTitles[location.pathname]) {
      return routeTitles[location.pathname];
    }

    // Verificar rotas com parâmetros (ex: /Orcamentos/Editar/:id)
    if (location.pathname.startsWith("/Orcamentos/Editar/")) {
      return "Editar Orçamento";
    }

    // Fallback para segmento da URL
    const segments = location.pathname.split("/").filter(Boolean);
    return segments[segments.length - 1] || "Dashboard";
  };

  return (
    <StyledAppBar position="fixed" open={sidebarOpen}>
      <Toolbar
        sx={{
          justifyContent: "space-between",
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Lado esquerdo - Toggle + Título + Breadcrumbs */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            color="inherit"
            aria-label="toggle sidebar"
            onClick={toggleSidebar}
            edge="start"
            sx={{
              color: "rgba(0, 0, 0, 0.54)",
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Box>
            <Typography
              variant="h6"
              component="h1"
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.125rem" },
                color: "#2C3E50",
                lineHeight: 1.3,
              }}
            >
              {getPageTitle()}
            </Typography>
            <Breadcrumbs />
          </Box>
        </Box>

        {/* Lado direito - Busca + Notificações + Usuário */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <GlobalSearch />
          <NotificationBell />
          <UserMenu />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default AppHeader;

import React from "react";
import { Toolbar, Box, Typography, IconButton, Divider, Tooltip, AppBar as MuiAppBar, AppBarProps as MuiAppBarProps, styled } from "@mui/material";
import { Menu as MenuIcon, HelpOutline } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";

import { useLayout } from "../LayoutContext";
import Breadcrumbs from "./Breadcrumbs";
import GlobalSearch from "./GlobalSearch";
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
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.text.primary,
  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.05)",
  borderBottom: `1px solid ${theme.palette.divider}`,
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
  const navigate = useNavigate();

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
          gap: 2,
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 2, sm: 3 },
        }}
      >
        {/* Lado esquerdo - Toggle + Título + Breadcrumbs */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0 }}>
          <IconButton
            color="inherit"
            aria-label="Alternar menu lateral"
            onClick={toggleSidebar}
            edge="start"
            sx={{
              color: "text.secondary",
              "&:hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h6"
              component="h1"
              noWrap
              sx={{
                fontWeight: 600,
                fontSize: { xs: "1rem", sm: "1.125rem" },
                color: "text.primary",
                lineHeight: 1.3,
              }}
            >
              {getPageTitle()}
            </Typography>
            <Breadcrumbs />
          </Box>
        </Box>

        {/* Centro - Busca global */}
        <Box sx={{ display: "flex", justifyContent: "center", flexShrink: 0 }}>
          <GlobalSearch />
        </Box>

        {/* Lado direito - Ajuda + Usuário */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 1,
            flex: 1,
            minWidth: 0,
          }}
        >
          <Tooltip title="Ajuda">
            <IconButton
              aria-label="Ajuda"
              onClick={() => navigate("/Ajuda")}
              sx={{
                color: "text.secondary",
                "&:hover": { backgroundColor: "action.hover" },
              }}
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>
          <UserMenu />
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default AppHeader;

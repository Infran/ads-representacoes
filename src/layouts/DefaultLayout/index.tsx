import { Outlet } from "react-router-dom";
import { Suspense } from "react";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import CssBaseline from "@mui/material/CssBaseline";
import { Sidebar, AppHeader, LayoutProvider } from "../../components/Layout";

export default function DefaultLayout() {
  return (
    <LayoutProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <CssBaseline />

        {/* AppHeader fixo no topo */}
        <AppHeader />

        {/* Sidebar lateral */}
        <Sidebar />

        {/* Área de conteúdo principal */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: "100vh",
            // Margem superior para compensar o AppBar fixo
            marginTop: { xs: "56px", sm: "64px" },
            // Padding para o conteúdo
            padding: { xs: 2, sm: 3 },
            // Background suave (token do tema — adapta ao modo claro/escuro)
            backgroundColor: "background.default",
            // Transição suave quando sidebar abre/fecha
            transition: "margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms",
            // Overflow para conteúdo longo
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <Suspense
            fallback={
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                minHeight="60vh"
              >
                <CircularProgress />
              </Box>
            }
          >
            <Outlet />
          </Suspense>
        </Box>
      </Box>
    </LayoutProvider>
  );
}

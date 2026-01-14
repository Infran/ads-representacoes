import { Outlet } from "react-router-dom";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { Sidebar, AppHeader, LayoutProvider } from "../../components/Layout";

const drawerWidth = 260;
const collapsedWidth = 73;

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
            // Background suave
            backgroundColor: "#FAFAFA",
            // Transição suave quando sidebar abre/fecha
            transition: "margin-left 225ms cubic-bezier(0.4, 0, 0.6, 1) 0ms",
            // Overflow para conteúdo longo
            overflowX: "hidden",
            overflowY: "auto",
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </LayoutProvider>
  );
}

import { Outlet, useLocation } from "react-router-dom";
import { Suspense } from "react";
import { Box, CircularProgress, CssBaseline } from "@mui/material";
import { Sidebar, AppHeader, LayoutProvider } from "../../components/Layout";
import { ErrorBoundary } from "../../ui";
import VLibrasWidget from "../../components/Accessibility/VLibrasWidget";

export default function DefaultLayout() {
  const location = useLocation();

  return (
    <LayoutProvider>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <CssBaseline />

        {/* Pular para o conteúdo — primeiro foco por teclado (acessibilidade). */}
        <Box component="a" href="#conteudo-principal" className="ads-skip-link">
          Pular para o conteúdo
        </Box>

        {/* VLibras (Libras) — só carrega quando a preferência está ativa. */}
        <VLibrasWidget />

        {/* AppHeader fixo no topo */}
        <AppHeader />

        {/* Sidebar lateral */}
        <Sidebar />

        {/* Área de conteúdo principal */}
        <Box
          component="main"
          id="conteudo-principal"
          tabIndex={-1}
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
          {/*
            Chaveado pela rota: um erro numa página não pode deixar o app preso
            no fallback para sempre — navegar remonta o boundary. E como ele
            está DENTRO do layout, a sidebar sobrevive ao crash, o que permite
            chegar ao painel de administração e ver o erro registrado.
          */}
          <ErrorBoundary
            key={location.pathname}
            message="Não foi possível exibir esta página. O erro foi registrado e você pode tentar novamente ou navegar para outra tela."
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
          </ErrorBoundary>
        </Box>
      </Box>
    </LayoutProvider>
  );
}

import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Box from "@mui/material/Box";

export default function DefaultLayout() {
  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh", // Garante que o layout ocupe toda a altura da tela
        maxWidth: "100%",  // Garante largura completa
      }}
    >
      <Sidebar />
      <Box
        component="main"
        sx={{
          width: "100%", // Ocupa toda a largura disponível
          display: "flex",
          overflow: "auto", // Adiciona barra de rolagem quando necessário
          flexDirection: "column", // Componentes internos em coluna
          alignItems: "stretch", // Garante que ocupem largura total
          backgroundColor: "#f9f9f9", // Fundo para destacar o conteúdo
          marginTop: 8, // Espaçamento superior
          padding: 2, // Espaçamento interno
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}

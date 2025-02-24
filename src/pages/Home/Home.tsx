import React from "react";
import SectionCard from "../../components/SectionCard/SectionCard";
import { Box, Typography, Grid, Divider } from "@mui/material";

export const Home = () => {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1200, // Limita a largura máxima para melhor leitura
        margin: "0 auto",
        padding: 3, // Adiciona um padding para não colar nas bordas
        display: "flex",
        flexDirection: "column",
        gap: 4, // Reduzi o gap para um espaçamento mais harmonioso
      }}
    >
      {/* Seção de Gestão */}
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#2C3E50", mb: 2 }}
        >
          Gestão
        </Typography>
        <Divider sx={{ backgroundColor: "#E0E0E0", mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <SectionCard title="Clientes" link="/Clientes" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SectionCard title="Representantes" link="/Representantes" />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <SectionCard title="Produtos" link="/Produtos" />
          </Grid>
        </Grid>
      </Box>

      {/* Seção de Operações */}
      <Box>
        <Typography
          variant="h5"
          sx={{ fontWeight: "bold", color: "#2C3E50", mb: 2 }}
        >
          Operações
        </Typography>
        <Divider sx={{ backgroundColor: "#E0E0E0", mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <SectionCard title="Gerar Orçamento" link="/Orcamentos" />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

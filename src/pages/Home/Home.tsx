import React from "react";
import SectionCard from "../../components/SectionCard/SectionCard";
import { Box, Typography, Grid, Divider } from "@mui/material";

export const Home = () => {
  return (
    <Box 
      sx={{ 
        width: "100%", 
        margin: "0 auto", 
        display: "flex", 
        flexDirection: "column", 
        gap: 6 
      }}
    > 
      {/* Categorias */}
      <Box>
        {/* Gestão */}
        <Box sx={{ marginBottom: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2C3E50" }}>
            Gestão
          </Typography>
          <Divider sx={{ marginY: 1, backgroundColor: "#E0E0E0" }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <SectionCard title="Clientes" link="/Clientes" />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <SectionCard title="Produtos" link="/Produtos" />
            </Grid>
          </Grid>
        </Box>

        {/* Operações */}
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#2C3E50" }}>
            Operações
          </Typography>
          <Divider sx={{ marginY: 1, backgroundColor: "#E0E0E0" }} />
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={4}>
              <SectionCard title="Gerar Orçamento" link="/Orcamentos" />
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Box>
  );
};

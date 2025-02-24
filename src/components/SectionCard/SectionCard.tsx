import React from "react";
import { FC } from "react";
import { Box, Card, CardContent, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface SectionCardProps {
  title: string;
  link: string;
}

const SectionCard: FC<SectionCardProps> = ({ title, link }) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(link);
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 300, // Limita a largura máxima do card
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        "&:hover": {
          boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.15)", // Sombra mais pronunciada no hover
          transform: "translateY(-5px)", // Efeito de levantar mais perceptível
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          border: "1px solid #E0E0E0",
          borderRadius: "8px", // Bordas mais arredondadas
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: 180, // Altura um pouco maior para melhor proporção
          overflow: "hidden", // Garante que nada ultrapasse os limites do card
        }}
      >
        <CardContent
          onClick={handleCardClick}
          sx={{
            cursor: "pointer",
            flexGrow: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 3, // Mais espaço interno
            "&:hover": {
              backgroundColor: "#F5F5F5", // Fundo mais claro no hover
            },
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "600", // Fonte um pouco mais grossa
              color: "#2C3E50",
              fontSize: "1.25rem", // Tamanho de fonte um pouco maior
            }}
          >
            {title}
          </Typography>
        </CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            padding: 2, // Espaçamento interno
            backgroundColor: "#F9F9F9", // Fundo mais claro para a área do botão
            borderTop: "1px solid #E0E0E0", // Linha sutil para separar
          }}
        >
          <Button
            variant="text"
            color="primary"
            onClick={handleCardClick}
            sx={{
              textTransform: "uppercase",
              fontWeight: "bold",
              fontSize: "0.8rem",
              padding: "6px 12px", // Padding mais confortável
              "&:hover": {
                backgroundColor: "rgba(25, 118, 210, 0.08)", // Fundo sutil no hover
                color: "#1565C0",
              },
            }}
          >
            Abrir
          </Button>
        </Box>
      </Card>
    </Box>
  );
};

export default SectionCard;
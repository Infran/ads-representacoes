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
      width={300}
      sx={{
        transition: "box-shadow 0.3s ease, transform 0.3s ease",
        "&:hover": {
          boxShadow: "0px 8px 20px rgba(0, 0, 0, 0.12)",
          transform: "translateY(-3px)",
        },
      }}
    >
      <Card
        elevation={0}
        sx={{
          backgroundColor: "#ffffff",
          border: "1px solid #E0E0E0", // Linha bem fina para separar os elementos
          borderRadius: "4px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          height: 150,
          padding: 2,
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
          }}
        >
          <Typography
            variant="h6"
            sx={{
              fontWeight: "500",
              color: "#2C3E50", // Azul escuro elegante
            }}
          >
            {title}
          </Typography>
        </CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
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
              "&:hover": {
                color: "#1565C0", // Azul escuro no hover
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

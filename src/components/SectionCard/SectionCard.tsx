import React from "react";
import { FC } from "react";
import { Box, Card, CardActions, CardContent, Button, Typography, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface SectionCardProps {
  title: string;
  link: string;
}

const SectionCard: FC<SectionCardProps> = (props) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(props.link);
  };

  return (
    <Box width={300}>
      <Paper>
        <Card variant="outlined" sx={{ height: 150, width: "100%", display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <CardContent onClick={handleCardClick} sx={{ cursor: 'pointer' }}>
            <Typography sx={{ fontSize: 24 }} color="text.secondary" gutterBottom>
              {props.title}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={handleCardClick}>
              Abrir
            </Button>
          </CardActions>
        </Card>
      </Paper>
    </Box>
  );
};

export default SectionCard;

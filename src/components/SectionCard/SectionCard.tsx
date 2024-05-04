import React from "react";
import { FC } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";

interface SectionCardProps {
  title: string;
  link: string;
}

const SectionCard:FC<SectionCardProps> = (props) => {
  const navigate = useNavigate() 
  return (
    <Box sx={{ maxWidth: 300}}>
      <Card variant="outlined" sx={{height:150, width:350}}>
        <React.Fragment>
          <CardContent>
            <Typography
              sx={{ fontSize: 24 }}
              color="text.secondary"
              gutterBottom
              overflow={"clip"}
            >
              {props.title}
            </Typography>
          </CardContent>
          <CardActions>
            <Button size="small" onClick={() => {navigate(`${props.link}`)}}>Abrir</Button>
          </CardActions>
        </React.Fragment>
      </Card>
    </Box>
  );
}

export default SectionCard;
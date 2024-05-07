import React from "react";
import { FC } from "react";
import { Box } from "@mui/material";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useNavigate } from "react-router-dom";
import { CardActionArea, Paper } from "@mui/material";

interface SectionCardProps {
  title: string;
  link: string;
}

const SectionCard: FC<SectionCardProps> = (props) => {
  const navigate = useNavigate();
  return (
    <Box width={300}>
      <Paper>

      
      <CardActionArea>
        <Card
          variant="outlined"
          sx={{ height: 150, width: "100%" }}
          onClick={() => {
            navigate(`${props.link}`);
          }}
        >
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
              <Button size="small">Abrir</Button>
            </CardActions>
          </React.Fragment>
        </Card>
      </CardActionArea>
      </Paper>
    </Box>
  );
};

export default SectionCard;

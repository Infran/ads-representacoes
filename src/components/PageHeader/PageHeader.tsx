import { Person } from "@mui/icons-material";
import Box from "@mui/material/Box";
import { Paper, Typography } from "@mui/material";
import { FC } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
}

const PageHeader: FC<PageHeaderProps> = (props) => {
  return (
    <Paper elevation={1} sx={{ padding: 2 }}>
      <Box display={"flex"} flexDirection={"row"} alignItems={"center"} gap={4}>
        <Paper elevation={3}>
          <Box
            display={"flex"}
            flexDirection={"column"}
            width={100}
            gap={1}
            height={100}
            alignItems={"center"}
            justifyContent={"center"}
          >
            <Person />
            <Typography>{props.title}</Typography>
          </Box>
        </Paper>
        <Typography>{props.description}</Typography>
      </Box>
    </Paper>
  );
};

export default PageHeader;

import React, { FC, useState } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import { AddCircle, NoteAdd, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  TextField,
  styled,
  useMediaQuery,
  useTheme,
} from "@mui/material";

interface BudgetsProps {}

const StyledPaper = styled(Paper)({
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

const ButtonGroup = styled(Box)({
  display: "flex",
  gap: 16,
})

const Budgets = () => {
  const [openModal, setOpenModal] = useState(false);
  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        gap={2}
        sx={{ padding: 2, width: "94vw" }}
      >
        <PageHeader
          title="Orçamentos"
          description="Gerencie seus orçamentos"
          icon={NoteAdd}
        />

        <StyledPaper>
          <Box
            display="flex"
            flexDirection={"row"}
            gap={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <ButtonGroup>
              <Button variant="contained" type="submit">
                <Box display="flex" gap={0.5}>
                  Pesquisar
                  <Search />
                </Box>
              </Button>
              <Button variant="contained" onClick={handleOpen}>
                <Box display="flex" gap={0.5}>
                  Adicionar
                  <AddCircle />
                </Box>
              </Button>
            </ButtonGroup>
            <Box flex={1}>
              <TextField
                label="Digite o nome do produto"
                variant="outlined"
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </StyledPaper>
      </Box>
    </>
  );
};

export default Budgets;

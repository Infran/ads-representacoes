import PageHeader from "../../components/PageHeader/PageHeader";
import Box from "@mui/material/Box";
import { Paper } from "@mui/material";
import Button from "@mui/material/Button";
import { PersonAdd } from "@mui/icons-material";
import TextField from "@mui/material/TextField";

export const Clients = () => {
  return (
    <>
      <Box display={"flex"} flexDirection={"column"} gap={2}>
        <PageHeader
          title="Clientes"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Cliente."
        />

        <Paper>
          <Box padding={1} gap={2} display={"flex"} alignItems={"center"} justifyContent={"space-between"}>
            <Box component="form" display={"flex"} gap={2}>
              <TextField id="outlined-basic" label="Nome" variant="outlined" />
              <TextField id="outlined-basic" label="----" variant="outlined" />
              <TextField id="outlined-basic" label="----" variant="outlined" />
            </Box>
            <Box>
              <Button variant="contained" type="submit">
                <Box display={"flex"} gap={0.5}>
                  Adicionar
                  <PersonAdd />
                </Box>
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </>
  );
};

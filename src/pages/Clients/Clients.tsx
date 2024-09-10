import { Box, Button, Paper, TextField, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/system';
import PageHeader from './../../components/PageHeader/PageHeader';
import { Search, PersonAdd } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { addClient, fetchClients } from '../../utils/firebaseUtils';
import { IClient } from '../../interfaces/icliente';
import { ClientsTable } from '../../components/ClientsTable/ClientsTable';
import ClientModal from '../../components/ClientModal/ClientModal';

const StyledPaper = styled(Paper)({
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

const ButtonGroup = styled(Box)({
  display: 'flex',
  gap: 16,
});

const Clients = () => {
  const [openModal, setOpenModal] = useState(false);
  const [client, setClient] = useState<IClient>();
  const [clientList, setClientList] = useState<IClient[]>([]);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handleAddClient = () => {
    console.log('Adicionar cliente:', client);
    addClient(client);
    handleClose();
  };

  useEffect(() => {
    const fetchData = async () => {
      const clients = await fetchClients();
      setClientList(clients);
    };
    fetchData();
    console.log('Clientes:', clientList);
  }, []);
  
  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} sx={{ width: "94vw", padding: 2 }}>
        <PageHeader
          title="Clientes"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Cliente."
          icon={PersonAdd}
        />
        <StyledPaper>
          <Box
            display="flex"
            flexDirection={isSmallScreen ? 'column' : 'row'}
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
                  <PersonAdd />
                </Box>
              </Button>
            </ButtonGroup>
            <Box flex={1}>
              <TextField
                label="Digite o nome do cliente"
                variant="outlined"
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </StyledPaper>
        <ClientsTable rows={clientList} />
      </Box>

      <ClientModal
        open={openModal}
        handleClose={handleClose}
        client={client}
        handleChange={handleChange}
        handleAddClient={handleAddClient}
      />
    </>
  );
};

export default Clients;

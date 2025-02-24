import { Box, CircularProgress } from '@mui/material';
import PageHeader from './../../components/PageHeader/PageHeader';
import { PersonAdd } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { getClients } from '../../services/clientServices';
import { IClient } from '../../interfaces/iclient';
import { ClientsTable } from '../../components/Tables/ClientsTable/ClientsTable';
import ClientModal from '../../components/Modal/ClientModal/ClientModal';
import SearchBar from '../../components/SearchBar/SearchBar';

const Clients = () => {
  const [openModal, setOpenModal] = useState(false);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<IClient[]>([]);

  const handleSearch = () => {
    const filtered = clientList.filter((client) => {
      return (
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }) 
    setFilteredClients(filtered);
  };

  const handleClose = () => setOpenModal(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const clients = await getClients();
        setClientList(clients);
        setFilteredClients(clients);
      } catch (error) {
        console.error('Erro ao buscar clientes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onEdit = (id: string) => {
    console.log('Editar cliente:', id);
  };

  const onDelete = (id: string) => {
    console.log('Deletar cliente:', id);
  };

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Clientes"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Cliente."
          icon={PersonAdd}
        />
        <SearchBar
            search={searchTerm}
            onSearchChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
            onAdd={() => setOpenModal(true)}
            inputLabel="Digite o nome do cliente"
            />
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            {/* loading spinner */}
            Carregando... <CircularProgress />
          </Box>
        ) : (
          <ClientsTable rows={filteredClients} onEdit={onEdit} onDelete={onDelete} />
        )}
      </Box>
      <ClientModal open={openModal} handleClose={handleClose} />
    </>
  );
};

export default Clients;
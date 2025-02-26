import { Box, CircularProgress } from '@mui/material';
import PageHeader from './../../components/PageHeader/PageHeader';
import { PersonAdd } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { deleteClient, getClients } from '../../services/clientServices';
import { IClient } from '../../interfaces/iclient';
import { ClientsTable } from '../../components/Tables/ClientsTable/ClientsTable';
import CreateClientModal from '../../components/Modal/Create/CreateClientModal/CreateClientModal';
import SearchBar from '../../components/SearchBar/SearchBar';
import DeleteClientModal from '../../components/Modal/Delete/DeleteClientModal';

const Clients = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClients, setFilteredClients] = useState<IClient[]>([]);
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null); // Estado para armazenar o cliente selecionado

  const handleSearch = () => {
    const filtered = clientList.filter((client) => {
      return (
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredClients(filtered);
  };

  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

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

  const onDelete = (client: IClient) => {
    setSelectedClient(client); // Define o cliente selecionado
    setOpenDeleteModal(true); // Abre o modal de exclusão
  };

  const handleConfirmDelete = async () => {
    if (selectedClient) {
      try {
        await deleteClient(selectedClient.id.toString()); // Exclui o cliente
        setClientList((prev) => prev.filter((c) => c.id !== selectedClient.id)); // Atualiza a lista de clientes
        setFilteredClients((prev) => prev.filter((c) => c.id !== selectedClient.id)); // Atualiza a lista filtrada
        setOpenDeleteModal(false); // Fecha o modal
        window.location.reload(); // Recarrega a página
      } catch (error) {
        console.error(' Erro ao excluir cliente:', error);
      }
    }
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
            Carregando... <CircularProgress />
          </Box>
        ) : (
          <ClientsTable rows={filteredClients} onEdit={onEdit} onDelete={onDelete} />
        )}
      </Box>

      {/* Modal de criação de cliente */}
      <CreateClientModal open={openModal} handleClose={handleClose} />

      {/* Modal de exclusão de cliente */}
      <DeleteClientModal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        client={selectedClient}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default Clients;
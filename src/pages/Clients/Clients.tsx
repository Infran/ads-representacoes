import { Box } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import { PersonAdd } from "@mui/icons-material";
import { useState, useMemo } from "react";
import { deleteClient } from "../../services/clientServices";
import { IClient } from "../../interfaces/iclient";
import { ClientsTable } from "../../components/Tables/ClientsTable/ClientsTable";
import CreateClientModal from "../../components/Modal/Create/CreateClientModal/CreateClientModal";
import SearchBar from "../../components/SearchBar/SearchBar";
import DeleteClientModal from "../../components/Modal/Delete/DeleteClientModal";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError } from "../../ui";
import { logger } from "../../utils/logger";

const Clients = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const {
    clients: clientList,
    loading,
    removeClientFromCache,
  } = useData();

  // Filtragem local dos clientes
  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientList;

    return clientList.filter((client) => {
      return (
        client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [clientList, searchTerm]);

  const handleSearch = () => {
    // A filtragem já é feita pelo useMemo, então não precisa fazer nada aqui
    // Mantido para compatibilidade com SearchBar
  };

  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const onDelete = (client: IClient) => {
    setSelectedClient(client);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedClient) {
      try {
        await deleteClient(selectedClient.id.toString());
        // Atualiza o cache local em vez de recarregar a página
        removeClientFromCache(selectedClient.id);
        setOpenDeleteModal(false);
        setSelectedClient(null);
      } catch (error) {
        logger.error("Erro ao excluir cliente:", error);
        notifyError(
          "Não foi possível excluir o cliente",
          "Tente novamente em instantes."
        );
      }
    }
  };

  const isEmpty = !loading && filteredClients.length === 0;

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
          <TableSkeleton />
        ) : isEmpty ? (
          searchTerm ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description={`Nada corresponde a "${searchTerm}".`}
            />
          ) : (
            <EmptyState
              title="Nenhum cliente cadastrado"
              description="Comece cadastrando o primeiro cliente."
              icon={PersonAdd}
              actionLabel="Cadastrar cliente"
              onAction={() => setOpenModal(true)}
            />
          )
        ) : (
          <ClientsTable rows={filteredClients} onDelete={onDelete} />
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

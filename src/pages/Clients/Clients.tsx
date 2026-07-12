import { Box } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import { PersonAdd } from "@mui/icons-material";
import { useState, useMemo } from "react";
import { deleteClient } from "../../services/clientServices";
import { IClient } from "../../interfaces/iclient";
import { ClientsTable } from "../../components/Tables/ClientsTable/ClientsTable";
import CreateClientModal from "../../components/Modal/Create/CreateClientModal/CreateClientModal";
import ClientsFilter, { ClientFilters } from "../../components/Filters/ClientsFilter";
import DeleteClientModal from "../../components/Modal/Delete/DeleteClientModal";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const Clients = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [filters, setFilters] = useState<ClientFilters>({
    name: "",
    email: "",
    phone: "",
    cnpj: "",
    cep: "",
    address: "",
    city: "",
    state: "",
  });
  const [selectedClient, setSelectedClient] = useState<IClient | null>(null);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const {
    clients: clientList,
    loading,
    removeClientFromCache,
  } = useData();

  // Filtragem local dos clientes com filtros complexos
  const filteredClients = useMemo(() => {
    return clientList.filter((client) => {
      const matchesName =
        !filters.name ||
        client.name?.toLowerCase().includes(filters.name.toLowerCase());
      const matchesEmail =
        !filters.email ||
        client.email?.toLowerCase().includes(filters.email.toLowerCase());
      const matchesPhone =
        !filters.phone ||
        client.phone?.toLowerCase().includes(filters.phone.toLowerCase());
      const matchesCnpj =
        !filters.cnpj ||
        client.cnpj?.toLowerCase().includes(filters.cnpj.toLowerCase());
      const matchesAddress =
        !filters.address ||
        client.address?.toLowerCase().includes(filters.address.toLowerCase());
      const matchesCep =
        !filters.cep ||
        client.cep?.toLowerCase().includes(filters.cep.toLowerCase());
      const matchesCity =
        !filters.city ||
        client.city?.toLowerCase().includes(filters.city.toLowerCase());
      const matchesState =
        !filters.state ||
        client.state?.toLowerCase().includes(filters.state.toLowerCase());

      return (
        matchesName &&
        matchesEmail &&
        matchesPhone &&
        matchesCnpj &&
        matchesAddress &&
        matchesCep &&
        matchesCity &&
        matchesState
      );
    });
  }, [clientList, filters]);

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
        notifySuccess("Sucesso!", "Cliente excluído com sucesso!");
      } catch (error) {
        logger.error("Erro ao excluir cliente:", error);
        notifyError(
          "Não foi possível excluir o cliente",
          error
        );
      }
    }
  };

  const isEmpty = !loading && filteredClients.length === 0;
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Clientes"
          description="Gerencie os clientes cadastrados: busque, edite ou exclua registros."
          icon={PersonAdd}
          actionLabel="Adicionar cliente"
          onAction={() => setOpenModal(true)}
        />
        <ClientsFilter
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              name: "",
              email: "",
              phone: "",
              cnpj: "",
              cep: "",
              address: "",
              city: "",
              state: "",
            })
          }
        />
        {loading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          hasActiveFilters ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Nenhum cliente corresponde aos filtros aplicados."
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

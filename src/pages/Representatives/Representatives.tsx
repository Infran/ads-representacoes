import { useState, useMemo } from "react";
import { Box } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import CreateRepresentativeModal from "../../components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal";
import { PersonAdd } from "@mui/icons-material";
import { IRepresentative } from "../../interfaces/irepresentative";
import { deleteRepresentative } from "../../services/representativeServices";
import RepresentativesFilter, { RepresentativeFilters } from "../../components/Filters/RepresentativesFilter";
import DeleteRepresentativeModal from "../../components/Modal/Delete/DeleteRepresentativeModal";
import RepresentativeTable from "../../components/Tables/RepresentativeTable/RepresentativeTable";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const Representatives = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [filters, setFilters] = useState<RepresentativeFilters>({
    name: "",
    email: "",
    phone: "",
    mobilePhone: "",
    cep: "",
    address: "",
    city: "",
    state: "",
    role: "",
    clientName: "",
  });
  const [selectedRepresentative, setSelectedRepresentative] =
    useState<IRepresentative | null>(null);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const {
    representatives: representativesList,
    loading,
    removeRepresentativeFromCache,
  } = useData();

  // Filtragem local dos representantes com filtros complexos
  const filteredRepresentativesList = useMemo(() => {
    return representativesList.filter((representative) => {
      const matchesName =
        !filters.name ||
        representative.name?.toLowerCase().includes(filters.name.toLowerCase());
      const matchesEmail =
        !filters.email ||
        representative.email
          ?.toLowerCase()
          .includes(filters.email.toLowerCase());
      const matchesPhone =
        !filters.phone ||
        representative.phone
          ?.toLowerCase()
          .includes(filters.phone.toLowerCase());
      const matchesMobilePhone =
        !filters.mobilePhone ||
        representative.mobilePhone
          ?.toLowerCase()
          .includes(filters.mobilePhone.toLowerCase());
      const matchesAddress =
        !filters.address ||
        representative.address
          ?.toLowerCase()
          .includes(filters.address.toLowerCase());
      const matchesCep =
        !filters.cep ||
        representative.cep?.toLowerCase().includes(filters.cep.toLowerCase());
      const matchesCity =
        !filters.city ||
        representative.city?.toLowerCase().includes(filters.city.toLowerCase());
      const matchesState =
        !filters.state ||
        representative.state
          ?.toLowerCase()
          .includes(filters.state.toLowerCase());
      const matchesRole =
        !filters.role ||
        representative.role
          ?.toLowerCase()
          .includes(filters.role.toLowerCase());
      const matchesClientName =
        !filters.clientName ||
        representative.client?.name
          ?.toLowerCase()
          .includes(filters.clientName.toLowerCase());

      return (
        matchesName &&
        matchesEmail &&
        matchesPhone &&
        matchesMobilePhone &&
        matchesAddress &&
        matchesCep &&
        matchesCity &&
        matchesState &&
        matchesRole &&
        matchesClientName
      );
    });
  }, [representativesList, filters]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleDelete = (representative: IRepresentative) => {
    setSelectedRepresentative(representative);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedRepresentative) {
      try {
        await deleteRepresentative(selectedRepresentative.id);
        // Atualiza o cache local em vez de recarregar a página
        removeRepresentativeFromCache(selectedRepresentative.id);
        setOpenDeleteModal(false);
        setSelectedRepresentative(null);
        notifySuccess("Sucesso!", "Representante excluído com sucesso!");
      } catch (error) {
        logger.error("Erro ao excluir representante:", error);
        notifyError(
          "Não foi possível excluir o representante",
          error
        );
      }
    }
  };

  const isEmpty = !loading && filteredRepresentativesList.length === 0;
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Representantes"
          description="Gerencie os representantes: busque, edite ou exclua registros."
          icon={PersonAdd}
          actionLabel="Adicionar representante"
          onAction={handleOpen}
        />
        <RepresentativesFilter
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              name: "",
              email: "",
              phone: "",
              mobilePhone: "",
              cep: "",
              address: "",
              city: "",
              state: "",
              role: "",
              clientName: "",
            })
          }
        />
        {loading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          hasActiveFilters ? (
            <EmptyState
              title="Nenhum representante encontrado"
              description="Nenhum representante corresponde aos filtros aplicados."
            />
          ) : (
            <EmptyState
              title="Nenhum representante cadastrado"
              description="Comece cadastrando o primeiro representante."
              icon={PersonAdd}
              actionLabel="Cadastrar representante"
              onAction={handleOpen}
            />
          )
        ) : (
          <RepresentativeTable
            rows={filteredRepresentativesList}
            onDelete={handleDelete}
          />
        )}
      </Box>

      {/* Modal de criação de representante */}
      <CreateRepresentativeModal open={openModal} handleClose={handleClose} />

      {/* Modal de exclusão de representante */}
      <DeleteRepresentativeModal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        representative={selectedRepresentative}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default Representatives;

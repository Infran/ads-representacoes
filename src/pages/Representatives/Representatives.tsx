import { useState, useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import CreateRepresentativeModal from "../../components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal";
import { PersonAdd } from "@mui/icons-material";
import { IRepresentative } from "../../interfaces/irepresentative";
import { deleteRepresentative } from "../../services/representativeServices";
import SearchBar from "../../components/SearchBar/SearchBar";
import DeleteRepresentativeModal from "../../components/Modal/Delete/DeleteRepresentativeModal";
import RepresentativeTable from "../../components/Tables/RepresentativeTable/RepresentativeTable";
import { useData } from "../../context/DataContext";

const Representatives = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepresentative, setSelectedRepresentative] =
    useState<IRepresentative | null>(null);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const {
    representatives: representativesList,
    loading,
    removeRepresentativeFromCache,
  } = useData();

  // Filtragem local dos representantes
  const filteredRepresentativesList = useMemo(() => {
    if (!searchTerm) return representativesList;

    return representativesList.filter((representative) => {
      return (
        representative.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.email
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        representative.phone
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        representative.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [representativesList, searchTerm]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleEdit = (id: string) => {
    console.log("Editando representante com ID:", id);
  };

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
      } catch (error) {
        console.error("Erro ao excluir representante:", error);
      }
    }
  };

  const handleSearch = () => {
    // A filtragem já é feita pelo useMemo, então não precisa fazer nada aqui
    // Mantido para compatibilidade com SearchBar
  };

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Representantes"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Representante."
          icon={PersonAdd}
        />
        <SearchBar
          search={searchTerm}
          onSearchChange={(e) => setSearchTerm(e.target.value)}
          onSearch={handleSearch}
          onAdd={handleOpen}
          inputLabel="Digite o nome do representante"
        />
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={200}
          >
            Carregando... <CircularProgress />
          </Box>
        ) : (
          <RepresentativeTable
            rows={filteredRepresentativesList}
            onEdit={handleEdit}
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

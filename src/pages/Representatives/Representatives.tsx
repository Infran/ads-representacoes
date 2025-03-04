import { useEffect, useState } from 'react';
import { Box, CircularProgress } from '@mui/material';
import PageHeader from './../../components/PageHeader/PageHeader';
import CreateRepresentativeModal from '../../components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal';
import { PersonAdd } from '@mui/icons-material';
import { IRepresentative } from '../../interfaces/irepresentative';
import { getRepresentatives, deleteRepresentative } from '../../services/representativeServices';
import SearchBar from '../../components/SearchBar/SearchBar';
import DeleteRepresentativeModal from '../../components/Modal/Delete/DeleteRepresentativeModal';
import RepresentativeTable from '../../components/Tables/RepresentativeTable/RepresentativeTable';

const Representatives = () => {
  const [openModal, setOpenModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [representativesList, setRepresentativesList] = useState<IRepresentative[]>([]);
  const [filteredRepresentativesList, setFilteredRepresentativesList] = useState<IRepresentative[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRepresentative, setSelectedRepresentative] = useState<IRepresentative | null>(null);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleEdit = (id: string) => {
    console.log('Editando representante com ID:', id);
  };

  const handleDelete = (representative: IRepresentative) => {
    setSelectedRepresentative(representative); // Define o representante selecionado
    setOpenDeleteModal(true); // Abre o modal de exclusão
  };

  const handleConfirmDelete = async () => {
    if (selectedRepresentative) {
      try {
        await deleteRepresentative(selectedRepresentative.id); // Exclui o representante
        setRepresentativesList((prev) => prev.filter((r) => r.id !== selectedRepresentative.id)); // Atualiza a lista de representantes
        setFilteredRepresentativesList((prev) => prev.filter((r) => r.id !== selectedRepresentative.id)); // Atualiza a lista filtrada
        setOpenDeleteModal(false); // Fecha o modal
      } catch (error) {
        console.error('Erro ao excluir representante:', error);
      }
    }
  };

  const handleSearch = () => {
    const filtered = representativesList.filter((representative) => {
      return (
        representative.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        representative.address?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
    setFilteredRepresentativesList(filtered);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const representatives = await getRepresentatives();
        setRepresentativesList(representatives);
        setFilteredRepresentativesList(representatives);
      } catch (error) {
        console.error('Erro ao buscar representantes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            Carregando... <CircularProgress />
          </Box>
        ) : (
          <RepresentativeTable rows={filteredRepresentativesList} onEdit={handleEdit} onDelete={handleDelete} />
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
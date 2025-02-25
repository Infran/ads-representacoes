import { Box, Button, Paper, TextField, useMediaQuery, useTheme } from '@mui/material';
import { styled } from '@mui/system';
import PageHeader from '../../components/PageHeader/PageHeader';
import { Search, PersonAdd } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import { getRepresentatives } from '../../services/representativeServices';
import { IRepresentative } from '../../interfaces/irepresentative';
import RepresentativeTable from '../../components/Tables/RepresentativeTable/RepresentativeTable';
import CreateRepresentativeModal from '../../components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal';

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

const Representatives = () => {
  const [openModal, setOpenModal] = useState(false);
  const [representatives, setRepresentatives] = useState<IRepresentative[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const isSmallScreen = useMediaQuery(useTheme().breakpoints.down('sm'));

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const representativeList = await getRepresentatives();
        setRepresentatives(representativeList);
      } catch (error) {
        console.error('Erro ao buscar representantes:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const onEdit = (id: string) => {
    console.log('Editar representante:', id);
  };

  const onDelete = (id: string) => {
    console.log('Deletar representante:', id);
  };

  // Filtra os representantes com base no termo de busca
  const filteredRepresentatives = representatives.filter((representative) =>
    representative.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Representantes"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Representante."
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
                label="Digite o nome do representante"
                variant="outlined"
                size="small"
                fullWidth
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Box>
          </Box>
        </StyledPaper>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={200}>
            Carregando...
          </Box>
        ) : (
          <RepresentativeTable rows={filteredRepresentatives} onEdit={onEdit} onDelete={onDelete}  />
        )}
      </Box>

      <CreateRepresentativeModal open={openModal} handleClose={handleClose} />
    </>
  );
};

export default Representatives;
import {FC, useState} from 'react';
import CustomTable from '../CustomTable/CustomTable';
import { IRepresentative} from '../../../interfaces/irepresentative';
import { GridColDef } from '@mui/x-data-grid';
import EditRepresentativeModal from '../../Modal/Edit/EditRepresentativeModal/EditRepresentativeModal';

interface RepresentativeTableProps {
  rows: IRepresentative[];
  onEdit: (id: string) => void;
  onDelete: (representative: IRepresentative) => void
}

const columns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 50,
    sortable: true,
    filterable: true,
    editable: false,
  },
  {
    field: 'name',
    headerName: 'Nome',
    width: 220,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 1,
    headerClassName: 'data-grid-header',
  },
  {
    field: 'email',
    headerName: 'Email',
    width: 250,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 1,
    headerClassName: 'data-grid-header',
  },
  {
    field: 'mobilePhone',
    headerName: 'Celular',
    width: 200,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 1,
    headerClassName: 'data-grid-header',
  },
  {
    field: 'phone',
    headerName: 'Telefone',
    width: 200,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 1,
    headerClassName: 'data-grid-header',
  },
  {
    field: 'client',
    headerName: 'Cliente',
    width: 200,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 2,
    renderCell: (params) => <span>{params.row.client?.name}</span>,
  },
  {
    field: 'address',
    headerName: 'Endereço',
    width: 200,
    sortable: true,
    filterable: true,
    editable: false,
    flex: 2,
    headerClassName: 'data-grid-header',
  },
];

const RepresentativeTable: FC<RepresentativeTableProps> = ({ rows, onDelete }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
const [selectedRepresentativeId, setSelectedRepresentativeId] = useState<string | null>(null);

const handleEdit = (id: string) => {
  setSelectedRepresentativeId(id);
  setIsEditModalOpen(true);
};

const handleCloseEditModal = () => {
  setIsEditModalOpen(false);
  setSelectedRepresentativeId(null);
};

return (
  <>
    {/* Tabela de representantes com botão de edição */}
    <CustomTable
      rows={rows}
      columns={columns}
      onEdit={handleEdit} // Passa a função de edição
      onDelete={onDelete}
    />

    {/* Modal de edição */}
    {selectedRepresentativeId && (
      <EditRepresentativeModal
        open={isEditModalOpen}
        handleClose={handleCloseEditModal}
        id={selectedRepresentativeId} 
      />
    )}
  </>
);
};

export default RepresentativeTable;
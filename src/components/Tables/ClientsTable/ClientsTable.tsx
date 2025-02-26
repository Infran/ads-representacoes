import { FC, useState } from "react";
import CustomTable from "../CustomTable/CustomTable";
import { IClient } from "../../../interfaces/iclient";
import { GridColDef } from "@mui/x-data-grid";
import EditClientModal from "../../Modal/Edit/EditClientModal/EditClientModal";

interface ClientsTableProps {
  rows: IClient[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    sortable: true,
    filterable: true,
    flex: 1,
  },
  {
    field: "name",
    headerName: "Nome",
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "email",
    headerName: "Email",
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "mobilePhone",
    headerName: "Celular",
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
    flex: 1,
    renderCell: (params) => {
      const phone = params.value;
      const formattedPhone = phone ? phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3") : "❌";
      return <span>{formattedPhone}</span>;
    },
  },
  {
    field: "phone",
    headerName: "Telefone",
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "address",
    headerName: "Endereço",
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
];

export const ClientsTable: FC<ClientsTableProps> = ({ rows, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar a abertura do modal
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // Estado para armazenar o ID do cliente selecionado

  // Função para abrir o modal de edição
  const handleEdit = (id: string) => {
    setSelectedClientId(id); // Define o ID do cliente selecionado
    setIsModalOpen(true); // Abre o modal
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setIsModalOpen(false); // Fecha o modal
    setSelectedClientId(null); // Limpa o ID do cliente selecionado
  };

  return (
    <>
      {/* Tabela de clientes */}
      <CustomTable
        rows={rows}
        columns={columns}
        onEdit={handleEdit} // Passa a função de edição
        onDelete={onDelete}
      />

      {/* Modal de edição */}
      {selectedClientId && (
        <EditClientModal
          open={isModalOpen}
          handleClose={handleCloseModal}
          id={selectedClientId}
          
        />
      )}
    </>
  );
};
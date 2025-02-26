import { FC, useState } from "react";
import CustomTable from "../CustomTable/CustomTable";
import { GridColDef } from "@mui/x-data-grid";
import { IProduct } from "../../../interfaces/iproduct";
import EditProductModal from "../../Modal/Edit/EditProductModal/EditProductModal";

interface ProductTableProps {
  rows: IProduct[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    width: 200,
    sortable: true,
    filterable: true,
    flex: 1,
  },
  {
    field: "name",
    headerName: "Produto",
    width: 220,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "description",
    headerName: "Descrição",
    width: 400,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "ncm",
    headerName: "NCM",
    width: 200,
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "quantity",
    headerName: "Quantidade",
    width: 200,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  {
    field: "unitValue",
    headerName: "Valor (Unit)",
    width: 230,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
    flex: 1,
  },
];

export const ProductTable: FC<ProductTableProps> = ({ rows, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    setSelectedProductId(id);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
  };


  return (
    <>
      {/* Tabela de produtos com botão de edição */}
      <CustomTable
        rows={rows}
        columns={columns}
        onEdit={handleEdit} // Passa a função de edição
        onDelete={onDelete}
      />
  
      {/* Modal de edição */}
      {selectedProductId && (
        <EditProductModal
          open={isModalOpen}
          handleClose={handleCloseModal}
          id={selectedProductId}
        />
      )}
    </>
  );
};
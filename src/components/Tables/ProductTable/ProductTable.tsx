import { FC, useState } from "react";
import CustomTable from "../CustomTable/CustomTable";
import { GridColDef } from "@mui/x-data-grid";
import { IProduct } from "../../../interfaces/iproduct";
import EditProductModal from "../../Modal/Edit/EditProductModal/EditProductModal";
import { brMoneyMask, moneyFormatter } from "../../../utils/Masks";

interface ProductTableProps {
  rows: IProduct[];
  onEdit: (id: string) => void;
  onDelete: (product: IProduct) => void;
}

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    sortable: true,
    filterable: true,
    editable: false,
  },
  {
    field: "name",
    headerName: "Produto",
    sortable: true,
    filterable: true,
    editable: false,
    headerClassName: "data-grid-header",
    flex: 2,
  },
  {
    field: "description",
    headerName: "Descrição",
    sortable: true,
    filterable: true,
    editable: false,
    headerClassName: "data-grid-header",
    flex: 2,
  },
  {
    field: "ncm",
    headerName: "NCM",
    sortable: true,
    filterable: true,
    editable: false,
    headerClassName: "data-grid-header",
    flex: 1,
  },
  // {
  //   field: "quantity",
  //   headerName: "Quantidade",
  //   width: 200,
  //   sortable: true,
  //   filterable: true,
  //   editable: false,
  //   headerClassName: "data-grid-header",
  //   flex: 1,
  // },
  {
    field: "unitValue",
    headerName: "Valor (Unit)",
    sortable: true,
    filterable: true,
    editable: false,
    headerClassName: "data-grid-header",
    flex: 1,
    renderCell: (params) => {
      const value = params.value;
      return <span>R$ {brMoneyMask(value.toString())}</span>;
    }
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
import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC } from "react";
import { ProductModel } from "../../models/product.model";

interface DataTableProps {
  rows: ProductModel[];
}

const columns: GridColDef[] = [
  {
    field: "id",
    headerName: "ID",
    width: 200,
    sortable: true,
    filterable: true,
  },
  {
    field: "name",
    headerName: "Produto",
    width: 220,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "description",
    headerName: "Descrição",
    width: 400,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "ncm",
    headerName: "NCM",
    width: 200,
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "quantity",
    headerName: "Quantidade",
    width: 200,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "unitValue",
    headerName: "Valor (Unit)",
    width: 230,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
];

export const ProductTable: FC<DataTableProps> = (props) => {
  return (
    <div
      style={{
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        padding: "16px",
      }}
    >
      <DataGrid
        rows={props.rows}
        columns={columns}
        style={{
          fontSize: "16px",
          backgroundColor: "white",
          borderRadius: "8px",
        }}
        sx={{
          "& .MuiDataGrid-cell": {
            fontSize: "14px",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#f0f0f0",
            fontWeight: "bold",
          },
          "& .data-grid-header": {
            color: "#333",
          },
          "& .MuiDataGrid-footerContainer": {
            backgroundColor: "#f0f0f0",
          },
        }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "name", sort: "asc" }],
          },
          filter: {
            filterModel: {
              items: [],
            },
          },
        }}
        pageSizeOptions={[5, 10, 20]}
        disableColumnFilter={false}
        disableColumnSelector={false}
        disableDensitySelector={false}
        disableAutosize={false}
      />
    </div>
  );
};

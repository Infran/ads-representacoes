import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC } from "react";
import { ProductModel } from "../../models/product.model";

interface DataTableProps {
  rows: ProductModel[];
}

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 200, sortable: true, filterable: true },
  { field: "name", headerName: "Produto", width: 220, sortable: true, filterable: true, editable: true },
  { field: "description", headerName: "Descrição", width: 400, sortable: true, filterable: true, editable: true },
  { field: "ncm", headerName: "NCM", width: 200, sortable: true, filterable: true },
  { field: "icms", headerName: "%ICMS", width: 200, sortable: true, filterable: true },
  { field: "quantity", headerName: "Quantidade", width: 200, sortable: true, filterable: true, editable: true },
  { field: "unitValue", headerName: "Valor(Unit)", width: 230, sortable: true, filterable: true, editable: true },
  { field: "total", headerName: "Total", width: 230, sortable: true, filterable: true },
];

export const DataTable:FC<DataTableProps> = (props) => {
  return (
    <div style={{ height: 600, width: "" }}>
      <DataGrid
        rows={props.rows}
        columns={columns}
        style={{ fontSize: "20px" }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "product", sort: "asc" }],
          },
          filter: {
            filterModel: {
              items: [],
            },
          },
        }}
        pageSizeOptions={[5, 10]}
        disableColumnFilter={false}
        disableColumnSelector={false}
        disableDensitySelector={false}
        disableAutosize={false}
      />
    </div>
  );
}



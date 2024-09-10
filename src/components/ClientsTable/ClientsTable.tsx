import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC } from "react";
import { ClientModel } from "../../models/client.model";
import { IClient } from "../../interfaces/icliente";

interface DataTableProps {
  rows: IClient[];
}

const columns: GridColDef[] = [
  { field: "id", headerName: "ID", width: 200, sortable: true, filterable: true },
  { field: "name", headerName: "Nome", width: 220, sortable: true, filterable: true, editable: true },
  { field: "email", headerName: "Email", width: 400, sortable: true, filterable: true, editable: true },
  { field: "celular", headerName: "Celular", width: 200, sortable: true, filterable: true },
  { field: "phone", headerName: "Telefone", width: 200, sortable: true, filterable: true },
  { field: "address", headerName: "Endereço", width: 200, sortable: true, filterable: true },
  { field: "cidade", headerName: "Cidade", width: 200, sortable: true, filterable: true },
  { field: "estado", headerName: "Estado", width: 200, sortable: true, filterable: true },
];

export const ClientsTable:FC<DataTableProps> = (props) => {
  return (
    <div style={{ height: 600 }}>
      <DataGrid
        rows={props.rows}
        columns={columns}
        style={{ fontSize: "20px" }}
        initialState={{
          pagination: {
            paginationModel: { page: 0, pageSize: 10 },
          },
          sorting: {
            sortModel: [{ field: "nome", sort: "asc" }],
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
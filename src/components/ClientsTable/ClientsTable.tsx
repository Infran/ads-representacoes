import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC } from "react";
import { IClient } from "../../interfaces/iclient";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

interface DataTableProps {
  rows: IClient[];
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
  },
  {
    field: "name",
    headerName: "Nome",
    width: 220,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "email",
    headerName: "Email",
    width: 400,
    sortable: true,
    filterable: true,
    editable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "mobilePhone",
    headerName: "Celular",
    width: 200,
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "phone",
    headerName: "Telefone",
    width: 200,
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "address",
    headerName: "Endereço",
    width: 200,
    sortable: true,
    filterable: true,
    headerClassName: "data-grid-header",
  },
  {
    field: "actions",
    headerName: "",
    width: 150,
    sortable: false,
    filterable: false,
    renderCell: (params) => {
      const handleEdit = () => {
        params.row.onEdit(params.id);
      };

      const handleDelete = () => {
        params.row.onDelete(params.id);
      };

      return (
        <div style={{ display: "flex", gap: "8px" }}>
          <Tooltip title="Editar">
            <IconButton size="small" onClick={handleEdit}>
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Deletar">
            <IconButton size="small" onClick={handleDelete}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        </div>
      );
    },
  },
];

export const ClientsTable: FC<DataTableProps> = (props) => {
  return (
    <div
      style={{
        height: 600,
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
        boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)",
        padding: "16px",
      }}
    >
      <DataGrid
        rows={props.rows.map((row) => ({
          ...row,
          onEdit: props.onEdit,
          onDelete: props.onDelete,
        }))}
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

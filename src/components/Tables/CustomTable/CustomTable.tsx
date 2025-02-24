import { DataGrid, GridColDef } from "@mui/x-data-grid";
import { FC } from "react";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";

interface CustomTableProps {
  rows: any[]; // Linhas da tabela (genérico)
  columns: GridColDef[]; // Colunas da tabela
  onEdit?: (id: string) => void; // Função de edição (opcional)
  onDelete?: (id: string) => void; // Função de exclusão (opcional)
  pageSizeOptions?: number[]; // Opções de tamanho de página
  initialState?: {
    pagination?: {
      paginationModel: { page: number; pageSize: number };
    };
    sorting?: {
      sortModel: { field: string; sort: "asc" | "desc" }[];
    };
    filter?: {
      filterModel: {
        items: any[];
      };
    };
  };
}

const CustomTable: FC<CustomTableProps> = ({
  rows,
  columns,
  onEdit,
  onDelete,
  pageSizeOptions = [5, 10, 20],
  initialState = {
    pagination: { paginationModel: { page: 0, pageSize: 10 } },
    sorting: { sortModel: [{ field: "name", sort: "asc" }] },
    filter: { filterModel: { items: [] } },
  },
}) => {
  // Adiciona coluna de ações se onEdit ou onDelete estiverem definidos
  const actionColumn: GridColDef = {
    field: "actions",
    headerName: "",
    width: 150,
    sortable: false,
    filterable: false, 
    display: "flex",
    renderCell: (params) => {
      return (
        <div style={{ display: "flex", gap: "8px" }}>
          {onEdit && (
            <Tooltip title="Editar">
              <IconButton size="small" onClick={() => onEdit(params.id.toString())}>
                <EditIcon fontSize="small" color="primary" />
              </IconButton>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Deletar">
              <IconButton size="small" onClick={() => onDelete(params.id.toString())}>
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Tooltip>
          )}
        </div>
      );
    },
  };

  // Adiciona a coluna de ações às colunas existentes, se necessário
  const finalColumns = onEdit || onDelete ? [...columns, actionColumn] : columns;

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
        rows={rows}
        columns={finalColumns}
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
        initialState={initialState}
        localeText={ {
          noRowsLabel: 'Nenhum registro encontrado',
          footerTotalRows: 'Total de registros: ',
        }
        }
        pageSizeOptions={pageSizeOptions}
        disableColumnFilter={false}
        disableColumnSelector={false}
        disableDensitySelector={false}
        disableAutosize={false}
      />
    </div>
  );
};

export default CustomTable;
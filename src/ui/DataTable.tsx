import { ReactElement } from "react";
import {
  DataGrid,
  GridColDef,
  GridValidRowModel,
  GridInitialState,
} from "@mui/x-data-grid";
import { Box, IconButton, Tooltip } from "@mui/material";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";

export interface DataTableProps<T extends GridValidRowModel> {
  rows: T[];
  columns: GridColDef<T>[];
  onEdit?: (id: string) => void;
  onDelete?: (row: T) => void;
  pageSizeOptions?: number[];
  initialState?: GridInitialState;
  /** Altura do container (px). Padrão 600. */
  height?: number;
  loading?: boolean;
}

const DEFAULT_INITIAL_STATE: GridInitialState = {
  pagination: { paginationModel: { page: 0, pageSize: 10 } },
  sorting: { sortModel: [{ field: "name", sort: "asc" }] },
  filter: { filterModel: { items: [] } },
};

/**
 * Tabela genérica tokenizada (UI U2.1) sobre o DataGrid do MUI-X.
 * Tipada (`<T>` — sem `any`), superfície e cabeçalho vindos do tema (sem hex),
 * coluna de ações opcional (editar/excluir). Substitui o `CustomTable`.
 */
function DataTable<T extends GridValidRowModel>({
  rows,
  columns,
  onEdit,
  onDelete,
  pageSizeOptions = [5, 10, 20],
  initialState = DEFAULT_INITIAL_STATE,
  height = 600,
  loading = false,
}: DataTableProps<T>): ReactElement {
  const actionColumn: GridColDef<T> = {
    field: "actions",
    headerName: "",
    width: 120,
    sortable: false,
    filterable: false,
    display: "flex",
    renderCell: (params) => (
      <Box sx={{ display: "flex", gap: 1 }}>
        {onEdit && (
          <Tooltip title="Editar">
            <IconButton
              size="small"
              onClick={() => onEdit(params.id.toString())}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        )}
        {onDelete && (
          <Tooltip title="Excluir">
            <IconButton size="small" onClick={() => onDelete(params.row)}>
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    ),
  };

  const finalColumns =
    onEdit || onDelete ? [...columns, actionColumn] : columns;

  return (
    <Box
      sx={{
        height,
        p: 2,
        bgcolor: "background.paper",
        borderRadius: 3,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: 1,
      }}
    >
      <DataGrid
        rows={rows}
        columns={finalColumns}
        loading={loading}
        initialState={initialState}
        pageSizeOptions={pageSizeOptions}
        localeText={{
          noRowsLabel: "Nenhum registro encontrado",
          footerTotalRows: "Total de registros: ",
        }}
        sx={{
          border: "none",
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "background.default",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 700,
          },
          "& .MuiDataGrid-footerContainer": {
            bgcolor: "background.default",
          },
        }}
      />
    </Box>
  );
}

export default DataTable;

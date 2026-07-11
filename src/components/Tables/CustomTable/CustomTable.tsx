import { GridColDef, GridValidRowModel, GridInitialState } from "@mui/x-data-grid";
import DataTable from "../../../ui/DataTable";

/**
 * @deprecated Use `src/ui/DataTable` diretamente. Mantido como wrapper fino
 * (UI U2.1) para não alterar os 3 consumidores (Clients/Product/Representative
 * Table). A tabela tokenizada e tipada agora vive em `src/ui/DataTable`.
 */
interface CustomTableProps<T extends GridValidRowModel> {
  rows: T[];
  columns: GridColDef<T>[];
  onEdit?: (id: string) => void;
  onDelete?: (row: T) => void;
  pageSizeOptions?: number[];
  initialState?: GridInitialState;
}

function CustomTable<T extends GridValidRowModel>(props: CustomTableProps<T>) {
  return <DataTable {...props} />;
}

export default CustomTable;

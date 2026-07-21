import { FC, useState, useEffect, useCallback, useMemo } from "react";
import { Box, Typography, Tooltip, IconButton } from "@mui/material";
import { DeleteSweep, RestoreFromTrash, DeleteForever } from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  DataTable,
  Button,
  Card,
  TableSkeleton,
  ErrorState,
  EmptyState,
  confirmDialog,
  notifySuccess,
  notifyError,
  notifyWarning,
} from "../../ui";
import {
  listBin,
  purgeBinItem,
  purgeExpiredBinItems,
} from "../../services/binService";
import { restoreFromBin } from "../../services/restoreService";
import { useData } from "../../context/DataContext";
import { logger } from "../../utils/logger";
import {
  BIN_ENTITIES,
  BIN_ENTITY_LABELS,
  BIN_RETENTION_DAYS,
  BinEntity,
  IBinItem,
} from "../../interfaces/ibin";
import AdminNav from "./AdminNav";
import { formatDateTime } from "./auditFormat";

const AdminTrash: FC = () => {
  const [items, setItems] = useState<IBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const {
    refreshClients,
    refreshProducts,
    refreshRepresentatives,
    refreshBudgets,
  } = useData();

  const refreshFor = useMemo(
    (): Record<BinEntity, () => Promise<void>> => ({
      clients: refreshClients,
      products: refreshProducts,
      representatives: refreshRepresentatives,
      budgets: refreshBudgets,
    }),
    [refreshClients, refreshProducts, refreshRepresentatives, refreshBudgets]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Quatro leituras (uma por subcoleção) em paralelo. Com o volume deste
      // app sai mais barato que manter um índice de collectionGroup.
      const pages = await Promise.all(BIN_ENTITIES.map((e) => listBin(e)));
      setItems(
        pages
          .flat()
          .sort(
            (a, b) =>
              (b.deletedAt?.toMillis?.() ?? 0) - (a.deletedAt?.toMillis?.() ?? 0)
          )
      );
    } catch (err) {
      logger.error("[AdminTrash] falha ao carregar a lixeira:", err);
      setError(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRestore = async (item: IBinItem) => {
    const confirmed = await confirmDialog({
      title: "Restaurar registro?",
      text: `Este registro será recriado com o ID ${item.originalId}. Cópias já gravadas dentro de orçamentos não serão alteradas.`,
      confirmText: "Restaurar",
      cancelText: "Cancelar",
      icon: "question",
    });
    if (!confirmed) return;

    setBusyId(item.id);
    try {
      const result = await restoreFromBin(item);

      if (!result.ok) {
        // Recusa prevista (ID ocupado, dados inconsistentes) não é exceção —
        // é um aviso com motivo explícito.
        await notifyWarning("Não foi possível restaurar", result.message);
        return;
      }

      // `refresh` em vez de `add*ToCache`: uma leitura extra numa operação
      // quase-nunca compra uma lista garantidamente verdadeira.
      await refreshFor[item.entity]();
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      await notifySuccess(
        "Registro restaurado",
        `${BIN_ENTITY_LABELS[item.entity]} ${item.originalId} voltou para a lista.`
      );
    } catch (err) {
      logger.error("[AdminTrash] falha ao restaurar:", err);
      await notifyError("Erro ao restaurar o registro", err);
    } finally {
      setBusyId(null);
    }
  };

  /**
   * Descarte definitivo. Sem isto a lixeira só crescia: um cliente "excluído"
   * mantinha CNPJ, endereço e telefone no Firestore para sempre — uma decisão
   * de retenção que precisa ser do usuário, não um efeito colateral.
   */
  const handlePurge = async (item: IBinItem) => {
    const confirmed = await confirmDialog({
      title: "Excluir definitivamente?",
      text: `${BIN_ENTITY_LABELS[item.entity]} ${item.originalId} — "${item.label}" será apagado de vez. Esta ação NÃO pode ser desfeita.`,
      confirmText: "Excluir definitivamente",
      cancelText: "Cancelar",
      icon: "warning",
    });
    if (!confirmed) return;

    setBusyId(item.id);
    try {
      await purgeBinItem(item.entity, item.id);
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      await notifySuccess(
        "Registro descartado",
        "O item foi removido da lixeira permanentemente."
      );
    } catch (err) {
      logger.error("[AdminTrash] falha ao descartar:", err);
      await notifyError("Erro ao descartar o registro", err);
    } finally {
      setBusyId(null);
    }
  };

  const handlePurgeExpired = async () => {
    const confirmed = await confirmDialog({
      title: "Expurgar itens vencidos?",
      text: `Itens excluídos há mais de ${BIN_RETENTION_DAYS} dias serão apagados de vez. Esta ação NÃO pode ser desfeita.`,
      confirmText: "Expurgar",
      cancelText: "Cancelar",
      icon: "warning",
    });
    if (!confirmed) return;

    setBusyId("__purge__");
    try {
      const removed = await purgeExpiredBinItems();
      await notifySuccess(
        "Expurgo concluído",
        removed === 0
          ? "Nenhum item vencido foi encontrado."
          : `${removed} item(ns) vencido(s) removido(s).`
      );
      await load();
    } catch (err) {
      logger.error("[AdminTrash] falha ao expurgar:", err);
      await notifyError("Não foi possível expurgar a lixeira", err);
    } finally {
      setBusyId(null);
    }
  };

  const columns: GridColDef<IBinItem>[] = [
    {
      field: "deletedAt",
      headerName: "Excluído em",
      width: 150,
      valueGetter: (_v, row) => formatDateTime(row.deletedAt),
    },
    {
      field: "entity",
      headerName: "Tipo",
      width: 140,
      valueGetter: (_v, row) => BIN_ENTITY_LABELS[row.entity] ?? row.entity,
    },
    { field: "originalId", headerName: "ID", width: 90 },
    { field: "label", headerName: "Registro", flex: 1, minWidth: 200 },
    { field: "deletedByEmail", headerName: "Excluído por", width: 200 },
    {
      field: "expiresAt",
      headerName: "Vence em",
      width: 130,
      valueGetter: (_v, row) =>
        row.expiresAt ? formatDateTime(row.expiresAt) : "sem prazo",
    },
    {
      field: "actions",
      headerName: "",
      width: 200,
      sortable: false,
      filterable: false,
      display: "flex",
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="Restaurar este registro">
            <span>
              <Button
                size="small"
                variant="outlined"
                startIcon={<RestoreFromTrash />}
                disabled={busyId !== null}
                onClick={() => handleRestore(params.row)}
              >
                Restaurar
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="Excluir definitivamente (não pode ser desfeito)">
            <span>
              <IconButton
                size="small"
                color="error"
                disabled={busyId !== null}
                onClick={() => handlePurge(params.row)}
              >
                <DeleteForever fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Lixeira"
        description="Registros excluídos, com o conteúdo original preservado para restauração."
        icon={DeleteSweep}
      />
      <AdminNav />

      {loading ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar a lixeira"
          message="A leitura falhou. Confirme se o seu usuário tem papel de administrador."
          onRetry={load}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="A lixeira está vazia"
          description="Registros excluídos passam por aqui antes de sumirem de vez — e podem ser restaurados com o mesmo ID."
          icon={DeleteSweep}
        />
      ) : (
        <>
          <DataTable
            rows={items}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 25 } },
              sorting: { sortModel: [] },
            }}
          />
          <Card>
            <Typography variant="body2" color="text.secondary">
              A restauração devolve o registro com o ID original — o contador de
              IDs nunca regride, então não há risco de colisão com um cadastro
              novo. Dados de cliente e representante já copiados para dentro de
              orçamentos existentes permanecem como estavam na época.
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Itens excluídos ficam aqui por {BIN_RETENTION_DAYS} dias. Depois
              disso podem ser expurgados — e o expurgo remove apenas os já
              vencidos.
            </Typography>
            <Box mt={1.5}>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteForever />}
                disabled={busyId !== null}
                onClick={handlePurgeExpired}
              >
                Expurgar itens vencidos
              </Button>
            </Box>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AdminTrash;

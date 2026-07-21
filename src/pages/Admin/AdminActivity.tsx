import { FC, useMemo, useState } from "react";
import { Box, Typography, Drawer, Divider, Chip, Alert } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { History } from "@mui/icons-material";
import { GridColDef } from "@mui/x-data-grid";
import PageHeader from "../../components/PageHeader/PageHeader";
import { DataTable, Button, TableSkeleton, ErrorState, EmptyState } from "../../ui";
import CockpitFilterBar from "../../components/Cockpit/CockpitFilterBar";
import { useCockpit } from "../../components/Cockpit/useCockpit";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { IAuditLog } from "../../interfaces/iaudit";
import { BIN_ENTITIES } from "../../interfaces/ibin";
import AdminNav from "./AdminNav";
import {
  AuditFilters,
  EMPTY_AUDIT_FILTERS,
  applyAuditFilters,
  actionLabel,
  entityLabel,
  formatDateTime,
} from "./auditFormat";

/** Pílula de status no idioma visual do app (sem hex, tom via alpha). */
const StatusPill: FC<{ status: string }> = ({ status }) => {
  const ok = status === "success";
  return (
    <Box
      component="span"
      sx={{
        px: 1,
        py: 0.25,
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 600,
        color: ok ? "success.main" : "error.main",
        bgcolor: (t) =>
          alpha(ok ? t.palette.success.main : t.palette.error.main, 0.1),
      }}
    >
      {ok ? "Sucesso" : "Falha"}
    </Box>
  );
};

const AdminActivity: FC = () => {
  const { logs, loading, error, hasMore, loadMore, reload } = useAuditLogs(50);
  const { filters, patchFilters, resetFilters } =
    useCockpit<AuditFilters>(EMPTY_AUDIT_FILTERS);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<IAuditLog | null>(null);

  const filtered = useMemo(
    () => applyAuditFilters(logs, filters, search),
    [logs, filters, search]
  );

  const actorOptions = useMemo(
    () => [...new Set(logs.map((l) => l.actorEmail).filter(Boolean))].sort(),
    [logs]
  );

  const columns: GridColDef<IAuditLog>[] = [
    {
      field: "at",
      headerName: "Quando",
      width: 150,
      valueGetter: (_v, row) => formatDateTime(row.at),
    },
    {
      field: "action",
      headerName: "Ação",
      width: 120,
      valueGetter: (_v, row) => actionLabel(row.action),
    },
    {
      field: "entity",
      headerName: "Tipo",
      width: 130,
      valueGetter: (_v, row) => entityLabel(row.entity),
    },
    { field: "label", headerName: "Registro", flex: 1, minWidth: 200 },
    { field: "actorEmail", headerName: "Usuário", width: 200 },
    {
      field: "status",
      headerName: "Status",
      width: 110,
      renderCell: (params) => <StatusPill status={params.row.status} />,
    },
    {
      // Coluna própria em vez do `onEdit` do DataTable: aquele renderiza um
      // ícone de lápis com tooltip "Editar", que mentiria — o registro de
      // auditoria é append-only e esta ação só abre o detalhe.
      field: "details",
      headerName: "",
      width: 110,
      sortable: false,
      filterable: false,
      display: "flex",
      renderCell: (params) => (
        <Button
          size="small"
          variant="text"
          onClick={() => setSelected(params.row)}
        >
          Detalhes
        </Button>
      ),
    },
  ];

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Registro de atividades"
        description="Tudo que foi criado, editado e excluído — por quem e quando."
        icon={History}
      />
      <AdminNav />

      {loading && logs.length === 0 ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar as atividades"
          message="A leitura do registro falhou. Confirme se o seu usuário tem papel de administrador."
          onRetry={reload}
        />
      ) : logs.length === 0 ? (
        <EmptyState
          title="Nenhuma atividade registrada"
          description="As ações passam a aparecer aqui assim que houver cadastros, edições ou exclusões."
          icon={History}
        />
      ) : (
        <>
          <CockpitFilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Buscar por registro, usuário ou mensagem…"
            selects={[
              {
                key: "action",
                label: "Ação",
                value: filters.action,
                placeholder: "Todas",
                allLabel: "Todas as ações",
                options: ["create", "update", "delete", "restore", "error"],
                formatOption: actionLabel,
                onPick: (value) => patchFilters({ action: value }),
              },
              {
                key: "entity",
                label: "Tipo",
                value: filters.entity,
                placeholder: "Todos",
                allLabel: "Todos os tipos",
                options: [...BIN_ENTITIES, "app"],
                formatOption: entityLabel,
                onPick: (value) => patchFilters({ entity: value }),
              },
              {
                key: "status",
                label: "Status",
                value: filters.status,
                placeholder: "Todos",
                allLabel: "Todos os status",
                options: ["success", "failure"],
                formatOption: (v) => (v === "success" ? "Sucesso" : "Falha"),
                onPick: (value) => patchFilters({ status: value }),
              },
              {
                key: "actor",
                label: "Usuário",
                value: filters.actor,
                placeholder: "Todos",
                allLabel: "Todos os usuários",
                options: actorOptions,
                width: 220,
                onPick: (value) => patchFilters({ actor: value }),
              },
            ]}
            toggles={[]}
            onReset={() => {
              resetFilters();
              setSearch("");
            }}
          />

          <DataTable
            rows={filtered}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: { paginationModel: { page: 0, pageSize: 25 } },
              // Os registros já chegam ordenados por `at` desc do Firestore;
              // o sort padrão do DataTable (por `name`) reordenaria sem sentido.
              sorting: { sortModel: [] },
            }}
          />

          {hasMore && (
            <Box display="flex" justifyContent="center">
              <Button variant="outlined" onClick={loadMore} disabled={loading}>
                Carregar mais
              </Button>
            </Box>
          )}
        </>
      )}

      {/*
        zIndex explícito: este app sobe o AppBar para `drawer + 1` (para a
        gaveta de navegação passar por baixo dele), e um Drawer temporário
        renderiza em `drawer` — ou seja, o header pintava por cima do topo
        deste painel e escondia o título. Como aqui é um overlay modal, o
        correto é ficar acima de tudo, no nível de modal.
      */}
      <Drawer
        anchor="right"
        open={selected !== null}
        onClose={() => setSelected(null)}
        sx={{ zIndex: (t) => t.zIndex.modal }}
        PaperProps={{ sx: { width: { xs: "100%", sm: 460 }, p: 3 } }}
      >
        {selected && (
          <Box display="flex" flexDirection="column" gap={2}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {actionLabel(selected.action)} · {entityLabel(selected.entity)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selected.label}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" flexDirection="column" gap={0.75}>
              <Typography variant="body2">
                <strong>Quando:</strong> {formatDateTime(selected.at)}
              </Typography>
              <Typography variant="body2">
                <strong>Usuário:</strong> {selected.actorEmail || "—"}
              </Typography>
              <Typography variant="body2">
                <strong>ID do registro:</strong> {selected.entityId || "—"}
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="body2">
                  <strong>Status:</strong>
                </Typography>
                <StatusPill status={selected.status} />
              </Box>
            </Box>

            {/*
              Caso especial: a exclusão ACONTECEU, mas a lixeira estava negada
              pelas regras — o registro é irrecuperável. Lido só como "falha"
              isso passaria por uma exclusão que não ocorreu, que é o oposto
              da verdade e a leitura mais perigosa possível.
            */}
            {selected.binUnavailable && (
              <>
                <Divider />
                <Alert severity="error">
                  Este registro foi excluído <strong>sem passar pela
                  lixeira</strong> (as regras do Firestore negaram a gravação) e
                  não pode ser restaurado. Verifique se as regras foram
                  publicadas com <code>firebase deploy --only firestore:rules</code>.
                </Alert>
              </>
            )}

            {selected.errorMessage && (
              <>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Erro
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    {selected.errorMessage}
                  </Typography>
                  {selected.errorCode && (
                    <Typography variant="caption" color="text.secondary">
                      Código: {selected.errorCode}
                    </Typography>
                  )}
                </Box>
              </>
            )}

            {selected.changedFields && selected.changedFields.length > 0 && (
              <>
                <Divider />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Campos alterados
                  </Typography>
                  <Box display="flex" gap={0.5} flexWrap="wrap" mb={1.5}>
                    {selected.changedFields.map((f) => (
                      <Chip key={f} label={f} size="small" />
                    ))}
                  </Box>

                  {selected.truncated ? (
                    <Typography variant="caption" color="text.secondary">
                      O detalhe das alterações não foi guardado por ser grande
                      demais.
                    </Typography>
                  ) : (
                    selected.changedFields.map((field) => (
                      <Box key={field} sx={{ mb: 1.5 }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: ".3px",
                            textTransform: "uppercase",
                            color: "text.secondary",
                          }}
                        >
                          {field}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-word" }}
                          color="text.secondary"
                        >
                          De: {JSON.stringify(selected.before?.[field]) ?? "—"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ wordBreak: "break-word" }}
                        >
                          Para: {JSON.stringify(selected.after?.[field]) ?? "—"}
                        </Typography>
                      </Box>
                    ))
                  )}
                </Box>
              </>
            )}

            <Button variant="outlined" onClick={() => setSelected(null)}>
              Fechar
            </Button>
          </Box>
        )}
      </Drawer>
    </Box>
  );
};

export default AdminActivity;

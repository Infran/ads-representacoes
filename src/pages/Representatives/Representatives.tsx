import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Groups } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import CreateRepresentativeModal from "../../components/Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal";
import EditRepresentativeModal from "../../components/Modal/Edit/EditRepresentativeModal/EditRepresentativeModal";
import DeleteRepresentativeModal from "../../components/Modal/Delete/DeleteRepresentativeModal";
import CockpitFilterBar, {
  CockpitSelect,
  CockpitToggle,
} from "../../components/Cockpit/CockpitFilterBar";
import CockpitResultsTable, {
  CockpitColumns,
} from "../../components/Cockpit/CockpitResultsTable";
import CockpitDetailPanel, {
  CockpitDetailConfig,
} from "../../components/Cockpit/CockpitDetailPanel";
import { distinctSorted, downloadCsv } from "../../components/Cockpit/cockpitUtils";
import { useCockpit } from "../../components/Cockpit/useCockpit";
import {
  EMPTY_REPRESENTATIVE_FILTERS,
  RepresentativeCockpitFilters,
  applyRepresentativeFilters,
  buildRepresentativeChips,
} from "./representativeCockpit";
import { IRepresentative } from "../../interfaces/irepresentative";
import { deleteRepresentative } from "../../services/representativeServices";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const PER_PAGE = 8;

const Representatives = () => {
  const navigate = useNavigate();
  const { representatives, budgets, loading, removeRepresentativeFromCache } = useData();
  const cockpit = useCockpit<RepresentativeCockpitFilters>(EMPTY_REPRESENTATIVE_FILTERS);
  const { filters, patchFilters } = cockpit;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IRepresentative | null>(null);

  // Contagem de orçamentos por representante (dos budgets do cache) — alimenta o
  // badge "Orçamentos" e o filtro "Com orçamento".
  const budgetCountByRep = useMemo(() => {
    const m = new Map<string, number>();
    budgets.forEach((b) => {
      const id = b.representative?.id ? String(b.representative.id) : "";
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    });
    return m;
  }, [budgets]);

  const filtered = useMemo(
    () => applyRepresentativeFilters(representatives, filters, budgetCountByRep),
    [representatives, filters, budgetCountByRep]
  );
  const stateOptions = useMemo(
    () => distinctSorted(representatives.map((r) => r.state)),
    [representatives]
  );
  const cityOptions = useMemo(
    () =>
      distinctSorted(
        representatives
          .filter((r) => !filters.state || r.state === filters.state)
          .map((r) => r.city)
      ),
    [representatives, filters.state]
  );
  const chips = useMemo(
    () => buildRepresentativeChips(filters, patchFilters),
    [filters, patchFilters]
  );
  const selected = useMemo(
    () => representatives.find((r) => r.id === cockpit.selectedId) ?? null,
    [representatives, cockpit.selectedId]
  );

  const selects: CockpitSelect[] = [
    {
      key: "state",
      label: "Estado",
      value: filters.state,
      placeholder: "Todos",
      allLabel: "Todos os estados",
      options: stateOptions,
      width: 150,
      onPick: (v) => patchFilters({ state: v, city: "" }),
    },
    {
      key: "city",
      label: "Cidade",
      value: filters.city,
      placeholder: "Todas",
      allLabel: "Todas as cidades",
      options: cityOptions,
      width: 180,
      onPick: (v) => patchFilters({ city: v }),
    },
  ];

  const toggles: CockpitToggle[] = [
    {
      key: "hasEmail",
      caption: "Contato",
      label: "Com e-mail",
      checked: filters.hasEmail,
      onToggle: (v) => patchFilters({ hasEmail: v }),
    },
    {
      key: "hasBudget",
      caption: "Comercial",
      label: "Com orçamento",
      checked: filters.hasBudget,
      onToggle: (v) => patchFilters({ hasBudget: v }),
    },
  ];

  const columns: CockpitColumns<IRepresentative> = {
    getRowId: (r) => r.id,
    primaryHeader: "Nome",
    getPrimary: (r) => r.name || "Sem nome",
    getSubtitle: (r) => r.email || r.role || "Sem contato",
    middleHeader: "Cidade/UF",
    renderMiddle: (r) => (
      <>
        {r.city || "—"}
        {r.state ? (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {" · "}
            {r.state}
          </Box>
        ) : null}
      </>
    ),
    badgeHeader: "Orçamentos",
    getBadge: (r) => {
      const n = budgetCountByRep.get(r.id) ?? 0;
      return { label: String(n), active: n > 0 };
    },
  };

  const detailConfig: CockpitDetailConfig<IRepresentative> = {
    getRowId: (r) => r.id,
    getTitle: (r) => r.name || "Sem nome",
    getSubtitle: (r) => r.role || r.client?.name || "—",
    getFields: (r) => [
      { label: "Função", value: r.role || "Não informada" },
      { label: "E-mail", value: r.email || "Não informado" },
      { label: "Telefone", value: r.phone || "Não informado" },
      { label: "Celular", value: r.mobilePhone || "Não informado" },
      { label: "Cliente", value: r.client?.name || "Não vinculado" },
      {
        label: "Localização",
        value: [r.city, r.state].filter(Boolean).join(" · ") || "Não informada",
      },
    ],
    getTimestamps: (r) => ({ createdAt: r.createdAt, updatedAt: r.updatedAt }),
    statusLabel: "Representante ativo",
    railLabel: "DETALHES DO REPRESENTANTE",
    emptyTitle: "Nenhum representante selecionado",
    emptyDescription: "Clique em uma linha da tabela para ver os detalhes aqui.",
    emptyIcon: Groups,
    primaryActionLabel: "Novo orçamento",
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteRepresentative(deleting.id);
      removeRepresentativeFromCache(deleting.id);
      if (cockpit.selectedId === deleting.id) cockpit.setSelectedId(null);
      setDeleting(null);
      notifySuccess("Sucesso!", "Representante excluído com sucesso!");
    } catch (error) {
      logger.error("Erro ao excluir representante:", error);
      notifyError("Não foi possível excluir o representante", error);
    }
  };

  const handleExport = () =>
    downloadCsv(
      "representantes.csv",
      ["ID", "Nome", "Função", "E-mail", "Telefone", "Celular", "Cliente", "Cidade", "UF", "Orçamentos"],
      filtered.map((r) => [
        r.id,
        r.name ?? "",
        r.role ?? "",
        r.email ?? "",
        r.phone ?? "",
        r.mobilePhone ?? "",
        r.client?.name ?? "",
        r.city ?? "",
        r.state ?? "",
        String(budgetCountByRep.get(r.id) ?? 0),
      ])
    );

  const headerDescription =
    representatives.length === 1
      ? "1 representante · gerencie a equipe comercial."
      : `${representatives.length} representantes · gerencie a equipe comercial.`;

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Representantes"
          description={headerDescription}
          icon={Groups}
          actionLabel="Adicionar representante"
          onAction={() => setCreateOpen(true)}
        />

        {loading ? (
          <TableSkeleton />
        ) : representatives.length === 0 ? (
          <EmptyState
            title="Nenhum representante cadastrado"
            description="Comece cadastrando o primeiro representante."
            icon={Groups}
            actionLabel="Cadastrar representante"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <>
            <CockpitFilterBar
              search={filters.search}
              onSearchChange={(v) => patchFilters({ search: v })}
              searchPlaceholder="Nome, função ou cliente"
              selects={selects}
              toggles={toggles}
              onReset={cockpit.resetFilters}
            />

            <Box
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: { xs: "column", lg: "row" },
                gap: 2,
                alignItems: "stretch",
                minHeight: 0,
              }}
            >
              <CockpitResultsTable
                rows={filtered}
                columns={columns}
                page={cockpit.page}
                perPage={PER_PAGE}
                onPageChange={cockpit.setPage}
                density={cockpit.density}
                onDensityChange={cockpit.setDensity}
                chips={chips}
                selectedId={cockpit.selectedId}
                onSelect={(r) => cockpit.select(r.id)}
                onEdit={(r) => setEditingId(r.id)}
                onDelete={(r) => setDeleting(r)}
                onExport={handleExport}
                emptyLabel="Nenhum representante encontrado com esses filtros."
              />

              <CockpitDetailPanel
                item={selected}
                config={detailConfig}
                collapsed={cockpit.detailCollapsed}
                collapsible={cockpit.isWide}
                onCollapse={() => cockpit.setDetailCollapsed(true)}
                onExpand={() => cockpit.setDetailCollapsed(false)}
                onEdit={(r) => setEditingId(r.id)}
                onPrimaryAction={() => navigate("/Orcamentos/Adicionar")}
              />
            </Box>
          </>
        )}
      </Box>

      <CreateRepresentativeModal open={createOpen} handleClose={() => setCreateOpen(false)} />

      {editingId && (
        <EditRepresentativeModal
          open={Boolean(editingId)}
          handleClose={() => setEditingId(null)}
          id={editingId}
        />
      )}

      <DeleteRepresentativeModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        representative={deleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default Representatives;

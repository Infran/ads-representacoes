import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Apartment } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import CreateClientModal from "../../components/Modal/Create/CreateClientModal/CreateClientModal";
import EditClientModal from "../../components/Modal/Edit/EditClientModal/EditClientModal";
import DeleteClientModal from "../../components/Modal/Delete/DeleteClientModal";
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
  EMPTY_CLIENT_FILTERS,
  ClientCockpitFilters,
  applyClientFilters,
  buildClientChips,
  formatCnpj,
} from "./clientCockpit";
import { IClient } from "../../interfaces/iclient";
import { getEstadoNome, getUf } from "../../utils/ufs";
import { deleteClient } from "../../services/clientServices";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const PER_PAGE = 8;

const Clients = () => {
  const navigate = useNavigate();
  const { clients, budgets, loading, removeClientFromCache } = useData();
  const cockpit = useCockpit<ClientCockpitFilters>(EMPTY_CLIENT_FILTERS);
  const { filters, patchFilters } = cockpit;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IClient | null>(null);

  // Contagem de orçamentos por cliente (dos budgets do cache) — alimenta o badge
  // "Orçamentos" e o filtro "Com orçamento".
  const budgetCountByClient = useMemo(() => {
    const m = new Map<string, number>();
    budgets.forEach((b) => {
      const id = b.client?.id ? String(b.client.id) : "";
      if (id) m.set(id, (m.get(id) ?? 0) + 1);
    });
    return m;
  }, [budgets]);

  const filtered = useMemo(
    () => applyClientFilters(clients, filters, budgetCountByClient),
    [clients, filters, budgetCountByClient]
  );
  // Opções guardam a sigla como valor; o nome completo é só rótulo (formatOption)
  // — e é por ele que a lista precisa ser ordenada.
  const ufOptions = useMemo(
    () =>
      distinctSorted(
        clients.map((c) => getUf(c)),
        (uf) => getEstadoNome({ uf })
      ),
    [clients]
  );
  const cityOptions = useMemo(
    () =>
      distinctSorted(
        clients.filter((c) => !filters.uf || getUf(c) === filters.uf).map((c) => c.city)
      ),
    [clients, filters.uf]
  );
  const chips = useMemo(
    () => buildClientChips(filters, patchFilters),
    [filters, patchFilters]
  );
  const selected = useMemo(
    () => clients.find((c) => c.id === cockpit.selectedId) ?? null,
    [clients, cockpit.selectedId]
  );

  const selects: CockpitSelect[] = [
    {
      key: "uf",
      label: "Estado",
      value: filters.uf,
      placeholder: "Todos",
      allLabel: "Todos os estados",
      options: ufOptions,
      formatOption: (uf) => getEstadoNome({ uf }),
      width: 190,
      onPick: (v) => patchFilters({ uf: v, city: "" }),
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
      key: "hasCnpj",
      caption: "Documento",
      label: "Com CNPJ",
      checked: filters.hasCnpj,
      onToggle: (v) => patchFilters({ hasCnpj: v }),
    },
    {
      key: "hasBudget",
      caption: "Comercial",
      label: "Com orçamento",
      checked: filters.hasBudget,
      onToggle: (v) => patchFilters({ hasBudget: v }),
    },
  ];

  const columns: CockpitColumns<IClient> = {
    getRowId: (c) => c.id,
    primaryHeader: "Empresa",
    getPrimary: (c) => c.name || "Sem nome",
    getSubtitle: (c) => c.email || "Sem e-mail",
    middleHeader: "Cidade/Estado",
    renderMiddle: (c) => {
      const estado = getEstadoNome(c);
      return (
        <>
          {c.city || "—"}
          {estado ? (
            <Box component="span" sx={{ color: "text.secondary" }}>
              {" · "}
              {estado}
            </Box>
          ) : null}
        </>
      );
    },
    badgeHeader: "Orçamentos",
    getBadge: (c) => {
      const n = budgetCountByClient.get(c.id) ?? 0;
      return { label: String(n), active: n > 0 };
    },
  };

  const detailConfig: CockpitDetailConfig<IClient> = {
    getRowId: (c) => c.id,
    getTitle: (c) => c.name || "Sem nome",
    getSubtitle: (c) => {
      const estado = getEstadoNome(c);
      return c.city && estado ? `${c.city} · ${estado}` : c.email || "—";
    },
    getFields: (c) => [
      { label: "E-mail", value: c.email || "Não informado" },
      { label: "Telefone", value: c.phone || "Não informado" },
      { label: "CNPJ", value: formatCnpj(c.cnpj) || "Não informado", mono: true },
      {
        label: "Localização",
        value:
          [c.city, getEstadoNome(c)].filter(Boolean).join(" · ") ||
          "Não informada",
      },
      { label: "Endereço", value: c.address || "Não informado" },
      { label: "CEP", value: c.cep || "Não informado", mono: true },
    ],
    getTimestamps: (c) => ({ createdAt: c.createdAt, updatedAt: c.updatedAt }),
    statusLabel: "Cliente ativo",
    railLabel: "DETALHES DO CLIENTE",
    emptyTitle: "Nenhum cliente selecionado",
    emptyDescription: "Clique em uma linha da tabela para ver os detalhes aqui.",
    emptyIcon: Apartment,
    primaryActionLabel: "Novo orçamento",
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteClient(deleting.id.toString());
      removeClientFromCache(deleting.id);
      if (cockpit.selectedId === deleting.id) cockpit.setSelectedId(null);
      setDeleting(null);
      notifySuccess("Sucesso!", "Cliente excluído com sucesso!");
    } catch (error) {
      logger.error("Erro ao excluir cliente:", error);
      notifyError("Não foi possível excluir o cliente", error);
    }
  };

  const handleExport = () =>
    downloadCsv(
      "clientes.csv",
      ["ID", "Nome", "E-mail", "Telefone", "CNPJ", "Cidade", "UF", "Orçamentos"],
      filtered.map((c) => [
        c.id,
        c.name ?? "",
        c.email ?? "",
        c.phone ?? "",
        formatCnpj(c.cnpj),
        c.city ?? "",
        getUf(c),
        String(budgetCountByClient.get(c.id) ?? 0),
      ])
    );

  const headerDescription =
    clients.length === 1
      ? "1 empresa cadastrada · gerencie, filtre e exporte registros."
      : `${clients.length} empresas cadastradas · gerencie, filtre e exporte registros.`;

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Clientes"
          description={headerDescription}
          icon={Apartment}
          actionLabel="Adicionar cliente"
          onAction={() => setCreateOpen(true)}
        />

        {loading ? (
          <TableSkeleton />
        ) : clients.length === 0 ? (
          <EmptyState
            title="Nenhum cliente cadastrado"
            description="Comece cadastrando o primeiro cliente."
            icon={Apartment}
            actionLabel="Cadastrar cliente"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <>
            <CockpitFilterBar
              search={filters.search}
              onSearchChange={(v) => patchFilters({ search: v })}
              searchPlaceholder="Nome, e-mail ou CNPJ"
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
                onSelect={(c) => cockpit.select(c.id)}
                onEdit={(c) => setEditingId(c.id)}
                onDelete={(c) => setDeleting(c)}
                onExport={handleExport}
                emptyLabel="Nenhum cliente encontrado com esses filtros."
              />

              <CockpitDetailPanel
                item={selected}
                config={detailConfig}
                collapsed={cockpit.detailCollapsed}
                collapsible={cockpit.isWide}
                onCollapse={() => cockpit.setDetailCollapsed(true)}
                onExpand={() => cockpit.setDetailCollapsed(false)}
                onEdit={(c) => setEditingId(c.id)}
                onPrimaryAction={() => navigate("/Orcamentos/Adicionar")}
              />
            </Box>
          </>
        )}
      </Box>

      <CreateClientModal open={createOpen} handleClose={() => setCreateOpen(false)} />

      {editingId && (
        <EditClientModal
          open={Boolean(editingId)}
          handleClose={() => setEditingId(null)}
          id={editingId}
        />
      )}

      <DeleteClientModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        client={deleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default Clients;

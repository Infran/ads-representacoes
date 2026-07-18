import { useMemo, useState } from "react";
import { Box } from "@mui/material";
import { Inventory2 } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import CreateProductModal from "../../components/Modal/Create/CreateProductModal/CreateProductModal";
import EditProductModal from "../../components/Modal/Edit/EditProductModal/EditProductModal";
import DeleteProductModal from "../../components/Modal/Delete/DeleteProductModal";
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
  EMPTY_PRODUCT_FILTERS,
  ProductCockpitFilters,
  applyProductFilters,
  buildProductChips,
  formatCents,
  formatIcms,
} from "./productCockpit";
import { IProduct } from "../../interfaces/iproduct";
import { deleteProduct } from "../../services/productServices";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const PER_PAGE = 8;

const Products = () => {
  const navigate = useNavigate();
  const { products, loading, removeProductFromCache } = useData();
  const cockpit = useCockpit<ProductCockpitFilters>(EMPTY_PRODUCT_FILTERS);
  const { filters, patchFilters } = cockpit;

  const [createOpen, setCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<IProduct | null>(null);

  const filtered = useMemo(
    () => applyProductFilters(products, filters),
    [products, filters]
  );
  const ncmOptions = useMemo(() => distinctSorted(products.map((p) => p.ncm)), [products]);
  const icmsOptions = useMemo(() => distinctSorted(products.map((p) => p.icms)), [products]);
  const chips = useMemo(
    () => buildProductChips(filters, patchFilters),
    [filters, patchFilters]
  );
  const selected = useMemo(
    () => products.find((p) => p.id === cockpit.selectedId) ?? null,
    [products, cockpit.selectedId]
  );

  const selects: CockpitSelect[] = [
    {
      key: "ncm",
      label: "NCM",
      value: filters.ncm,
      placeholder: "Todos",
      allLabel: "Todos os NCM",
      options: ncmOptions,
      width: 160,
      onPick: (v) => patchFilters({ ncm: v }),
    },
    {
      key: "icms",
      label: "ICMS",
      value: filters.icms,
      placeholder: "Todas",
      allLabel: "Todas as alíquotas",
      options: icmsOptions,
      formatOption: formatIcms,
      width: 150,
      onPick: (v) => patchFilters({ icms: v }),
    },
  ];

  const toggles: CockpitToggle[] = [
    {
      key: "hasDescription",
      caption: "Descrição",
      label: "Com descrição",
      checked: filters.hasDescription,
      onToggle: (v) => patchFilters({ hasDescription: v }),
    },
    {
      key: "hasPrice",
      caption: "Valor",
      label: "Com valor",
      checked: filters.hasPrice,
      onToggle: (v) => patchFilters({ hasPrice: v }),
    },
  ];

  const columns: CockpitColumns<IProduct> = {
    getRowId: (p) => p.id,
    primaryHeader: "Produto",
    getPrimary: (p) => p.name || "Sem nome",
    getSubtitle: (p) => p.description || "Sem descrição",
    middleHeader: "NCM / ICMS",
    renderMiddle: (p) => (
      <>
        {p.ncm || "—"}
        {p.icms ? (
          <Box component="span" sx={{ color: "text.secondary" }}>
            {" · "}
            {formatIcms(p.icms)}
          </Box>
        ) : null}
      </>
    ),
    badgeHeader: "Valor",
    getBadge: (p) => ({
      label: formatCents(p.unitValue),
      active: !!(p.unitValue && p.unitValue > 0),
    }),
  };

  const detailConfig: CockpitDetailConfig<IProduct> = {
    getRowId: (p) => p.id,
    getTitle: (p) => p.name || "Sem nome",
    getSubtitle: (p) => p.description || "Sem descrição",
    getFields: (p) => [
      { label: "NCM", value: p.ncm || "Não informado", mono: true },
      { label: "ICMS", value: formatIcms(p.icms) || "Não informado" },
      { label: "Valor unitário", value: formatCents(p.unitValue), mono: true },
      { label: "Descrição", value: p.description || "Não informada" },
    ],
    getTimestamps: (p) => ({ createdAt: p.createdAt, updatedAt: p.updatedAt }),
    statusLabel: "Produto ativo",
    railLabel: "DETALHES DO PRODUTO",
    emptyTitle: "Nenhum produto selecionado",
    emptyDescription: "Clique em uma linha da tabela para ver os detalhes aqui.",
    emptyIcon: Inventory2,
    primaryActionLabel: "Novo orçamento",
  };

  const handleConfirmDelete = async () => {
    if (!deleting) return;
    try {
      await deleteProduct(deleting.id.toString());
      removeProductFromCache(deleting.id);
      if (cockpit.selectedId === deleting.id) cockpit.setSelectedId(null);
      setDeleting(null);
      notifySuccess("Sucesso!", "Produto excluído com sucesso!");
    } catch (error) {
      logger.error("Erro ao excluir produto:", error);
      notifyError("Não foi possível excluir o produto", error);
    }
  };

  const handleExport = () =>
    downloadCsv(
      "produtos.csv",
      ["ID", "Nome", "Descrição", "NCM", "ICMS", "Valor"],
      filtered.map((p) => [
        p.id,
        p.name ?? "",
        p.description ?? "",
        p.ncm ?? "",
        formatIcms(p.icms),
        formatCents(p.unitValue),
      ])
    );

  const headerDescription =
    products.length === 1
      ? "1 produto no catálogo · gerencie preços e detalhes."
      : `${products.length} produtos no catálogo · gerencie preços e detalhes.`;

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Produtos"
          description={headerDescription}
          icon={Inventory2}
          actionLabel="Adicionar produto"
          onAction={() => setCreateOpen(true)}
        />

        {loading ? (
          <TableSkeleton />
        ) : products.length === 0 ? (
          <EmptyState
            title="Nenhum produto cadastrado"
            description="Comece cadastrando o primeiro produto."
            icon={Inventory2}
            actionLabel="Cadastrar produto"
            onAction={() => setCreateOpen(true)}
          />
        ) : (
          <>
            <CockpitFilterBar
              search={filters.search}
              onSearchChange={(v) => patchFilters({ search: v })}
              searchPlaceholder="Nome, descrição ou NCM"
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
                onSelect={(p) => cockpit.select(p.id)}
                onEdit={(p) => setEditingId(p.id)}
                onDelete={(p) => setDeleting(p)}
                onExport={handleExport}
                emptyLabel="Nenhum produto encontrado com esses filtros."
              />

              <CockpitDetailPanel
                item={selected}
                config={detailConfig}
                collapsed={cockpit.detailCollapsed}
                collapsible={cockpit.isWide}
                onCollapse={() => cockpit.setDetailCollapsed(true)}
                onExpand={() => cockpit.setDetailCollapsed(false)}
                onEdit={(p) => setEditingId(p.id)}
                onPrimaryAction={() => navigate("/Orcamentos/Adicionar")}
              />
            </Box>
          </>
        )}
      </Box>

      <CreateProductModal open={createOpen} handleClose={() => setCreateOpen(false)} />

      {editingId && (
        <EditProductModal
          open={Boolean(editingId)}
          handleClose={() => setEditingId(null)}
          id={editingId}
        />
      )}

      <DeleteProductModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        product={deleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default Products;

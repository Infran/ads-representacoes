import React, { Suspense, useMemo } from "react";
import { Box, Typography, Grid, Divider, Skeleton } from "@mui/material";
import {
  Description,
  Inventory2,
  Business,
  Badge,
  Paid,
} from "@mui/icons-material";
import { RecentBudgets, QuickAccessCard } from "../../components/Dashboard";
import { Card, StatCard, CardGridSkeleton } from "../../ui";
import { useData } from "../../context/DataContext";
import { brMoneyMask } from "../../utils/Masks";
import {
  computeTotalValue,
  computeMonthlyTrend,
  computeTopProducts,
} from "./dashboardMetrics";

// Charts pesados (@mui/x-charts) fora do bundle inicial — chunk `vendor-charts`
// carregado sob demanda quando a dashboard monta (coordena com PERF P0.2).
const TrendChart = React.lazy(
  () => import("../../components/Dashboard/charts/TrendChart")
);
const TopProductsChart = React.lazy(
  () => import("../../components/Dashboard/charts/TopProductsChart")
);

const CHART_HEIGHT = 300;

export const Home = () => {
  // Usa o contexto de dados com cache - SEM chamadas diretas ao Firestore!
  const { budgets, clients, products, loading } = useData();

  // Métricas escalares dos KPIs (cálculo local, dados do cache).
  const kpiData = useMemo(() => {
    const totalBudgets = budgets.length;

    // Orçamentos deste mês
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const budgetsThisMonth = budgets.filter((b) => {
      if (!b.createdAt?.seconds) return false;
      return new Date(b.createdAt.seconds * 1000) >= startOfMonth;
    }).length;

    // Último cliente cadastrado
    const lastClient =
      [...clients].sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      )[0]?.name || "-";

    return {
      totalBudgets,
      budgetsThisMonth,
      totalProducts: products.length,
      totalClients: clients.length,
      lastClient,
    };
  }, [budgets, clients, products]);

  // Agregações para o hero KPI e os gráficos (funções puras testáveis).
  const totalValueCents = useMemo(() => computeTotalValue(budgets), [budgets]);
  const monthlyTrend = useMemo(() => computeMonthlyTrend(budgets), [budgets]);
  const topProducts = useMemo(() => computeTopProducts(budgets), [budgets]);

  // Contagem de representantes únicos (calculado dos orçamentos)
  const uniqueRepresentativesCount = useMemo(() => {
    const repIds = new Set<string>();
    budgets.forEach((b) => {
      if (b.representative?.id) repIds.add(String(b.representative.id));
    });
    return repIds.size;
  }, [budgets]);

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        backgroundColor: "background.default",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "text.primary", mb: 1 }}
        >
          Dashboard
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* KPIs — hero "Valor Total" + secundários */}
      {loading ? (
        <CardGridSkeleton count={4} />
      ) : (
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Valor Total"
              value={`R$ ${brMoneyMask(totalValueCents.toFixed(0))}`}
              icon={Paid}
              highlight
              helperText={`${kpiData.totalBudgets} orçamento${
                kpiData.totalBudgets === 1 ? "" : "s"
              } acumulado${kpiData.totalBudgets === 1 ? "" : "s"}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Orçamentos"
              value={kpiData.totalBudgets}
              icon={Description}
              helperText={
                kpiData.budgetsThisMonth > 0
                  ? `+${kpiData.budgetsThisMonth} este mês`
                  : "Nenhum este mês"
              }
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Produtos"
              value={kpiData.totalProducts}
              icon={Inventory2}
              helperText="No catálogo"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="Clientes"
              value={kpiData.totalClients}
              icon={Business}
              helperText={
                kpiData.lastClient !== "-"
                  ? `Último: ${kpiData.lastClient}`
                  : "Nenhum cadastrado"
              }
            />
          </Grid>
        </Grid>
      )}

      {/* Gráficos (lazy — chunk vendor-charts) */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Evolução do valor orçado
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Últimos 12 meses
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={CHART_HEIGHT} />
            ) : (
              <Suspense
                fallback={<Skeleton variant="rounded" height={CHART_HEIGHT} />}
              >
                <TrendChart data={monthlyTrend} height={CHART_HEIGHT} />
              </Suspense>
            )}
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: "100%" }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "text.primary" }}>
              Produtos mais orçados
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Por quantidade total
            </Typography>
            {loading ? (
              <Skeleton variant="rounded" height={CHART_HEIGHT} />
            ) : (
              <Suspense
                fallback={<Skeleton variant="rounded" height={CHART_HEIGHT} />}
              >
                <TopProductsChart data={topProducts} height={CHART_HEIGHT} />
              </Suspense>
            )}
          </Card>
        </Grid>
      </Grid>

      {/* Orçamentos Recentes */}
      <Box
        sx={{
          backgroundColor: "background.paper",
          borderRadius: 2,
          p: 3,
          boxShadow: 1,
        }}
      >
        <RecentBudgets budgets={budgets} loading={loading} />
      </Box>

      {/* Acesso Rápido */}
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "text.primary", mb: 2 }}
        >
          Acesso Rápido
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <QuickAccessCard
              title="Clientes"
              count={kpiData.totalClients}
              subtitle="empresas"
              icon={Business}
              link="/Clientes"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <QuickAccessCard
              title="Representantes"
              count={uniqueRepresentativesCount}
              subtitle="representantes"
              icon={Badge}
              link="/Representantes"
              loading={loading}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <QuickAccessCard
              title="Produtos"
              count={kpiData.totalProducts}
              subtitle="produtos"
              icon={Inventory2}
              link="/Produtos"
              loading={loading}
            />
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

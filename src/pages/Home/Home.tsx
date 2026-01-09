import React, { useMemo } from "react";
import { Box, Typography, Grid, Divider } from "@mui/material";
import {
  Description,
  AttachMoney,
  Inventory2,
  Business,
  Badge,
} from "@mui/icons-material";
import {
  KPICard,
  RecentBudgets,
  QuickAccessCard,
} from "../../components/Dashboard";
import { useData } from "../../context/DataContext";
import { brMoneyMask } from "../../utils/Masks";

export const Home = () => {
  // Usa o contexto de dados com cache - SEM chamadas diretas ao Firestore!
  const { budgets, clients, products, loading } = useData();

  // Cálculos para KPIs (todos feitos localmente com dados do cache)
  const kpiData = useMemo(() => {
    // Total de orçamentos
    const totalBudgets = budgets.length;

    // Orçamentos deste mês
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const budgetsThisMonth = budgets.filter((b) => {
      if (!b.createdAt?.seconds) return false;
      const budgetDate = new Date(b.createdAt.seconds * 1000);
      return budgetDate >= startOfMonth;
    }).length;

    // Valor total
    const totalValue = budgets.reduce((sum, b) => sum + (b.totalValue || 0), 0);

    // Maior orçamento
    const maxBudget = budgets.reduce(
      (max, b) => Math.max(max, b.totalValue || 0),
      0
    );

    // Produtos mais orçados
    const productCount: Record<string, { name: string; count: number }> = {};
    budgets.forEach((budget) => {
      budget.selectedProducts?.forEach((item) => {
        const productId = item.product?.id;
        const productName = item.product?.name || "Sem nome";
        if (productId) {
          if (!productCount[productId]) {
            productCount[productId] = { name: productName, count: 0 };
          }
          productCount[productId].count += item.quantity;
        }
      });
    });
    const topProducts = Object.values(productCount)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Último cliente cadastrado
    const sortedClients = [...clients].sort((a, b) => {
      const aTime = a.createdAt?.seconds || 0;
      const bTime = b.createdAt?.seconds || 0;
      return bTime - aTime;
    });
    const lastClient = sortedClients[0]?.name || "-";

    return {
      totalBudgets,
      budgetsThisMonth,
      totalValue,
      maxBudget,
      topProducts,
      totalProducts: products.length,
      totalClients: clients.length,
      lastClient,
    };
  }, [budgets, clients, products]);

  // Contagem de representantes únicos (calculado dos orçamentos)
  const uniqueRepresentativesCount = useMemo(() => {
    const repIds = new Set<string>();
    budgets.forEach((b) => {
      if (b.representative?.id) {
        repIds.add(String(b.representative.id));
      }
    });
    return repIds.size;
  }, [budgets]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 1400,
        margin: "0 auto",
        padding: 3,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        backgroundColor: "#FAFAFA",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <Box>
        <Typography
          variant="h4"
          sx={{ fontWeight: 700, color: "#2C3E50", mb: 1 }}
        >
          Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Visão geral do seu negócio
        </Typography>
        <Divider sx={{ mt: 2 }} />
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Orçamentos"
            value={kpiData.totalBudgets}
            subtitle="Orçamentos gerados"
            extraChip={
              kpiData.budgetsThisMonth > 0
                ? {
                    label: `+${kpiData.budgetsThisMonth} este mês`,
                    color: "success",
                  }
                : undefined
            }
            icon={Description}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Valor Total em Orçamentos"
            value={`R$ ---,--`}
            subtitle="(Em desenvolvimento)"
            icon={AttachMoney}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Produtos Cadastrados"
            value={kpiData.totalProducts}
            subtitle="Produtos no catálogo"
            extraInfo={
              kpiData.topProducts.length > 0 ? (
                <Box component="span">
                  Top:{" "}
                  {kpiData.topProducts
                    .slice(0, 2)
                    .map((p) => p.name)
                    .join(", ")}
                </Box>
              ) : undefined
            }
            icon={Inventory2}
            loading={loading}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Clientes"
            value={kpiData.totalClients}
            subtitle="Empresas cadastradas"
            extraInfo={
              kpiData.lastClient !== "-"
                ? `Último: ${kpiData.lastClient}`
                : undefined
            }
            icon={Business}
            loading={loading}
          />
        </Grid>
      </Grid>

      {/* Orçamentos Recentes */}
      <Box
        sx={{
          backgroundColor: "#fff",
          borderRadius: 2,
          p: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <RecentBudgets budgets={budgets} loading={loading} />
      </Box>

      {/* Acesso Rápido */}
      <Box>
        <Typography
          variant="h6"
          sx={{ fontWeight: 600, color: "#2C3E50", mb: 2 }}
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

import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { BarChart } from "@mui/x-charts/BarChart";
import { TopProduct } from "../../../pages/Home/dashboardMetrics";

interface TopProductsChartProps {
  /** Top produtos por quantidade orçada (já ordenado desc). */
  data: TopProduct[];
  height?: number;
}

// Nomes longos estouram a margem do eixo — trunca para caber.
const truncate = (s: string, max = 22) =>
  s.length > max ? `${s.slice(0, max - 1)}…` : s;

/**
 * Produtos mais orçados por quantidade (UI U3.1). Barras horizontais para
 * comportar nomes de produto. Presentacional (recebe `computeTopProducts`);
 * cores do tema; carregado via React.lazy (chunk `vendor-charts`).
 */
const TopProductsChart: React.FC<TopProductsChartProps> = ({
  data,
  height = 300,
}) => {
  const theme = useTheme();

  // Barras crescem de baixo p/ cima; inverte para o maior ficar no topo.
  const ordered = useMemo(() => [...data].reverse(), [data]);
  const names = useMemo(() => ordered.map((p) => truncate(p.name)), [ordered]);
  const counts = useMemo(() => ordered.map((p) => p.count), [ordered]);

  if (data.length === 0) {
    return (
      <Box
        sx={{
          height,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          Nenhum produto orçado ainda.
        </Typography>
      </Box>
    );
  }

  return (
    <BarChart
      height={height}
      layout="horizontal"
      series={[
        {
          data: counts,
          label: "Qtd. orçada",
          color: theme.palette.primary.main,
        },
      ]}
      yAxis={[{ scaleType: "band", data: names }]}
      xAxis={[{ label: "Quantidade", tickMinStep: 1 }]}
      margin={{ left: 160, right: 16, top: 16, bottom: 40 }}
      grid={{ vertical: true }}
      slotProps={{ legend: { hidden: true } }}
    />
  );
};

export default TopProductsChart;

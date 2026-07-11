import React, { useMemo } from "react";
import { Box, Typography, useTheme } from "@mui/material";
import { LineChart } from "@mui/x-charts/LineChart";
import { MonthlyPoint } from "../../../pages/Home/dashboardMetrics";

interface TrendChartProps {
  /** Série mensal (últimos 12 meses) — `value` em centavos. */
  data: MonthlyPoint[];
  height?: number;
}

// Formatadores pt-BR memoizáveis (fora do render).
const brlFull = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});
const brlCompact = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

/**
 * Evolução do valor orçado nos últimos 12 meses (UI U3.1). Presentacional:
 * recebe a série já agregada por `computeMonthlyTrend`. Cores do tema (sem hex);
 * carregado via React.lazy na dashboard (chunk `vendor-charts`).
 */
const TrendChart: React.FC<TrendChartProps> = ({ data, height = 300 }) => {
  const theme = useTheme();

  // Converte centavos → reais para os eixos/tooltip.
  const reais = useMemo(() => data.map((p) => p.value / 100), [data]);
  const labels = useMemo(() => data.map((p) => p.label), [data]);
  const hasData = data.some((p) => p.value > 0);

  if (!hasData) {
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
          Sem valor orçado nos últimos 12 meses.
        </Typography>
      </Box>
    );
  }

  return (
    <LineChart
      height={height}
      series={[
        {
          data: reais,
          label: "Valor orçado",
          area: true,
          showMark: false,
          color: theme.palette.primary.main,
          valueFormatter: (v) => (v == null ? "—" : brlFull.format(v)),
        },
      ]}
      xAxis={[{ scaleType: "point", data: labels }]}
      yAxis={[{ valueFormatter: (v: number) => brlCompact.format(v) }]}
      margin={{ left: 72, right: 16, top: 16, bottom: 28 }}
      grid={{ horizontal: true }}
      slotProps={{ legend: { hidden: true } }}
      sx={{
        "& .MuiAreaElement-root": { fillOpacity: 0.12 },
      }}
    />
  );
};

export default TrendChart;

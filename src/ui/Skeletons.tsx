import React from "react";
import { Box, Skeleton } from "@mui/material";

/**
 * Loaders de esqueleto tokenizados (UI U2.1 / U2.3) para substituir
 * "Carregando..." e spinners ad-hoc. O MUI Skeleton já é tema-aware.
 */

/** Linhas de lista/tabela. */
export const ListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={56} />
    ))}
  </Box>
);

/** Grade de cartões (ex.: KPIs da dashboard). */
export const CardGridSkeleton: React.FC<{ count?: number }> = ({
  count = 4,
}) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: {
        xs: "1fr",
        sm: "1fr 1fr",
        md: `repeat(${count}, 1fr)`,
      },
      gap: 2,
    }}
  >
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={120} />
    ))}
  </Box>
);

/** Bloco de tabela (cabeçalho + linhas). */
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => (
  <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
    <Skeleton variant="rounded" height={48} />
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} variant="rounded" height={40} />
    ))}
  </Box>
);

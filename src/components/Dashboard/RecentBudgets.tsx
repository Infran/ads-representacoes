import React from "react";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Skeleton,
  Chip,
} from "@mui/material";
import { Add, Visibility, Edit, PictureAsPdf } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { IBudget } from "../../interfaces/ibudget";
import { brMoneyMask } from "../../utils/Masks";
import { openBudgetPdf } from "../../utils/PDFGenerator/BudgetPdf";

interface RecentBudgetsProps {
  budgets: IBudget[];
  loading?: boolean;
}

const RecentBudgets: React.FC<RecentBudgetsProps> = ({
  budgets,
  loading = false,
}) => {
  const navigate = useNavigate();

  const formatDate = (timestamp: { seconds: number } | undefined) => {
    if (!timestamp?.seconds) return "-";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  };

  const handleOpenPdf = (budget: IBudget) => {
    openBudgetPdf(budget);
  };

  // Pegar apenas os 5 mais recentes
  const recentBudgets = [...budgets]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  return (
    <Box>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: "#2C3E50" }}>
          Orçamentos Recentes
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => navigate("/Orcamentos/Adicionar")}
          sx={{ textTransform: "none" }}
        >
          Adicionar
        </Button>
      </Box>

      {/* Tabela */}
      <TableContainer component={Paper} elevation={1}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#FAFAFA" }}>
              <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Cliente</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Representante</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Valor</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Data</TableCell>
              <TableCell sx={{ fontWeight: 600, textAlign: "center" }}>
                Ações
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              // Loading skeleton
              [...Array(5)].map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                  <TableCell>
                    <Skeleton />
                  </TableCell>
                </TableRow>
              ))
            ) : recentBudgets.length > 0 ? (
              recentBudgets.map((budget) => (
                <TableRow
                  key={budget.id}
                  hover
                  sx={{ "&:last-child td": { border: 0 } }}
                >
                  <TableCell>
                    <Chip
                      label={`#${budget.id}`}
                      size="small"
                      sx={{ fontWeight: 600, fontSize: "0.75rem" }}
                    />
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 150,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {budget.client?.name || "-"}
                  </TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 120,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {budget.representative?.name || "-"}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>
                    R$ {brMoneyMask((budget.totalValue || 0).toFixed(0))}
                  </TableCell>
                  <TableCell>{formatDate(budget.createdAt)}</TableCell>
                  <TableCell>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                        gap: 0.5,
                      }}
                    >
                      <Tooltip title="Ver PDF">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenPdf(budget)}
                          sx={{ color: "#1976D2" }}
                        >
                          <PictureAsPdf fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton
                          size="small"
                          onClick={() =>
                            navigate(`/Orcamentos/Editar/${budget.id}`)
                          }
                          sx={{ color: "#2C3E50" }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Ver detalhes">
                        <IconButton
                          size="small"
                          onClick={() => navigate("/Orcamentos")}
                          sx={{ color: "#666" }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    Nenhum orçamento encontrado
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Link para ver todos */}
      {recentBudgets.length > 0 && (
        <Box sx={{ mt: 2, textAlign: "right" }}>
          <Button
            variant="text"
            size="small"
            onClick={() => navigate("/Orcamentos")}
            sx={{ textTransform: "none" }}
          >
            Ver todos os orçamentos →
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default RecentBudgets;

import React from "react";
import { Box, Button, Collapse } from "@mui/material";
import {
  FileOpen,
  KeyboardArrowDown,
  Inventory,
  Info,
} from "@mui/icons-material";
import { IBudget } from "../../interfaces/ibudget";
import { brMoneyMask } from "../../utils/Masks";

interface BudgetListItemProps {
  budget: IBudget;
  expanded: boolean;
  onToggle: (id: string) => void;
  onOpenPdf: (budget: IBudget) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const formatDate = (timestamp: { seconds: number } | undefined) => {
  if (!timestamp?.seconds) return "-";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
};

/**
 * Linha (com detalhes recolhíveis) da lista de orçamentos (EST F3.2).
 * Extraída de `Budgets.tsx`. Estrutura/classes preservadas (Budgets.css).
 */
const BudgetListItem: React.FC<BudgetListItemProps> = ({
  budget,
  expanded,
  onToggle,
  onOpenPdf,
  onEdit,
  onDelete,
}) => (
  <Box className={`budget-list-item ${expanded ? "expanded" : ""}`}>
    <Box className="budget-row" onClick={() => onToggle(budget.id)}>
      <span className="budget-id">#{budget.id}</span>
      <span className="budget-client" title={budget.client?.name}>
        {budget.client?.name || "-"}
      </span>
      <span
        className="budget-representative"
        title={budget.representative?.name}
      >
        {budget.representative?.name || "-"}
      </span>
      <span className="budget-value">
        R$ {brMoneyMask((budget.totalValue || 0).toFixed(0))}
      </span>
      <span className="budget-date">{formatDate(budget.createdAt)}</span>
      <span className={`expand-icon ${expanded ? "rotated" : ""}`}>
        <KeyboardArrowDown />
      </span>
    </Box>

    <Collapse in={expanded} timeout="auto" unmountOnExit>
      <Box className="budget-details">
        <Box className="details-grid">
          {/* Produtos */}
          <Box className="detail-section">
            <h4>
              <Inventory /> Produtos
            </h4>
            <ul className="products-list">
              {budget.selectedProducts?.map((item, idx) => {
                const unitValue =
                  item.customUnitValue ?? item.product?.unitValue ?? 0;
                return (
                  <li key={idx}>
                    <span className="product-name">{item.product?.name}</span>
                    <span className="product-price">
                      {item.quantity}x R$ {brMoneyMask(unitValue.toFixed(0))}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Box>

          {/* Detalhes */}
          <Box className="detail-section">
            <h4>
              <Info /> Detalhes
            </h4>
            <Box className="detail-row">
              <span className="detail-label">Prazo de Entrega:</span>
              <span className="detail-value">{budget.estimatedDate || "-"}</span>
            </Box>
            <Box className="detail-row">
              <span className="detail-label">Validade:</span>
              <span className="detail-value">{budget.maxDealDate || "-"}</span>
            </Box>
            <Box className="detail-row">
              <span className="detail-label">Pagamento:</span>
              <span className="detail-value">{budget.paymentTerms || "-"}</span>
            </Box>
            <Box className="detail-row">
              <span className="detail-label">Frete:</span>
              <span className="detail-value">{budget.shippingTerms || "-"}</span>
            </Box>
            <Box className="detail-row">
              <span className="detail-label">Garantia:</span>
              <span className="detail-value">{budget.guarantee || "-"}</span>
            </Box>
          </Box>
        </Box>

        {/* Ações */}
        <Box className="budget-actions">
          <Button
            variant="outlined"
            startIcon={<FileOpen />}
            onClick={(e) => {
              e.stopPropagation();
              onOpenPdf(budget);
            }}
          >
            Ver PDF
          </Button>
          <Button
            variant="contained"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(budget.id);
            }}
          >
            Editar
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(budget.id);
            }}
          >
            Excluir
          </Button>
        </Box>
      </Box>
    </Collapse>
  </Box>
);

export default BudgetListItem;

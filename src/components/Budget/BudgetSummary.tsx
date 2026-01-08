import React from "react";
import { Box, Typography } from "@mui/material";
import { brMoneyMask } from "../../utils/Masks";

interface BudgetSummaryProps {
  totalValue: number;
}

const BudgetSummary: React.FC<BudgetSummaryProps> = ({ totalValue }) => {
  return (
    <Box mt={2} p={2} borderRadius={4} bgcolor="#f9f9f9">
      <Typography variant="h6">
        Valor Total: R$ {brMoneyMask((totalValue || 0).toFixed(0))}
      </Typography>
    </Box>
  );
};

export default BudgetSummary;

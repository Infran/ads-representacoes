import React from "react";
import { Modal, Box, Paper, Typography, Button } from "@mui/material";
import { deleteBudget } from "../../../services/budgetServices";
import { IBudget } from "../../../interfaces/ibudget";
import { brMoneyMask } from "../../../utils/Masks";

interface DeleteBudgetModalProps {
  open: boolean;
  onClose: () => void;
  budget: IBudget;
}

const DeleteBudgetModal: React.FC<DeleteBudgetModalProps> = ({ open, onClose, budget }) => {
  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      onClose();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        height="100vh"
      >
        <Paper
          sx={{
            padding: 2,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Typography variant="h6">
            Tem certeza que deseja excluir este orçamento?
          </Typography>
          <Box
            display="flex"
            flexDirection="column"
            gap={2}
            sx={{
              backgroundColor: "#e0f7fa",
              padding: 2,
              borderRadius: 2,
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 600 }}>
              Cliente: {budget.client.name}
            </Typography>
            <Typography variant="body2" sx={{ marginBottom: 1 }}>
              Produtos:
            </Typography>
            <Box
              component="ul"
              sx={{
                padding: 0,
                margin: 0,
                listStyle: "none",
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              {budget.selectedProducts.map((item, index) => (
                <Box
                  key={index}
                  component="li"
                  display="flex"
                  justifyContent="space-between"
                  sx={{
                    backgroundColor: "#ffffff",
                    padding: "6px 12px",
                    borderRadius: 1,
                    boxShadow: "0px 1px 3px rgba(0,0,0,0.2)",
                  }}
                >
                  <Typography variant="body2" noWrap>
                    {item.product.name}
                  </Typography>
                  <Typography variant="body2" noWrap>
                    {item.quantity} x R$ {brMoneyMask(item.product.unitValue.toFixed(0))}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button variant="contained" color="error" onClick={() => handleDelete(budget.id)}>
              Excluir
            </Button>
            <Button variant="contained" onClick={onClose}>
              Cancelar
            </Button>
          </Box>
        </Paper>
      </Box>
    </Modal>
  );
};

export default DeleteBudgetModal;

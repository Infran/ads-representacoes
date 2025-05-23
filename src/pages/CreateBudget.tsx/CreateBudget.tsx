
import BudgetForm from "../../components/BudgetForm/BudgetForm";
import { Box } from "@mui/material";

const NewCreateBudget = () => {
  return (
    <Box>
      <BudgetForm title="Adicionar Orçamento" isEditing={false} />
    </Box>
  );
};

export default NewCreateBudget;

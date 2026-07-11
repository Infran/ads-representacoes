import React from "react";
import { UseBudgetFormReturn } from "../../hooks/useBudgetForm";
import BudgetTermsForm from "./BudgetTermsForm";

interface TermsSectionProps {
  form: UseBudgetFormReturn;
}

/**
 * Seção "Condições Comerciais" do formulário de orçamento (EST F3.1).
 */
const TermsSection: React.FC<TermsSectionProps> = ({ form }) => (
  <BudgetTermsForm
    budget={form.budget}
    onChange={(updates) => form.setBudget((prev) => ({ ...prev, ...updates }))}
  />
);

export default TermsSection;

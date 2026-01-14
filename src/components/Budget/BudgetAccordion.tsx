import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  Button,
  ButtonGroup,
} from "@mui/material";
import {
  ExpandMore,
  CheckCircle,
  RadioButtonUnchecked,
  UnfoldMore,
  UnfoldLess,
} from "@mui/icons-material";

export interface AccordionSectionProps {
  id: string;
  title: string;
  isComplete: boolean;
  statusText?: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

interface BudgetAccordionProps {
  sections: AccordionSectionProps[];
  expandedPanels: string[];
  onPanelChange: (
    panel: string
  ) => (event: React.SyntheticEvent, isExpanded: boolean) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

const getStatusIcon = (isComplete: boolean) => {
  if (isComplete) {
    return <CheckCircle sx={{ color: "success.main", fontSize: 20 }} />;
  }
  return <RadioButtonUnchecked sx={{ color: "text.disabled", fontSize: 20 }} />;
};

const getStatusChip = (isComplete: boolean, statusText?: string) => {
  if (!statusText) return null;

  return (
    <Chip
      size="small"
      label={statusText}
      color={isComplete ? "success" : "default"}
      variant={isComplete ? "filled" : "outlined"}
      sx={{ ml: 2, fontSize: "0.75rem" }}
    />
  );
};

const BudgetAccordion: React.FC<BudgetAccordionProps> = ({
  sections,
  expandedPanels,
  onPanelChange,
  onExpandAll,
  onCollapseAll,
}) => {
  const allExpanded = expandedPanels.length === sections.length;
  const noneExpanded = expandedPanels.length === 0;

  return (
    <Box sx={{ width: "100%" }}>
      {/* Botões de Expandir/Recolher Todos */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 1 }}>
        <ButtonGroup size="small" variant="text">
          <Button
            onClick={onExpandAll}
            disabled={allExpanded}
            startIcon={<UnfoldMore />}
            sx={{ textTransform: "none" }}
          >
            Expandir todos
          </Button>
          <Button
            onClick={onCollapseAll}
            disabled={noneExpanded}
            startIcon={<UnfoldLess />}
            sx={{ textTransform: "none" }}
          >
            Recolher todos
          </Button>
        </ButtonGroup>
      </Box>

      {sections.map((section) => (
        <Accordion
          key={section.id}
          expanded={expandedPanels.includes(section.id)}
          onChange={onPanelChange(section.id)}
          sx={{
            mb: 1,
            borderRadius: 2,
            "&:before": { display: "none" },
            boxShadow: expandedPanels.includes(section.id) ? 3 : 1,
            transition: "box-shadow 0.2s ease-in-out",
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMore />}
            sx={{
              borderRadius: 2,
              "&:hover": { bgcolor: "action.hover" },
              "& .MuiAccordionSummary-content": {
                alignItems: "center",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {getStatusIcon(section.isComplete)}
              <Typography variant="h6" sx={{ fontWeight: 500 }}>
                {section.title}
              </Typography>
              {getStatusChip(section.isComplete, section.statusText)}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 2, pb: 3 }}>
            {section.children}
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
};

export default BudgetAccordion;

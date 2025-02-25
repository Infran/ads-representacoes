import React, { useEffect, useState } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  ArrowDropDown,
  ArrowDropUp,
  FileOpen,
  NoteAdd
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { getBudgets } from "../../services/budgetServices";
import { IBudget } from "../../interfaces/ibudget";
import { BudgetPdfPage } from "../../utils/PDFGenerator/BudgetPdf";
import ReactDOM from "react-dom";
import DeleteBudgetModal from "../../components/Modal/Delete/DeleteBudgetModal";
import SearchBar from "../../components/SearchBar/SearchBar";

const Budgets = () => {
  const navigate = useNavigate();
  const [budgetlist, setBudgetList] = useState<IBudget[]>([]);
  const [expandedIds, setExpandedIds] = useState<{ [key: number]: boolean }>({});
  const [search, setSearch] = useState<string>("");
  const [filteredBudgets, setFilteredBudgets] = useState<IBudget[]>([]);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const handleSearch = () => {
    const filtered = budgetlist.filter((budget) => {
      return (
        budget.client.name.toLowerCase().includes(search.toLowerCase()) ||
        budget.selectedProducts
          .map((item) => item.product.name)
          .join(", ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
    setFilteredBudgets(filtered);
    console.log("Filtrado:", filtered);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const budgets: IBudget[] = await getBudgets();
      setBudgetList(budgets);
      setFilteredBudgets(budgets);
    };
    fetchData();
  }, []);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2}>
        <PageHeader
          title="Orçamentos"
          description="Gerencie seus orçamentos"
          icon={NoteAdd}
        />

    
          <SearchBar
            search={search}
            onSearchChange={(e) => setSearch(e.target.value)}
            onSearch={handleSearch}
            onAdd={() => navigate("/Orcamentos/Adicionar")}
            inputLabel="Digite o nome do produto"
          />
        
        {filteredBudgets?.map((budget) => (
          <React.Fragment key={budget.id}>
            <Card
              sx={{
                marginBottom: 1,
                padding: 1.5,
                borderRadius: 1,
                boxShadow: 1,
                opacity: 0.8,
                ":hover": {
                  cursor: "pointer",
                  opacity: 1,
                  transition: "0.3s",
                  boxShadow: 4,
                },
              }}
            >
              <CardContent
                sx={{
                  padding: "8px 16px",
                  "&:last-child": { paddingBottom: "8px" },
                }}
              >
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  onClick={() => toggleExpand(budget.id.toString())}
                >
                  <Box>
                    <Typography variant="subtitle1" noWrap>
                      {budget.client.name} -{" "}
                      {budget.selectedProducts
                        .map((item) => item.product.name)
                        .join(", ")}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      R$ {budget.totalValue.toFixed(2)} | {budget.estimatedDate}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={1}>
                    <IconButton
                      size="small"
                      title="Visualizar PDF"
                      onClick={() => {
                        const newTab = window.open("", "_blank");
                        if (newTab) {
                          newTab.document.write(`
                          <html>
                            <head>
                              <style>
                                body, html {
                                  margin: 0;
                                  padding: 0;
                                  width: 100%;
                                  height: 100%;
                                }
                                #react-root {
                                  margin: 0;
                                  padding: 0;
                                  width: 100%;
                                  height: 100%;
                                }
                              </style>
                            </head>
                            <body>
                              <div id="react-root"></div>
                            </body>
                          </html>
                        `);
                          newTab.document.close();
                          ReactDOM.render(
                            <BudgetPdfPage budget={budget} />,
                            newTab.document.getElementById("react-root")
                          );
                        }
                      }}
                    >
                      <FileOpen />
                    </IconButton>
                    <IconButton
                      size="small"
                      title="Detalhes"
                      onClick={() => toggleExpand(budget.id.toString())}
                    >
                      {expandedIds[budget.id] ? (
                        <ArrowDropUp />
                      ) : (
                        <ArrowDropDown />
                      )}
                    </IconButton>
                  </Box>
                </Box>
                <Collapse
                  in={expandedIds[budget.id]}
                  timeout="auto"
                  unmountOnExit
                >
                  <Box marginTop={1}>
                    <Typography variant="caption" color="text.secondary">
                      Produtos:
                    </Typography>
                    <Box
                      component="ul"
                      sx={{
                        padding: 0,
                        margin: 0,
                        listStyle: "none",
                        maxHeight: "80px",
                        overflow: "auto",
                      }}
                    >
                      {budget.selectedProducts
                        .slice(0, 2)
                        .map((item, index) => (
                          <Box
                            key={index}
                            component="li"
                            display="flex"
                            justifyContent="space-between"
                          >
                            <Typography variant="body2" noWrap>
                              {item.product.name}
                            </Typography>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              noWrap
                            >
                              {item.quantity} x R${" "}
                              {item.product.unitValue.toFixed(2)}
                            </Typography>
                          </Box>
                        ))}
                    </Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      marginTop={1}
                    >
                      Garantia: {budget.guarantee} | Impostos: NOS PREÇOS ACIMA
                      JÁ ESTÃO INCLUSOS OS IMPOSTOS
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="flex-end" marginTop={1}>
                    <Button
                      variant="contained"
                      onClick={() => {navigate(`/Orcamentos/Editar/${budget.id}`)}}
                      sx={{ marginRight: 1 }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setDeleteModalId(budget.id);
                      }}
                    >
                      Excluir
                    </Button>
                  </Box>
                </Collapse>
              </CardContent>
            </Card>
            <DeleteBudgetModal
              open={deleteModalId === budget.id}
              onClose={() => setDeleteModalId(null)}
              budget={budget}
            />
          </React.Fragment>
        ))}
      </Box>
    </>
  );
};

export default Budgets;

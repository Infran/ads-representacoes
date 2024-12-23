import React, { useEffect } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  AddCircle,
  ArrowDropDown,
  ArrowDropUp,
  FileOpen,
  NoteAdd,
  Search,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Card,
  CardContent,
  Collapse,
  IconButton,
  Paper,
  TextField,
  Typography,
  styled,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { fetchBudgets } from "../../services/budgetServices";
import { IBudget } from "../../interfaces/ibudget";
import { BudgetPdfPage } from "../../utils/PDFGenerator/BudgetPdf";
import ReactDOM from "react-dom";

const StyledPaper = styled(Paper)({
  padding: 16,
  display: "flex",
  flexDirection: "column",
  gap: 16,
});

const ButtonGroup = styled(Box)({
  display: "flex",
  gap: 16,
});

// const budget: IBudget = {
//   id: 1,
//   client: {
//     name: "Hiago Gabriel Oliveira Pinto",
//     email: "hiago@email.com",
//     phone: "(11) 4991-6085",
//     mobilePhone: "(11) 99999-9999",
//     address:
//       "ADIMIX IND.COM.ADITIVOS PARA PANIFICACAO LTDA RUA GIL TEIXEIRA LINO,140 - PQ. INDUSTRIAL II",
//   },
//   products: [
//     {
//       quantity: 1,
//       product: {
//         id: 2,
//         name: 'CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1"',
//         description: 'CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1"',
//         ncm: "123456",
//         icms: "12%",
//         unitValue: 23100.0,
//       },
//     },
//     {
//       quantity: 1,
//       product: {
//         id: 3,
//         name: 'CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1"',
//         description: 'CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1"',
//         ncm: "123456",
//         icms: "12%",
//         unitValue: 100.0,
//       },
//     },
//   ],
//   estimatedDate: "25/06/2024",
//   maxDealDate: "28 DDL",
//   guarantee:
//     "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO",
//   tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
//   totalValue: 80000.0,
//   createdAt: new Date("2024-06-25"),
//   updatedAt: new Date(),
// };

const Budgets = () => {
  const navigate = useNavigate();
  const [budgetlist, setBudgetList] = useState<IBudget[]>([]);
  const [expandedIds, setExpandedIds] = useState<{ [key: number]: boolean }>(
    {}
  );
  const [search, setSearch] = useState<string>("");
  const [filteredBudgets, setFilteredBudgets] = useState<IBudget[]>([]);

  const handleSearch = () => {
    const filtered = budgetlist.filter((budget) => {
      return (
        budget.client.name.toLowerCase().includes(search.toLowerCase()) ||
        budget.products
          .map((item) => item.product.name)
          .join(", ")
          .toLowerCase()
          .includes(search.toLowerCase())
      );
    });
    setFilteredBudgets(filtered);
    console.log("Filtrado:", filtered);
  }

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  useEffect(() => {
    const fetchData = async () => {
      const budgets = await fetchBudgets();
      setBudgetList(budgets);
      setFilteredBudgets(budgets);
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log(budgetlist);
  }, [budgetlist]);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2}>
        <PageHeader
          title="Orçamentos"
          description="Gerencie seus orçamentos"
          icon={NoteAdd}
        />

        <StyledPaper>
          <Box
            display="flex"
            flexDirection={"row"}
            gap={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <ButtonGroup>
              <Button variant="contained" type="submit" onClick={handleSearch}>
                <Box display="flex" gap={0.5}>
                  Pesquisar
                  <Search />
                </Box>
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  navigate("/Orcamentos/Adicionar");
                }}
              >
                <Box display="flex" gap={0.5}>
                  Adicionar
                  <AddCircle />
                </Box>
              </Button>
            </ButtonGroup>
            <Box flex={1}>
              <TextField
                label="Digite o nome do produto"
                variant="outlined"
                size="small"
                fullWidth
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </Box>
          </Box>
        </StyledPaper>
        {/* Budget List item example, using budget variabele */}
        {filteredBudgets.map((budget) => (
          <Card
            key={budget.id} // Adicione uma key única para o React
            sx={{
              marginBottom: 1,
              padding: 1.5,
              borderRadius: 1,
              boxShadow: 1,
            }}
          >
            <CardContent
              sx={{
                padding: "8px 16px",
                "&:last-child": { paddingBottom: "8px" },
              }}
            >
              {/* Informações principais */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                {/* Dados principais */}
                <Box>
                  <Typography variant="subtitle1" noWrap>
                    {budget.client.name} -{" "}
                    {budget.products
                      .map((item) => item.product.name)
                      .join(", ")}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    R$ {budget.totalValue.toFixed(2)} | {budget.estimatedDate}
                  </Typography>
                </Box>

                {/* Ações */}
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
                                /* Zera o estilo do body e da div root */
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
                    onClick={() => toggleExpand(budget.id)}
                  >
                    {expandedIds[budget.id] ? (
                      <ArrowDropUp />
                    ) : (
                      <ArrowDropDown />
                    )}
                  </IconButton>
                </Box>
              </Box>

              {/* Informações adicionais (colapsáveis) */}
              <Collapse
                in={expandedIds[budget.id]}
                timeout="auto"
                unmountOnExit
              >
                <Box marginTop={1}>
                  {/* Produtos */}
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
                    {budget.products.slice(0, 2).map((item, index) => (
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

                  {/* Garantia e Impostos */}
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    marginTop={1}
                  >
                    Garantia: {budget.guarantee} | Impostos: NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS
                  </Typography>
                </Box>
              </Collapse>
            </CardContent>
          </Card>
        ))}
      </Box>
    </>
  );
};

export default Budgets;

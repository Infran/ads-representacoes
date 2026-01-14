import {
  Document,
  Page,
  Text,
  StyleSheet,
  PDFViewer,
  Image,
  Font,
} from "@react-pdf/renderer";
import { IBudget } from "../../interfaces/ibudget";

// Desabilitar hyphenation para evitar erros com caracteres especiais
Font.registerHyphenationCallback((word) => [word]);

import { format } from "date-fns";
import { brMoneyMask } from "../Masks";

const getClientFirstName = (clientName: string) => {
  return clientName.split(" ")[0];
};

const wrapText = (text: string, limit: number = 40): string => {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= limit) {
      currentLine += (currentLine ? " " : "") + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join("\n");
};

// Stylesheet
const styles = StyleSheet.create({
  body: {
    padding: "25px",
    marginTop: "35px",
    fontFamily: "Times-Roman",
  },
  divider: {
    maxWidth: "100%",
    borderBottom: "1px solid black",
    marginTop: "10px",
    marginBottom: "5px",
  },

  headerContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    justifyContent: "center",
  },
  image: {
    width: "120px",
  },
  headerTextContainer: {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    textAlign: "center",
    width: "100%",
    marginRight: "20px",
  },
  headerTitle: {
    fontSize: "20px",
  },
  subHeader: {
    fontSize: "12px",
  },
  clientAddressInfoContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "10px",
  },
  clientCompanyInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "10.5px",
  },
  dateTime: {
    display: "flex",
    flexDirection: "column",
    fontSize: "9.5px",
    marginTop: "auto",
  },
  clientInfoContainer: {
    display: "flex",
    flexDirection: "row",
    width: "100%",
    marginTop: "20px",
    justifyContent: "space-between",
  },
  clientInfoContainerGrid: {
    fontSize: "9.5px",
    width: "100%",
    display: "flex",
  },
  budgetId: {
    fontSize: "9.5px",
    marginTop: "20px",
    marginLeft: "auto",
  },
  budgetTotalValue: {
    fontSize: "9.5px",
    marginTop: "20px",
    marginLeft: "auto",
  },
  budgetFooterInfoContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: "20px",
    fontSize: "9px",
    marginBottom: "20px",
    gap: "20px",
    maxWidth: "90%",
  },
  budgetFooterInfoLabels: {
    display: "flex",
    flexDirection: "column",
    fontSize: "9px",
    gap: "10px",
  },
  budgetFooterInfo: {
    display: "flex",
    flexDirection: "column",
    fontSize: "9px",
    gap: "10px",
    maxWidth: "100%",
    paddingRight: "20px",
  },
  budgetInfoContainer: {
    fontSize: "9.5px",
    marginTop: "20px",
  },

  budgetFooterInfoContainer2: {
    fontSize: "9.5px",
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    marginTop: "20px",
    fontSize: "9.5px",
    width: "100%",
  },
  tableContentContainer: {
    display: "flex",
    flexDirection: "column",
    marginTop: "5px",
    gap: "10px",
  },
  tableContent: {
    display: "flex",
    flexDirection: "row",
    fontSize: "9.5px",
    width: "100%",
  },
  tableContentLargeSpacing: {
    width: "50%",
  },
  tableContentSmallSpacing: {
    width: "14%",
  },
});

const BudgetTemplate = ({ budget }: { budget: IBudget }) => {
  // Proteção contra dados incompletos durante criação
  const clientName = budget?.client?.name || "CLIENTE NÃO SELECIONADO";
  const clientAddress = budget?.client?.address || "";
  const clientCep = budget?.client?.cep || "";
  const clientCity = budget?.client?.city || "";
  const clientState = budget?.client?.state || "";
  const representativeName =
    budget?.representative?.name || "REPRESENTANTE NÃO SELECIONADO";
  const representativeRole = budget?.representative?.role || "";
  const representativePhone = budget?.representative?.phone || "";
  const representativeEmail = budget?.representative?.email || "";
  const products = budget?.selectedProducts || [];
  const total = budget?.totalValue || 0;

  return (
    <Document>
      <Page style={styles.body}>
        <div style={styles.headerContainer}>
          <Image style={styles.image} src="/logo.png" />
          <div style={styles.headerTextContainer}>
            <Text style={styles.headerTitle} fixed>
              ADS Representações e Equipamentos
            </Text>
            <Text style={styles.subHeader} fixed>
              R. Kitaro Ywasa, 269 - Mauá - SP - CEP 09390-670 - Fone: (11)
              93007-0518
            </Text>
            <Text style={styles.subHeader} fixed>
              alexandredias.representacoes@gmail.com
            </Text>
          </div>
        </div>
        <div style={styles.clientCompanyInfo}>
          <Text style={{ fontSize: "12px", marginTop: "20px" }}>
            {clientName.toLocaleUpperCase()}
          </Text>
        </div>
        <div style={styles.clientAddressInfoContainer}>
          <div style={styles.clientCompanyInfo}>
            <Text>{wrapText(clientAddress, 50)}</Text>
            <Text style={{ marginTop: "5px" }}>
              {clientCep} {clientCity.toLocaleUpperCase()}{" "}
              {clientState ? `- ${clientState}` : ""}
            </Text>
          </div>
          <div style={styles.dateTime}>
            {budget?.createdAt && (
              <Text>
                Data:{" "}
                {format(new Date(budget.createdAt.toDate()), "dd/MM/yyyy")}
              </Text>
            )}
          </div>
        </div>
        <div style={styles.clientInfoContainer}>
          <div style={styles.clientInfoContainerGrid}>
            <Text>Att.: {representativeName.toLocaleUpperCase()}</Text>
            <Text>Depto.: {representativeRole}</Text>
          </div>
          <div style={styles.clientInfoContainerGrid}>
            <Text>Fone: {representativePhone}</Text>
            <Text>E-mail: {representativeEmail}</Text>
          </div>
          {/*live divider */}
        </div>
        <hr style={styles.divider} />
        <div style={styles.clientCompanyInfo}>
          {budget?.reference && (
            <Text>Ref.: {budget.reference.toLocaleUpperCase()}</Text>
          )}
        </div>
        <div style={styles.budgetId}>
          <Text>Orçamento num.: {budget?.id || "RASCUNHO"}</Text>
        </div>
        <div style={styles.budgetInfoContainer}>
          <Text>Prezado(a) {getClientFirstName(representativeName)},</Text>
          <Text>
            Conforme solicitação, estamos enviando orçamento para fornecimento
            dos ítens abaixo relacionados:
          </Text>
          {/* Table item, descrição do produto, qtde, prelo unit e valor total */}
          <div style={styles.tableHeader}>
            <Text style={styles.tableContentSmallSpacing}>Item</Text>
            <Text style={styles.tableContentLargeSpacing}>
              Descrição do Produto
            </Text>
            <Text style={styles.tableContentSmallSpacing}>Qtde.</Text>
            <Text style={styles.tableContentSmallSpacing}>Preço Unit.</Text>
            <Text style={styles.tableContentSmallSpacing}>Valor Total</Text>
          </div>
          <div style={styles.tableContentContainer}>
            {products.length > 0 ? (
              products.map((product, index) => {
                const unitValue =
                  product.customUnitValue ?? product.product?.unitValue ?? 0;
                const totalValue = product.quantity * unitValue;

                return (
                  <div style={styles.tableContent} key={index}>
                    <Text style={styles.tableContentSmallSpacing}>
                      {index + 1}
                    </Text>
                    <Text style={styles.tableContentLargeSpacing}>
                      {product.product?.name || "Produto"} {"\n"}
                      NCM: {product.product?.ncm || "-"}
                    </Text>
                    <Text style={styles.tableContentSmallSpacing}>
                      {product.quantity}
                    </Text>
                    <Text style={styles.tableContentSmallSpacing}>
                      {brMoneyMask(unitValue.toFixed(0))}
                    </Text>
                    <Text style={styles.tableContentSmallSpacing}>
                      {brMoneyMask(totalValue.toFixed(0))}
                    </Text>
                  </div>
                );
              })
            ) : (
              <div style={styles.tableContent}>
                <Text style={{ fontStyle: "italic", color: "#666" }}>
                  Nenhum produto selecionado
                </Text>
              </div>
            )}
          </div>
        </div>
        <div style={styles.budgetTotalValue}>
          <Text>Total do Orçamento: {brMoneyMask(total.toFixed(0))}</Text>
        </div>
        <div style={styles.budgetFooterInfoContainer}>
          <div style={styles.budgetFooterInfoLabels}>
            <Text>Cond. de Entrega:</Text>
            <Text>Cond. Pagamento:</Text>
            <Text>Prazo p/ Entrega</Text>
            <Text>Val. da Proposta:</Text>
            <Text>Garantia:</Text>
            <Text style={{ marginTop: "10px" }}>Impostos:</Text>
          </div>
          <div style={styles.budgetFooterInfo}>
            <Text>{budget?.shippingTerms || "-"}</Text>
            <Text>{budget?.paymentTerms || "-"}</Text>
            <Text>{budget?.estimatedDate || "-"}</Text>
            <Text>{budget?.maxDealDate || "-"}</Text>
            <Text>{budget?.guarantee || "-"}</Text>
            <Text>{budget?.tax || "-"}</Text>
          </div>
        </div>
        <Text style={styles.budgetFooterInfo}> Atenciosamente </Text>
        <div style={styles.budgetFooterInfoContainer2}>
          <Text>ALEXANDRE DIAS</Text>
          <Text>alexandredias.representacoes@gmail.com</Text>
        </div>
      </Page>
    </Document>
  );
};

// Exportar template para uso no preview
export { BudgetTemplate };

export const BudgetPdfPage = ({ budget }: { budget: IBudget }) => {
  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <BudgetTemplate budget={budget} />
    </PDFViewer>
  );
};

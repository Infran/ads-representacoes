import {
  Document,
  Page,
  Text,
  StyleSheet,
  PDFViewer,
  Image,
} from "@react-pdf/renderer";
import { Font } from "@react-pdf/renderer";
import { IBudget } from "../../interfaces/ibudget";
// Register Font
//Times new roman
Font.register({
  family: "Times New Roman",
  src: "./fonts/times_new_roman.ttf",
});

const getClientFirstName = (clientName: string) => {
  return clientName.split(" ")[0];
};

const getFormattedMoney = (value: number) => {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
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
    fontFamily: "Times New Roman",
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
    marginRight: "40px",
  },
  headerTitle: {
    fontSize: "24px",
  },
  subHeader: {
    fontSize: "12px",
  },
  clientAddressInfoContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: "20px",
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
    marginTop: "10px",
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
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
  return (
      <Document>
        <Page style={styles.body}>
          <div style={styles.headerContainer}>
            <Image style={styles.image} src="logo.png" />
            <div style={styles.headerTextContainer}>
              <Text style={styles.headerTitle} fixed>
                ADS Representações e Equipamentos
              </Text>
              <Text style={styles.subHeader} fixed>
              R. Kitaro Ywasa, 269 - Mauá - SP - CEP 09390-670 - Fone: (11) 93007-0518
              </Text>
              <Text style={styles.subHeader} fixed>
                vaportotal@uol.com.br
              </Text>
            </div>
          </div>
          <div style={styles.clientAddressInfoContainer}>
            <div style={styles.clientCompanyInfo}>
              <Text>{wrapText(budget.client.address, 50)}</Text>
            </div>
            <div style={styles.dateTime}>
              
            </div>
          </div>
          <div style={styles.clientInfoContainer}>
            <div style={styles.clientInfoContainerGrid}>
              <Text>Att.: {budget.representative.name.toLocaleUpperCase()}</Text>
              <Text>Depto.: {budget.representative.role}</Text>
            </div>
            <div style={styles.clientInfoContainerGrid}>
              <Text>Fone: {budget.representative.phone}</Text>
              <Text>E-mail: {budget.representative.email}</Text>
            </div>
            {/*live divider */}
          </div>
          <hr style={styles.divider} />
          <div style={styles.clientCompanyInfo}>
            {budget.reference && (
              <Text>
                Ref.: {budget.reference.toLocaleUpperCase()}
              </Text>
            )}
          </div>
          <div style={styles.budgetId}>
            <Text>Orçamento num.: {budget.id}</Text>
          </div>
          <div style={styles.budgetInfoContainer}>
            <Text>Prezado(a) {getClientFirstName(budget.representative.name)},</Text>
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
              {budget.selectedProducts.map((product, index) => (
                <div style={styles.tableContent}>
                  <Text style={styles.tableContentSmallSpacing}>{index + 1}</Text>
                  <Text style={styles.tableContentLargeSpacing}>
                    {product.product.name} {/*  break line */} {"\n"}
                    NCM: {product.product.ncm}
                  </Text>
                  <Text style={styles.tableContentSmallSpacing}>{product.quantity}</Text>
                  <Text style={styles.tableContentSmallSpacing}>{getFormattedMoney(product.product.unitValue)}</Text>
                  <Text style={styles.tableContentSmallSpacing}>
                    {getFormattedMoney(
                      product.quantity * product.product.unitValue
                    )}
                  </Text>
                </div>
              ))}
              {/* <div style={styles.tableContent}>
                <Text>1</Text>
                <Text style={styles.tableContentProductDescription}>CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1"</Text>
                <Text>1</Text>
                <Text>100,00</Text>
                <Text>100,00</Text>
              </div> */}
            </div>
          </div>
          <div style={styles.budgetTotalValue}>
            <Text>Valor Total: {getFormattedMoney(budget.totalValue)}</Text>
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
              <Text>{budget.shippingTerms}</Text>
              <Text>{budget.paymentTerms}</Text>
              <Text>À COMBINAR</Text>
              <Text>{budget.maxDealDate}</Text>
              <Text>{budget.guarantee}</Text>
              <Text>{budget.tax}</Text>
            </div>
          </div>
          <Text style={styles.budgetFooterInfo}> Atenciosamente </Text>
          <div style={styles.budgetFooterInfoContainer2}>
            <Text>Alexandre Dias</Text>
          </div>
        </Page>
      </Document>
  );
};

export const BudgetPdfPage = ({ budget }: { budget: IBudget }) => {
  return (
    <PDFViewer style={{ width: "100%", height: "100vh" }}>
      <BudgetTemplate budget={budget} />
    </PDFViewer>
  );
}

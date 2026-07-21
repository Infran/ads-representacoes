import { describe, expect, it } from "vitest";
import { Timestamp } from "firebase/firestore";
import { IBudget } from "../../interfaces/ibudget";

// Smoke test do gerador de PDF: renderiza o template inteiro até o blob.
// Existe porque a falha de geração só se manifestava em runtime, e o catch de
// `openBudgetPdf` engolia a causa (logger silencioso em produção).
describe("BudgetPdf", () => {
  it("renderiza um orçamento completo até o blob", async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { BudgetTemplate } = await import("./BudgetPdf");

    const budget = {
      id: "42",
      client: {
        id: "1",
        name: "Cliente Teste LTDA",
        email: "teste@example.com",
        phone: "19999999999",
        cnpj: "12345678000199",
        cep: "13010000",
        address: "Rua X, 500",
        city: "Campinas",
        state: "São Paulo",
        uf: "SP",
      },
      representative: {
        id: "7",
        name: "Representante Teste",
        role: "Comprador",
        email: "rep@example.com",
        phone: "19988888888",
        city: "Campinas",
        state: "São Paulo",
        uf: "SP",
      },
      selectedProducts: [
        {
          product: {
            id: "1",
            name: "Produto Teste",
            ncm: "84212300",
            description: "Descrição do produto",
            unitValue: 150000,
          },
          quantity: 2,
        },
      ],
      totalValue: 300000,
      estimatedDate: "30 dias",
      maxDealDate: "15 dias",
      guarantee: "12 meses",
      shippingTerms: "CIF",
      reference: "REF-001",
      tax: "IMPOSTOS INCLUSOS",
      createdAt: Timestamp.fromDate(new Date("2026-07-20T12:00:00Z")),
    } as unknown as IBudget;

    const blob = await pdf(<BudgetTemplate budget={budget} />).toBlob();

    expect(blob.size).toBeGreaterThan(0);
  }, 60_000);

  // Regressão do bug relatado em produção: o orçamento vindo do localStorage
  // trazia `createdAt` como `{seconds, nanoseconds}` (JSON achata o Timestamp),
  // e o `.toDate()` do template derrubava a geração inteira. A causa é corrigida
  // no cacheService; aqui garantimos que o PDF não quebra nem assim.
  it("gera mesmo com createdAt achatado pela serialização JSON", async () => {
    const { pdf } = await import("@react-pdf/renderer");
    const { BudgetTemplate } = await import("./BudgetPdf");

    const budget = {
      id: "42",
      client: { id: "1", name: "Cliente Teste LTDA", city: "Campinas", uf: "SP" },
      representative: { id: "7", name: "Rep Teste", city: "Campinas", uf: "SP" },
      selectedProducts: [],
      totalValue: 0,
      // Exatamente o que JSON.parse(JSON.stringify(timestamp)) devolve.
      createdAt: { seconds: 1784721600, nanoseconds: 0 },
    } as unknown as IBudget;

    const blob = await pdf(<BudgetTemplate budget={budget} />).toBlob();

    expect(blob.size).toBeGreaterThan(0);
  }, 60_000);
});

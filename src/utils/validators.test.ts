import { describe, it, expect } from "vitest";
import { isValidCnpj, isValidCpf } from "./validators";

// Testes unitários dos validadores de documento (SEG S2.2).
// Documentos de referência conhecidamente válidos:
//   CNPJ 11.222.333/0001-81 · CPF 111.444.777-35

describe("isValidCnpj", () => {
  it("aceita um CNPJ válido (com e sem máscara)", () => {
    expect(isValidCnpj("11.222.333/0001-81")).toBe(true);
    expect(isValidCnpj("11222333000181")).toBe(true);
  });

  it("rejeita dígito verificador incorreto", () => {
    expect(isValidCnpj("11.222.333/0001-82")).toBe(false);
    expect(isValidCnpj("11222333000180")).toBe(false);
  });

  it("rejeita comprimento errado e vazio/nulo", () => {
    expect(isValidCnpj("1122233300018")).toBe(false); // 13 dígitos
    expect(isValidCnpj("")).toBe(false);
    expect(isValidCnpj(undefined)).toBe(false);
    expect(isValidCnpj(null)).toBe(false);
  });

  it("rejeita sequências repetidas", () => {
    expect(isValidCnpj("00000000000000")).toBe(false);
    expect(isValidCnpj("11111111111111")).toBe(false);
  });
});

describe("isValidCpf", () => {
  it("aceita um CPF válido (com e sem máscara)", () => {
    expect(isValidCpf("111.444.777-35")).toBe(true);
    expect(isValidCpf("11144477735")).toBe(true);
  });

  it("rejeita dígito verificador incorreto", () => {
    expect(isValidCpf("111.444.777-34")).toBe(false);
  });

  it("rejeita comprimento errado e vazio/nulo", () => {
    expect(isValidCpf("1114447773")).toBe(false); // 10 dígitos
    expect(isValidCpf("")).toBe(false);
    expect(isValidCpf(undefined)).toBe(false);
  });

  it("rejeita sequências repetidas", () => {
    expect(isValidCpf("00000000000")).toBe(false);
    expect(isValidCpf("11111111111")).toBe(false);
  });
});

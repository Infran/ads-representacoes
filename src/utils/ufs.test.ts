import { describe, expect, it } from "vitest";
import { estadoPatch, getEstadoNome, getUf, normalizeUf, ufs } from "./ufs";

describe("ufs", () => {
  it("cobre as 27 UFs", () => {
    expect(ufs).toHaveLength(27);
  });
});

describe("normalizeUf", () => {
  it("resolve pela sigla, pelo nome, e ignora acento/caixa/espaço", () => {
    // As três grafias que existem em produção.
    expect(normalizeUf("SP")?.nome).toBe("São Paulo");
    expect(normalizeUf("São Paulo")?.sigla).toBe("SP");
    expect(normalizeUf("SÃO PAULO")?.sigla).toBe("SP");
    expect(normalizeUf("sao paulo")?.sigla).toBe("SP");
    expect(normalizeUf("  sp  ")?.sigla).toBe("SP");
  });

  it("devolve undefined para input vazio ou irreconhecível", () => {
    expect(normalizeUf(undefined)).toBeUndefined();
    expect(normalizeUf("")).toBeUndefined();
    expect(normalizeUf("Guanabara")).toBeUndefined();
    expect(normalizeUf("Sao Paulo/SP")).toBeUndefined();
  });
});

describe("estadoPatch", () => {
  it("deriva nome e sigla da mesma fonte", () => {
    expect(estadoPatch("SÃO PAULO")).toEqual({ state: "São Paulo", uf: "SP" });
    expect(estadoPatch("sp")).toEqual({ state: "São Paulo", uf: "SP" });
    expect(estadoPatch("Minas Gerais")).toEqual({
      state: "Minas Gerais",
      uf: "MG",
    });
  });

  it("limpa os dois campos quando o input é genuinamente vazio", () => {
    // Ex.: o usuário limpou o dropdown de Estado.
    expect(estadoPatch(undefined)).toEqual({ state: "", uf: "" });
    expect(estadoPatch("")).toEqual({ state: "", uf: "" });
    expect(estadoPatch("   ")).toEqual({ state: "", uf: "" });
  });

  it("devolve null para input irreconhecível em vez de apagar", () => {
    // A decisão central: "não sei interpretar" não pode virar "apaguei" — o
    // chamador pula o patch e preserva o state/uf que já estava gravado.
    expect(estadoPatch("lixo")).toBeNull();
    expect(estadoPatch("Guanabara")).toBeNull();
    expect(estadoPatch("Sao Paulo/SP")).toBeNull();
  });

  it("é seguro espalhar num objeto quando devolve null", () => {
    const anterior = { state: "São Paulo", uf: "SP" };
    expect({ ...anterior, ...(estadoPatch("lixo") ?? {}) }).toEqual(anterior);
  });
});

describe("getUf / getEstadoNome", () => {
  it("lê o formato canônico", () => {
    const canonico = { state: "São Paulo", uf: "SP" };
    expect(getUf(canonico)).toBe("SP");
    expect(getEstadoNome(canonico)).toBe("São Paulo");
  });

  it("tolera o formato legado (sigla em state, sem uf)", () => {
    expect(getUf({ state: "SP" })).toBe("SP");
    expect(getEstadoNome({ state: "SP" })).toBe("São Paulo");
  });

  it("tolera o nome completo em state sem uf", () => {
    expect(getUf({ state: "São Paulo" })).toBe("SP");
    expect(getEstadoNome({ state: "São Paulo" })).toBe("São Paulo");
  });

  it("devolve o valor cru quando não resolve, nunca string vazia", () => {
    // Um registro com grafia inesperada precisa continuar filtrável e rotulável;
    // devolver "" o esconderia de todo filtro de UF e deixaria o chip em branco.
    expect(getUf({ state: "Sao Paulo/SP" })).toBe("Sao Paulo/SP");
    expect(getEstadoNome({ state: "Sao Paulo/SP" })).toBe("Sao Paulo/SP");
    expect(getUf({ uf: "XX" })).toBe("XX");
    expect(getEstadoNome({ uf: "XX" })).toBe("XX");
  });

  it("devolve string vazia só quando não há estado nenhum", () => {
    expect(getUf(undefined)).toBe("");
    expect(getUf({})).toBe("");
    expect(getEstadoNome(undefined)).toBe("");
    expect(getEstadoNome({})).toBe("");
  });
});

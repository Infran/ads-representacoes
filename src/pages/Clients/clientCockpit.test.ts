import { describe, expect, it } from "vitest";
import { IClient } from "../../interfaces/iclient";
import { EMPTY_CLIENT_FILTERS, applyClientFilters } from "./clientCockpit";

const cliente = (id: string, patch: Partial<IClient> = {}): IClient =>
  ({ id, name: `Cliente ${id}`, ...patch } as IClient);

const semOrcamentos = new Map<string, number>();

const filtrar = (clients: IClient[], patch: Partial<typeof EMPTY_CLIENT_FILTERS>) =>
  applyClientFilters(
    clients,
    { ...EMPTY_CLIENT_FILTERS, ...patch },
    semOrcamentos
  ).map((c) => c.id);

describe("applyClientFilters — filtro de UF", () => {
  it("casa o formato canônico", () => {
    const clients = [
      cliente("1", { state: "São Paulo", uf: "SP" }),
      cliente("2", { state: "Minas Gerais", uf: "MG" }),
    ];
    expect(filtrar(clients, { uf: "SP" })).toEqual(["1"]);
  });

  it("casa registros legados que só têm a sigla em state", () => {
    const clients = [cliente("1", { state: "SP" }), cliente("2", { state: "MG" })];
    expect(filtrar(clients, { uf: "SP" })).toEqual(["1"]);
  });

  it("casa registros legados com o nome completo em state", () => {
    const clients = [cliente("1", { state: "SÃO PAULO" })];
    expect(filtrar(clients, { uf: "SP" })).toEqual(["1"]);
  });

  it("mantém alcançável o registro com estado irreconhecível", () => {
    // Ele não casa com "SP", mas casa com o próprio valor cru — que é o que
    // getUf devolve e, portanto, o que aparece como opção no dropdown.
    const clients = [
      cliente("1", { state: "São Paulo", uf: "SP" }),
      cliente("2", { state: "Sao Paulo/SP" }),
    ];
    expect(filtrar(clients, { uf: "SP" })).toEqual(["1"]);
    expect(filtrar(clients, { uf: "Sao Paulo/SP" })).toEqual(["2"]);
  });

  it("sem filtro de UF, devolve todos", () => {
    const clients = [cliente("1", { uf: "SP" }), cliente("2", {})];
    expect(filtrar(clients, {})).toEqual(["1", "2"]);
  });
});

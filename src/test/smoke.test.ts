import { describe, it, expect } from "vitest";

// Teste trivial para validar a infraestrutura de testes (F1.1).
describe("infra de testes", () => {
  it("roda um teste verde", () => {
    expect(1 + 1).toBe(2);
  });

  it("tem o ambiente jsdom disponível", () => {
    const el = document.createElement("div");
    el.textContent = "ok";
    expect(el).toHaveTextContent("ok");
  });
});

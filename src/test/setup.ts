// Setup global dos testes (Vitest + Testing Library).
// Registra os matchers do jest-dom na instância de `expect` do Vitest e
// garante a limpeza do DOM entre os testes.
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});

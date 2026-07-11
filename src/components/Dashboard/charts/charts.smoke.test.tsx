import { describe, it, expect, beforeAll } from "vitest";
import { render } from "@testing-library/react";
import { ThemeProvider } from "@mui/material/styles";
import { getTheme } from "../../../theme";
import TrendChart from "./TrendChart";
import TopProductsChart from "./TopProductsChart";
import { MonthlyPoint } from "../../../pages/Home/dashboardMetrics";

// x-charts usa ResizeObserver (não existe no jsdom).
beforeAll(() => {
  // @ts-expect-error polyfill mínimo p/ o ambiente de teste
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const wrap = (node: React.ReactNode) =>
  render(<ThemeProvider theme={getTheme("light")}>{node}</ThemeProvider>);

const trend: MonthlyPoint[] = [
  { key: "2026-06", label: "jun/26", count: 1, value: 250000 },
  { key: "2026-07", label: "jul/26", count: 2, value: 200000 },
];

describe("charts (smoke)", () => {
  it("TrendChart monta com dados sem lançar", () => {
    const { container } = wrap(<TrendChart data={trend} />);
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("TrendChart mostra fallback de vazio quando não há valor", () => {
    wrap(<TrendChart data={[{ key: "2026-07", label: "jul/26", count: 0, value: 0 }]} />);
  });

  it("TopProductsChart monta com dados sem lançar", () => {
    const { container } = wrap(
      <TopProductsChart data={[{ name: "Parafuso", count: 5 }]} />
    );
    expect(container.querySelector("svg")).toBeTruthy();
  });

  it("TopProductsChart mostra fallback de vazio", () => {
    wrap(<TopProductsChart data={[]} />);
  });
});

import { describe, it, expect } from "vitest";
import { getTheme } from "./index";
import { tokens } from "./tokens";

// Verificação programática do tema (UI U1.1): os tokens chegam ao tema MUI e
// os modos light/dark produzem paletas distintas e coerentes.
describe("getTheme", () => {
  it("aplica a cor de marca dos tokens ao primary", () => {
    const theme = getTheme("light");
    expect(theme.palette.primary.main).toBe(tokens.color.brand.main);
    expect(theme.palette.primary.contrastText).toBe(tokens.color.brand.contrast);
  });

  it("usa o raio e a fonte tokenizados", () => {
    const theme = getTheme("light");
    expect(theme.shape.borderRadius).toBe(tokens.radius.md);
    expect(theme.typography.fontFamily).toContain("Poppins");
  });

  it("gera modos light e dark com backgrounds distintos", () => {
    const light = getTheme("light");
    const dark = getTheme("dark");
    expect(light.palette.mode).toBe("light");
    expect(dark.palette.mode).toBe("dark");
    expect(light.palette.background.default).not.toBe(
      dark.palette.background.default
    );
  });

  it("mapeia as cores semânticas dos tokens", () => {
    const theme = getTheme("light");
    expect(theme.palette.success.main).toBe(tokens.color.success);
    expect(theme.palette.error.main).toBe(tokens.color.error);
    expect(theme.palette.warning.main).toBe(tokens.color.warning);
  });

  // Acessibilidade (módulo Configurações) — opções que alteram o tema.
  it("mantém a paleta padrão sem opções de acessibilidade", () => {
    const normal = getTheme("light");
    expect(normal.palette.primary.main).toBe(tokens.color.brand.main);
    expect(normal.palette.text.primary).toBe(tokens.color.ink);
  });

  it("alto contraste reforça texto e bordas nos dois modos", () => {
    const lightNormal = getTheme("light");
    const lightHigh = getTheme("light", { contrast: "high" });
    expect(lightHigh.palette.text.primary).not.toBe(lightNormal.palette.text.primary);
    expect(lightHigh.palette.divider).not.toBe(lightNormal.palette.divider);

    const darkNormal = getTheme("dark");
    const darkHigh = getTheme("dark", { contrast: "high" });
    expect(darkHigh.palette.text.primary).not.toBe(darkNormal.palette.text.primary);
    expect(darkHigh.palette.background.default).not.toBe(
      darkNormal.palette.background.default
    );
  });

  it("fonte legível troca a família fora de Poppins", () => {
    const legible = getTheme("light", { legibleFont: true });
    expect(legible.typography.fontFamily).not.toContain("Poppins");
    expect(legible.typography.fontFamily).toContain("system-ui");
  });
});

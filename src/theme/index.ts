import { createTheme, ThemeOptions } from "@mui/material/styles";
import { tokens } from "./tokens";

// getTheme(mode) — tema MUI tokenizado, Light/Dark (UI U1.1). Spec: §4.2 do
// REPORTE_UI_UX.md. Desvio consciente: a família de fonte usa **Poppins**
// (carregada de fato via <link> no index.html em U0.3) em vez de "Inter"
// (que não está carregada) — evita cair em fallback silencioso.
export const getTheme = (mode: "light" | "dark") => {
  const isLight = mode === "light";

  // Valores dependentes do modo — fonte única, reusados no palette e nas
  // CSS custom properties (ponte para os .css estáticos, ex.: Budgets.css → U2.2).
  const paper = isLight ? "#FFFFFF" : "#111827";
  const defaultBg = isLight ? "#FAFAFA" : "#0F172A";
  const divider = isLight ? "#E2E8F0" : "#243244";
  const textPrimary = isLight ? tokens.color.ink : "#E5EAF0";
  const textSecondary = isLight ? "#5B6B7E" : "#9AA7B6"; // secondary elevado p/ AA
  const expandedBg = isLight ? "#EAF2FB" : "#0B2942";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: tokens.color.brand.main,
        light: tokens.color.brand.light,
        dark: tokens.color.brand.dark,
        contrastText: tokens.color.brand.contrast,
      },
      success: { main: tokens.color.success },
      warning: { main: tokens.color.warning },
      error: { main: tokens.color.error },
      info: { main: tokens.color.info },
      text: { primary: textPrimary, secondary: textSecondary },
      background: { default: defaultBg, paper },
      divider,
    },
    shape: { borderRadius: tokens.radius.md },
    typography: { fontFamily: `'Poppins', system-ui, sans-serif` },
    components: {
      // Reset global migrado do antigo index.css (UI U1.2) + CSS custom
      // properties tokenizadas (UI U2.2). O CssBaseline já cobre
      // background/cor/fonte pelo tema; aqui preservamos o "zera margin/padding"
      // universal e publicamos as variáveis `--ads-*` que os .css estáticos
      // consomem (ex.: Budgets.css), de modo que mudam junto com o modo.
      MuiCssBaseline: {
        styleOverrides: {
          "*": { margin: 0, padding: 0, boxSizing: "border-box" },
          ":root": {
            "--ads-surface": paper,
            "--ads-surface-alt": defaultBg,
            "--ads-border": divider,
            "--ads-text-strong": textPrimary,
            "--ads-text-muted": textSecondary,
            "--ads-brand": tokens.color.brand.main,
            "--ads-brand-dark": tokens.color.brand.dark,
            "--ads-on-brand": tokens.color.brand.contrast,
            "--ads-success": tokens.color.success,
            "--ads-expanded": expandedBg,
          },
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: { textTransform: "none", borderRadius: tokens.radius.sm },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: { borderRadius: tokens.radius.md, boxShadow: tokens.elevation.e2 },
        },
      },
    },
  } as ThemeOptions);
};

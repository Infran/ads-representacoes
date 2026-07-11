import { createTheme, ThemeOptions } from "@mui/material/styles";
import { tokens } from "./tokens";

// getTheme(mode) — tema MUI tokenizado, Light/Dark (UI U1.1). Spec: §4.2 do
// REPORTE_UI_UX.md. Desvio consciente: a família de fonte usa **Poppins**
// (carregada de fato via <link> no index.html em U0.3) em vez de "Inter"
// (que não está carregada) — evita cair em fallback silencioso.
export const getTheme = (mode: "light" | "dark") =>
  createTheme({
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
      text:
        mode === "light"
          ? { primary: tokens.color.ink, secondary: "#5B6B7E" } // secondary elevado p/ AA
          : { primary: "#E5EAF0", secondary: "#9AA7B6" },
      background:
        mode === "light"
          ? { default: "#FAFAFA", paper: "#FFFFFF" }
          : { default: "#0F172A", paper: "#111827" },
      divider: mode === "light" ? "#E2E8F0" : "#243244",
    },
    shape: { borderRadius: tokens.radius.md },
    typography: { fontFamily: `'Poppins', system-ui, sans-serif` },
    components: {
      // Reset global migrado do antigo index.css (UI U1.2). O CssBaseline já
      // cobre background/cor/fonte pelo tema; aqui preservamos apenas o
      // "zera margin/padding" universal que o index.css aplicava.
      MuiCssBaseline: {
        styleOverrides: {
          "*": { margin: 0, padding: 0, boxSizing: "border-box" },
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

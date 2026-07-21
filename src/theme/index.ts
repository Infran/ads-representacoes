import { createTheme, ThemeOptions } from "@mui/material";
import { tokens } from "./tokens";

/** Opções de acessibilidade que alteram o tema (módulo Configurações). */
export interface ThemeA11yOptions {
  /** "high" reforça texto/bordas e sobrescreve as vars --ads-* (Acessibilidade). */
  contrast?: "normal" | "high";
  /** Troca Poppins por uma fonte de sistema mais legível. */
  legibleFont?: boolean;
}

// getTheme(mode, opts) — tema MUI tokenizado, Light/Dark (UI U1.1). Spec: §4.2 do
// REPORTE_UI_UX.md. Desvio consciente: a família de fonte usa **Poppins**
// (carregada de fato via <link> no index.html em U0.3) em vez de "Inter"
// (que não está carregada) — evita cair em fallback silencioso.
// `opts` (módulo Configurações) injeta alto contraste e fonte legível.
export const getTheme = (
  mode: "light" | "dark",
  opts: ThemeA11yOptions = {}
) => {
  const isLight = mode === "light";
  const highContrast = opts.contrast === "high";

  // Valores dependentes do modo — fonte única, reusados no palette e nas
  // CSS custom properties (ponte para os .css estáticos, ex.: Budgets.css → U2.2).
  // No alto contraste, empurramos texto para (quase) preto/branco puro e bordas
  // fortes, mantendo os hex nascendo dentro de src/theme (UI U2.2).
  const paper = highContrast
    ? isLight
      ? "#FFFFFF"
      : "#000000"
    : isLight
    ? "#FFFFFF"
    : "#111827";
  const defaultBg = highContrast
    ? isLight
      ? "#FFFFFF"
      : "#000000"
    : isLight
    ? "#FAFAFA"
    : "#0F172A";
  const divider = highContrast
    ? isLight
      ? "#000000"
      : "#FFFFFF"
    : isLight
    ? "#E2E8F0"
    : "#243244";
  const textPrimary = highContrast
    ? isLight
      ? "#000000"
      : "#FFFFFF"
    : isLight
    ? tokens.color.ink
    : "#E5EAF0";
  const textSecondary = highContrast
    ? isLight
      ? "#1A1A1A"
      : "#F0F0F0"
    : isLight
    ? "#5B6B7E"
    : "#9AA7B6"; // secondary elevado p/ AA
  const expandedBg = highContrast
    ? isLight
      ? "#E0E0E0"
      : "#1A1A1A"
    : isLight
    ? "#EAF2FB"
    : "#0B2942";
  // Marca com mais contraste sobre o fundo no modo de alto contraste.
  const brandMain = highContrast
    ? isLight
      ? tokens.color.brand.dark
      : tokens.color.brand.light
    : tokens.color.brand.main;

  const fontFamily = opts.legibleFont
    ? `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`
    : `'Poppins', system-ui, sans-serif`;

  return createTheme({
    palette: {
      mode,
      primary: {
        main: brandMain,
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
    typography: { fontFamily },
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
            "--ads-brand": brandMain,
            "--ads-brand-dark": tokens.color.brand.dark,
            "--ads-on-brand": tokens.color.brand.contrast,
            "--ads-success": tokens.color.success,
            "--ads-expanded": expandedBg,
          },

          // --- Acessibilidade (módulo Configurações) --------------------------
          // Regras SEMPRE presentes; ativadas por classes que o
          // PreferencesProvider liga/desliga no <body>. Ficam aqui porque o app
          // não tem index.css — este é o ponto canônico de CSS global (U1.2).

          // Link "pular para o conteúdo": invisível até receber foco por teclado.
          ".ads-skip-link": {
            position: "absolute",
            left: 8,
            top: -48,
            zIndex: 2000,
            padding: "8px 16px",
            borderRadius: tokens.radius.sm,
            backgroundColor: brandMain,
            color: tokens.color.brand.contrast,
            fontWeight: 600,
            textDecoration: "none",
            transition: "top 120ms ease",
            "&:focus": { top: 8 },
          },

          // Reduzir movimento: corta transições/animações (override manual do
          // prefers-reduced-motion, que o app só respeitava em alguns pontos).
          "body.ads-reduce-motion *, body.ads-reduce-motion *::before, body.ads-reduce-motion *::after":
            {
              animationDuration: "0.001ms !important",
              animationIterationCount: "1 !important",
              transitionDuration: "0.001ms !important",
              scrollBehavior: "auto !important",
            },

          // Foco reforçado ao navegar por teclado.
          "body.ads-enhanced-focus *:focus-visible": {
            outline: `3px solid ${brandMain}`,
            outlineOffset: "2px",
            borderRadius: tokens.radius.sm,
          },

          // Espaçamento aumentado (herda para todo texto).
          "body.ads-increased-spacing": {
            lineHeight: 1.8,
            letterSpacing: "0.02em",
          },

          // Texto em negrito.
          "body.ads-bold-text": { fontWeight: 600 },
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

// Design tokens — fonte ÚNICA de verdade de cor/raio/elevação do app (UI U1.1).
// Nenhum hex deve nascer fora deste arquivo a partir daqui (ver UI U2.2).
// Spec: §4.2 do REPORTE_UI_UX.md.
export const tokens = {
  color: {
    brand: { main: "#1D63C4", light: "#4C8AE0", dark: "#134A97", contrast: "#FFFFFF" },
    ink: "#223449", // texto principal (era #2C3E50 navy)
    success: "#059669",
    warning: "#F59E0B",
    error: "#D32F2F",
    errorDark: "#B71C1C", // hover de ações destrutivas
    info: "#2196F3",
  },
  // Tons decorativos p/ avatares de iniciais (listas de clientes/produtos).
  // Vivem aqui porque hex só pode nascer em src/theme (UI U3.5); texto branco
  // por cima. Escolha determinística por id no consumidor.
  avatarTints: [
    "#1D63C4",
    "#0E7C7B",
    "#134A97",
    "#2F855A",
    "#B45309",
    "#3182CE",
    "#475569",
    "#7C3AED",
  ],
  radius: { sm: 6, md: 10, lg: 16, pill: 999 },
  elevation: {
    e1: "0 1px 3px rgba(16,24,40,0.08)",
    e2: "0 2px 8px rgba(16,24,40,0.06)",
    e4: "0 12px 32px rgba(16,24,40,0.18)",
  },
} as const;

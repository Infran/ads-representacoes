import { createContext, useContext } from "react";

// Contexto do modo de cor (light/dark) + toggle (UI U1.1).
// O estado vive no <Root> (main.tsx); o toggle visual entra no header em U3.2.
export type ColorMode = "light" | "dark";

export interface ColorModeContextValue {
  mode: ColorMode;
  toggle: () => void;
}

export const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  toggle: () => {},
});

// Hook de conveniência (consumido por U3.2 — toggle no header). Coexiste com
// o contexto neste módulo (padrão idêntico ao DataContext/ContextAuth do app).
// eslint-disable-next-line react-refresh/only-export-components
export const useColorMode = () => useContext(ColorModeContext);

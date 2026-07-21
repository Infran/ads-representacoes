import React, {
  useCallback,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { getTheme } from "../theme";
import { ColorModeContext } from "../theme/ColorModeContext";
import { setSuccessToastsEnabled } from "../ui/Feedback";
import {
  DEFAULT_PREFERENCES,
  PreferencesContext,
  Preferences,
  readPreferences,
  writePreferences,
} from "./PreferencesContext";

/**
 * Dono do estado de preferências (módulo Configurações). Fica ACIMA do
 * ThemeProvider porque `colorMode`/`contrast`/`legibleFont` alimentam `getTheme`.
 * Persiste em localStorage e aplica os efeitos de raiz (escala de fonte +
 * classes no body) antes do paint (`useLayoutEffect`, sem flash). Provê o
 * PreferencesContext novo e, por compatibilidade, o ColorModeContext antigo —
 * então `useColorMode()` e o toggle do UserMenu seguem funcionando intactos.
 */
export const PreferencesProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences);

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((prev) => {
        const next = { ...prev, [key]: value };
        writePreferences(next);
        return next;
      });
    },
    []
  );

  const resetPreferences = useCallback(() => {
    const next = { ...DEFAULT_PREFERENCES };
    writePreferences(next);
    setPreferences(next);
  }, []);

  const theme = useMemo(
    () =>
      getTheme(preferences.colorMode, {
        contrast: preferences.contrast,
        legibleFont: preferences.legibleFont,
      }),
    [preferences.colorMode, preferences.contrast, preferences.legibleFont]
  );

  // Efeitos de raiz aplicados antes do paint para evitar flash na primeira
  // carga: escala da fonte na raiz (escala todo texto em rem) + classes no body.
  // As regras CSS destas classes vivem no MuiCssBaseline (src/theme/index.ts).
  useLayoutEffect(() => {
    document.documentElement.style.fontSize = `${Math.round(
      preferences.fontScale * 100
    )}%`;
    const body = document.body;
    body.classList.toggle("ads-reduce-motion", preferences.reduceMotion);
    body.classList.toggle("ads-enhanced-focus", preferences.enhancedFocus);
    body.classList.toggle("ads-increased-spacing", preferences.increasedSpacing);
    body.classList.toggle("ads-bold-text", preferences.boldText);
  }, [
    preferences.fontScale,
    preferences.reduceMotion,
    preferences.enhancedFocus,
    preferences.increasedSpacing,
    preferences.boldText,
  ]);

  // Preferência de toasts de sucesso ligada ao helper module-level `notifySuccess`.
  useLayoutEffect(() => {
    setSuccessToastsEnabled(preferences.successToasts);
  }, [preferences.successToasts]);

  const prefValue = useMemo(
    () => ({ preferences, setPreference, resetPreferences }),
    [preferences, setPreference, resetPreferences]
  );

  // Ponte de compatibilidade: o ColorModeContext continua existindo, mapeado
  // sobre as preferências (o toggle "Modo Escuro" do UserMenu não muda).
  const colorMode = useMemo(
    () => ({
      mode: preferences.colorMode,
      toggle: () =>
        setPreference(
          "colorMode",
          preferences.colorMode === "light" ? "dark" : "light"
        ),
    }),
    [preferences.colorMode, setPreference]
  );

  return (
    <PreferencesContext.Provider value={prefValue}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </PreferencesContext.Provider>
  );
};

export default PreferencesProvider;

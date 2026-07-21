/* eslint-disable react-refresh/only-export-components */
// Módulo de dados/contexto (sem componentes): a regra react-refresh confunde o
// const `PreferencesContext` com um componente e passa a acusar os exports de
// dados/helpers. Como não há nenhum componente aqui, desligamos a regra no
// arquivo inteiro (mesmo espírito do disable inline em ColorModeContext).
import { createContext, useContext } from "react";

// Preferências do usuário — acessibilidade + experiência de uso (módulo
// Configurações). Persistidas SOMENTE em localStorage (mesmo padrão do antigo
// `ads_color_mode`): por navegador, zero backend, sem regras Firestore.
// O estado vive no <PreferencesProvider> (acima do ThemeProvider em Root),
// porque `contrast`/`legibleFont`/`colorMode` alimentam `getTheme`.

export type ColorMode = "light" | "dark";
export type ContrastMode = "normal" | "high";
export type Density = "comfortable" | "compact";

export interface Preferences {
  // Aparência / tema (colorMode migra do legado `ads_color_mode`)
  colorMode: ColorMode;

  // Acessibilidade
  /** Multiplicador da fonte da raiz (escala todo texto em rem). */
  fontScale: number;
  contrast: ContrastMode;
  /** Override manual do prefers-reduced-motion. */
  reduceMotion: boolean;
  /** Anel de foco reforçado ao navegar por teclado. */
  enhancedFocus: boolean;
  /** Aumenta line-height/letter-spacing para leitura. */
  increasedSpacing: boolean;
  /** Troca Poppins por uma fonte de sistema mais legível. */
  legibleFont: boolean;
  boldText: boolean;
  /** VLibras (tradução para Libras) carregado sob demanda. */
  libras: boolean;

  // Preferências de uso
  density: Density;
  rememberSidebar: boolean;
  /** Último estado da sidebar, restaurado quando `rememberSidebar`. */
  sidebarOpen: boolean;
  /** Rota inicial após o login (ex.: "/Home", "/Orcamentos"). */
  defaultLanding: string;
  successToasts: boolean;

  // Perfil (cor do avatar de iniciais; "" = usa a cor de marca)
  avatarColor: string;
}

/** Níveis discretos de escala de texto oferecidos na UI. */
export const FONT_SCALE_STEPS = [0.9, 1, 1.15, 1.3, 1.5] as const;

/** Opções de página inicial (label + rota). */
export const LANDING_OPTIONS: { value: string; label: string }[] = [
  { value: "/Home", label: "Dashboard" },
  { value: "/Orcamentos", label: "Orçamentos" },
  { value: "/Clientes", label: "Clientes" },
  { value: "/Representantes", label: "Representantes" },
  { value: "/Produtos", label: "Produtos" },
];

export const DEFAULT_PREFERENCES: Preferences = {
  colorMode: "light",
  fontScale: 1,
  contrast: "normal",
  reduceMotion: false,
  enhancedFocus: false,
  increasedSpacing: false,
  legibleFont: false,
  boldText: false,
  libras: false,
  density: "comfortable",
  rememberSidebar: false,
  sidebarOpen: false,
  defaultLanding: "/Home",
  successToasts: true,
  avatarColor: "",
};

const PREFERENCES_KEY = "ads_preferences";
const LEGACY_COLOR_MODE_KEY = "ads_color_mode";

// Merge tolerante: descarta chaves desconhecidas e valores de tipo errado,
// sempre caindo no default. Assim um blob antigo/corrompido nunca quebra o boot.
const sanitize = (raw: unknown): Partial<Preferences> => {
  if (!raw || typeof raw !== "object") return {};
  const p = raw as Record<string, unknown>;
  const out: Partial<Preferences> = {};

  if (p.colorMode === "light" || p.colorMode === "dark") out.colorMode = p.colorMode;
  if (typeof p.fontScale === "number" && p.fontScale >= 0.5 && p.fontScale <= 3)
    out.fontScale = p.fontScale;
  if (p.contrast === "normal" || p.contrast === "high") out.contrast = p.contrast;
  if (p.density === "comfortable" || p.density === "compact") out.density = p.density;
  if (typeof p.defaultLanding === "string") out.defaultLanding = p.defaultLanding;
  if (typeof p.avatarColor === "string") out.avatarColor = p.avatarColor;

  const bools: (keyof Preferences)[] = [
    "reduceMotion",
    "enhancedFocus",
    "increasedSpacing",
    "legibleFont",
    "boldText",
    "libras",
    "rememberSidebar",
    "sidebarOpen",
    "successToasts",
  ];
  for (const k of bools) {
    if (typeof p[k] === "boolean") (out as Record<string, unknown>)[k] = p[k];
  }
  return out;
};

/**
 * Lê as preferências do localStorage de forma síncrona (no boot). Se não houver
 * blob novo, migra o legado `ads_color_mode` para não perder a escolha de tema.
 */
export const readPreferences = (): Preferences => {
  try {
    const rawNew = localStorage.getItem(PREFERENCES_KEY);
    if (rawNew) {
      return { ...DEFAULT_PREFERENCES, ...sanitize(JSON.parse(rawNew)) };
    }
    const legacyMode = localStorage.getItem(LEGACY_COLOR_MODE_KEY);
    const base = { ...DEFAULT_PREFERENCES };
    if (legacyMode === "light" || legacyMode === "dark") base.colorMode = legacyMode;
    return base;
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
};

/** Persiste o blob; mantém `ads_color_mode` em sincronia por segurança. */
export const writePreferences = (prefs: Preferences): void => {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
    localStorage.setItem(LEGACY_COLOR_MODE_KEY, prefs.colorMode);
  } catch {
    // Cota estourada ou storage indisponível: preferência só em memória.
  }
};

export interface PreferencesContextValue {
  preferences: Preferences;
  setPreference: <K extends keyof Preferences>(
    key: K,
    value: Preferences[K]
  ) => void;
  resetPreferences: () => void;
}

// Default utilizável fora do provider (ex.: átomos de UI em teste isolado):
// devolve os defaults e setters no-op, então `usePreferences()` nunca lança.
export const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: DEFAULT_PREFERENCES,
  setPreference: () => {},
  resetPreferences: () => {},
});

// Hook de conveniência — coexiste com o contexto neste módulo (padrão idêntico
// ao DataContext/ContextAuth/ColorModeContext do app).
export const usePreferences = (): PreferencesContextValue =>
  useContext(PreferencesContext);

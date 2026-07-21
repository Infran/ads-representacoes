import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { usePreferences } from "../../context/PreferencesContext";

interface LayoutContextType {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// Hook de conveniência coexistindo com o contexto/provider neste módulo
// (padrão idêntico ao DataContext/ContextAuth/ColorModeContext do app).
// eslint-disable-next-line react-refresh/only-export-components
export const useLayout = (): LayoutContextType => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within a LayoutProvider");
  }
  return context;
};

interface LayoutProviderProps {
  children: ReactNode;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const { preferences, setPreference } = usePreferences();
  // Estado inicial vem da preferência apenas quando "lembrar o menu" está ligado.
  const [sidebarOpen, setSidebarOpen] = useState(
    preferences.rememberSidebar ? preferences.sidebarOpen : false
  );

  // Persiste o estado da sidebar como preferência quando "lembrar" está ativo.
  const remember = useCallback(
    (open: boolean) => {
      if (preferences.rememberSidebar) setPreference("sidebarOpen", open);
    },
    [preferences.rememberSidebar, setPreference]
  );

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => {
      remember(!prev);
      return !prev;
    });
  }, [remember]);

  const openSidebar = useCallback(() => {
    setSidebarOpen(true);
    remember(true);
  }, [remember]);

  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
    remember(false);
  }, [remember]);

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </LayoutContext.Provider>
  );
};

export default LayoutContext;

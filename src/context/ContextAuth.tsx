import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  setPersistence,
  browserSessionPersistence,
  User,
} from 'firebase/auth';
import { logger } from '../utils/logger';

// Tempo de vida da sessão antes do logout automático (2 horas).
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

// Definindo o tipo para o contexto de autenticação
interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<void | User>;
  logout: () => void;
  loading: boolean;
}

// Criando o contexto de autenticação
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  login: () => Promise.resolve(),
  logout: () => {},
  loading: true,
});

// Hook personalizado para acessar o contexto de autenticação — coexiste com
// o contexto/provider neste módulo (padrão idêntico ao DataContext/ColorModeContext).
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

// Componente provedor de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Guarda o handle do timer de logout para poder cancelá-lo (evita empilhamento).
  const logoutTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Função para realizar o login
  const login = async (email: string, password: string) => {
    try {
      // Define a persistência como de sessão (dados são perdidos ao fechar o navegador)
      await setPersistence(auth, browserSessionPersistence);

      // Realiza o login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser(user);

      // Armazena o horário do login na sessão do navegador
      const loginTime = Date.now();
      sessionStorage.setItem('loginTime', loginTime.toString());

      // Agende o logout automático
      scheduleAutoLogout();

      return user;
    } catch (error) {
      const { code, message } = error as { code?: string; message?: string };
      logger.error('Error logging in:', code, message);
      throw error;
    }
  };

  // Função para realizar o logout
  const logout = useCallback(() => {
    if (logoutTimer.current) {
      clearTimeout(logoutTimer.current);
      logoutTimer.current = null;
    }
    signOut(auth).then(() => {
      setCurrentUser(null);
      sessionStorage.removeItem('loginTime'); // Limpa o horário do login
      window.location.href = '/Login'; // Redireciona para a página de login
    });
  }, []);

  // Função para agendar o logout automático
  const scheduleAutoLogout = useCallback(() => {
    const loginTime = sessionStorage.getItem('loginTime');
    if (!loginTime) return;

    const elapsedTime = Date.now() - parseInt(loginTime, 10);
    const timeRemaining = SESSION_TTL_MS - elapsedTime;

    // Cancela qualquer timer anterior antes de reagendar (evita empilhar timers
    // quando login e onAuthStateChanged disparam scheduleAutoLogout).
    if (logoutTimer.current) clearTimeout(logoutTimer.current);

    if (timeRemaining > 0) {
      logoutTimer.current = setTimeout(() => {
        logout();
      }, timeRemaining);
    } else {
      logout(); // Se o tempo já expirou, desloga imediatamente
    }
  }, [logout]);

  // Monitorar mudanças na autenticação do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        // Agendar logout automático ao recarregar a página
        scheduleAutoLogout();
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [scheduleAutoLogout]);

  // Contexto de valor para ser fornecido aos componentes descendentes
  const authContextValue: AuthContextType = {
    currentUser,
    login,
    logout,
    loading,
  };

  // Renderiza o provedor de contexto de autenticação
  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  updateProfile,
  signOut,
  setPersistence,
  browserSessionPersistence,
  User,
  UserCredential,
} from 'firebase/auth';

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

// Hook personalizado para acessar o contexto de autenticação
export function useAuth(): AuthContextType {
  return useContext(AuthContext);
}

// Componente provedor de autenticação
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    } catch (error: any) {
      console.error('Error logging in:', error.code, error.message);
      throw error;
    }
  };

  // Função para agendar o logout automático
  const scheduleAutoLogout = () => {
    const loginTime = sessionStorage.getItem('loginTime');
    if (loginTime) {
      const elapsedTime = Date.now() - parseInt(loginTime, 10);
      const timeRemaining = 6 * 60 * 60 * 5000 - elapsedTime; // 2 horas em milissegundos

      if (timeRemaining > 0) {
        setTimeout(() => {
          logout();
        }, timeRemaining);
      } else {
        logout(); // Se o tempo já expirou, desloga imediatamente
      }
    }
  };

  // Função para realizar o logout
  const logout = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      sessionStorage.removeItem('loginTime'); // Limpa o horário do login
      window.location.href = '/Login'; // Redireciona para a página de login
    });
  };

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

    return () => unsubscribe();
  }, []);

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

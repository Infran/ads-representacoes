import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, updateProfile, signOut, User, UserCredential } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      setCurrentUser(user); // Define o usuário atual
      return user; // Retorna o usuário logado, caso precise usar depois
    } catch (error: any) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.error('Error logging in:', errorCode, errorMessage);
      throw error; // Lança o erro para ser tratado no submitLogin
    }
  };
  

  const logout = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      window.location.href = '/Login';
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);
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

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
import { resolveRole, clearCachedRole, StaffRole } from '../services/staffService';
import { registerAuditActor } from '../services/auditService';

// Tempo de vida da sessão antes do logout automático (2 horas).
const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

// Definindo o tipo para o contexto de autenticação
interface AuthContextType {
  currentUser: User | null;
  /** Papel lido de `staff/{uid}`. Sem doc, sem campo ou com falha de leitura: "staff". */
  role: StaffRole;
  /** Atalho para gatear o painel de administração. */
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void | User>;
  logout: () => void;
  /** Recarrega o usuário do Firebase (nome/foto) e repinta a UI. */
  refreshUser: () => Promise<void>;
  loading: boolean;
}

// Criando o contexto de autenticação
export const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  role: 'staff',
  isAdmin: false,
  login: () => Promise.resolve(),
  logout: () => {},
  refreshUser: () => Promise.resolve(),
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
  const [role, setRole] = useState<StaffRole>('staff');
  const [loading, setLoading] = useState(true);
  // Bump usado só para forçar re-render após `reload()` (o objeto User é
  // mutado no lugar, então a mesma referência não dispararia atualização).
  const [, setUserTick] = useState(0);
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

      // Resolve o papel ANTES de expor o usuário. `onAuthStateChanged` também
      // resolveria, mas só depois de um render — o que faria a UI de admin
      // piscar de ausente para presente logo após o login.
      //
      // Esta é a ÚNICA leitura de papel por sessão: `resolveRole` grava em
      // sessionStorage, então o `onAuthStateChanged` que dispara logo atrás
      // já encontra o valor em cache em vez de repetir a consulta.
      const resolvedRole = await resolveRole(user.uid);
      setRole(resolvedRole);
      registerAuditActor({
        uid: user.uid,
        email: user.email ?? '',
        role: resolvedRole,
      });
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
      setRole('staff');
      registerAuditActor(null);
      clearCachedRole(); // Sem isto, o próximo login na aba herdaria o papel
      sessionStorage.removeItem('loginTime'); // Limpa o horário do login
      window.location.href = '/Login'; // Redireciona para a página de login
    });
  }, []);

  // Recarrega o usuário do Firebase (após updateProfile) e força re-render.
  // `updateProfile` NÃO dispara onAuthStateChanged, então sem isto o novo
  // nome/foto só apareceria no próximo login.
  const refreshUser = useCallback(async () => {
    if (!auth.currentUser) return;
    await auth.currentUser.reload();
    setCurrentUser(auth.currentUser);
    setUserTick((t) => t + 1);
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
    // O callback agora aguarda a leitura do papel antes de liberar a árvore.
    // Sem esta flag, o StrictMode (que invoca o efeito duas vezes em dev) faria
    // a execução descartada gravar estado depois do cleanup.
    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Resolver o papel AQUI — e não num efeito separado — é o que evita
        // qualquer flash: `loading` só vira false depois, e o provider já
        // segura a árvore inteira com `{!loading && children}`.
        //
        // Num reload de aba isto NÃO vai à rede: o papel está em sessionStorage
        // (mesmo ciclo de vida da sessão do Firebase), então o boot não fica
        // mais atrás de um round trip ao Firestore. Só o primeiro login da aba
        // paga a leitura.
        const resolvedRole = await resolveRole(user.uid);
        if (cancelled) return;

        setRole(resolvedRole);
        registerAuditActor({
          uid: user.uid,
          email: user.email ?? '',
          role: resolvedRole,
        });
        setCurrentUser(user);

        // Agendar logout automático ao recarregar a página
        scheduleAutoLogout();
      } else {
        if (cancelled) return;
        setRole('staff');
        registerAuditActor(null);
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
      unsubscribe();
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
    };
  }, [scheduleAutoLogout]);

  // Contexto de valor para ser fornecido aos componentes descendentes
  const authContextValue: AuthContextType = {
    currentUser,
    role,
    // Exige usuário presente: `role` sobrevive a um render intermediário no
    // logout, e admin sem sessão não deve existir nem por um frame.
    isAdmin: currentUser !== null && role === 'admin',
    login,
    logout,
    refreshUser,
    loading,
  };

  // Renderiza o provedor de contexto de autenticação
  return (
    <AuthContext.Provider value={authContextValue}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/ContextAuth";

/**
 * Guarda das rotas de administração, no mesmo formato do `ProtectedRoutes`.
 *
 * Não precisa tratar carregamento: o `AuthProvider` resolve o papel ANTES de
 * liberar a árvore (`{!loading && children}`), então quando isto renderiza o
 * `isAdmin` já é definitivo — sem piscar o painel para quem não é admin.
 *
 * Isto é conveniência de navegação, não segurança: quem realmente barra a
 * leitura de `auditLogs`/`bin` são as firestore.rules.
 */
const AdminRoute = () => {
  const { isAdmin } = useContext(AuthContext);
  return isAdmin ? <Outlet /> : <Navigate to="/Home" replace />;
};

export default AdminRoute;

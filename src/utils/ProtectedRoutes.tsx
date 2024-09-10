import { Outlet, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/ContextAuth";

const ProtectedRoutes = () => {
  const { currentUser: user } = useContext(AuthContext);
  return user ? <Outlet /> : <Navigate to="/Login" />
}

export default ProtectedRoutes;
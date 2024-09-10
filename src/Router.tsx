import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Clients from "./pages/Clients/Clients";
import  Budgets  from "./pages/Budgets/Budgets";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthProvider } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/Login" element={<Login />} />
        <Route element={<ProtectedRoutes />}>
        <Route path="/" element={<DefaultLayout />}>
          <Route index element={<Home />} />
          <Route path="Home" element={<Home />} />
          <Route path="Produtos" element={<Products />} />
          <Route path="Clientes" element={<Clients />} />
          <Route path="Orcamentos" element={<Budgets />} />
        </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;

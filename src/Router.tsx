import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Clients from "./pages/Clients/Clients";
import  Budgets  from "./pages/Budgets/Budgets";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthContext } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { useContext } from "react";
import CreateBudget from "./components/CreateBudget/CreateBudget";

const AppRouter = () => {
  const { currentUser: user } = useContext(AuthContext)
  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/*" element={<Login />} />
          <Route path="/Login" element={<Login />} />
        </Routes>
      </Router>
    );
  } else {
    return (
      <Router>
        <Routes>
          <Route element={<ProtectedRoutes />}>
          <Route path="/" element={<DefaultLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/*" element={<Home />} />
            <Route path="Home" element={<Home />} />
            <Route path="Produtos" element={<Products />} />
            <Route path="Clientes" element={<Clients />} />
            <Route path="Orcamentos" element={<Budgets />} />
            <Route path="Orcamentos/Adicionar" element={<CreateBudget />} />
          </Route>
          </Route>
        </Routes>
      </Router>
    );
  }
};

export default AppRouter;

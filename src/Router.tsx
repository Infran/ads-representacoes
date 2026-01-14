import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Clients from "./pages/Clients/Clients";
import Budgets from "./pages/Budgets/Budgets";
import Representatives from "./pages/Representatives/Representatives";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthContext } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { useContext } from "react";
import { DataProvider } from "./context/DataContext";
import BudgetFormPage from "./pages/BudgetFormPage";

const AppRouter = () => {
  const { currentUser: user } = useContext(AuthContext);
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
      <DataProvider>
        <Router>
          <Routes>
            <Route element={<ProtectedRoutes />}>
              <Route path="/" element={<DefaultLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/*" element={<Home />} />
                <Route path="Home" element={<Home />} />
                <Route path="Produtos" element={<Products />} />
                <Route path="Clientes" element={<Clients />} />
                <Route path="Representantes" element={<Representatives />} />
                <Route path="Orcamentos" element={<Budgets />} />
                <Route
                  path="Orcamentos/Adicionar"
                  element={<BudgetFormPage mode="create" />}
                />
                <Route
                  path="Orcamentos/Editar/:id"
                  element={<BudgetFormPage mode="edit" />}
                />
              </Route>
            </Route>
          </Routes>
        </Router>
      </DataProvider>
    );
  }
};

export default AppRouter;

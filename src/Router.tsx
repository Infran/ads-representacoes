import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthContext } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { useContext, lazy } from "react";
import { DataProvider } from "./context/DataContext";

// Rotas autenticadas carregadas sob demanda (code-splitting — PERF P0.2).
// Tira o app autenticado (+ DataGrid/PDF) do bundle inicial do Login.
const Home = lazy(() =>
  import("./pages/Home/Home").then((m) => ({ default: m.Home }))
);
const Products = lazy(() => import("./pages/Products/Products"));
const Clients = lazy(() => import("./pages/Clients/Clients"));
const Budgets = lazy(() => import("./pages/Budgets/Budgets"));
const Representatives = lazy(
  () => import("./pages/Representatives/Representatives")
);
const BudgetFormPage = lazy(() => import("./pages/BudgetFormPage"));
const Help = lazy(() => import("./pages/Help"));

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
                <Route path="Ajuda" element={<Help />} />
              </Route>
            </Route>
          </Routes>
        </Router>
      </DataProvider>
    );
  }
};

export default AppRouter;

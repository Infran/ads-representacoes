import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Home } from "./pages/Home/Home";
import Products from "./pages/Products/Products";
import Clients from "./pages/Clients/Clients";
import  Budgets  from "./pages/Budgets/Budgets";
import Representatives from "./pages/Representatives/Representatives";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthContext } from "./context/ContextAuth";
import ProtectedRoutes from "./utils/ProtectedRoutes";
import { useContext } from "react";
import CreateBudget from "./components/CreateBudget/CreateBudget";
import EditBudget from "./components/EditBudget/EditBudget";

// const budget: IBudget = {
//   id: 1,
//   client: {
//     name: "Hiago Gabriel Oliveira Pinto",
//     email: "hiago@email.com",
//     phone: "(11) 4991-6085",
//     mobilePhone: "(11) 99999-9999",
//     address: "ADIMIX IND.COM.ADITIVOS PARA PANIFICACAO LTDA RUA GIL TEIXEIRA LINO,140 - PQ. INDUSTRIAL II",
//   },
//   products: [
//     {quantity: 1, product: {id: 2, name: "CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1\"", description: "CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1\"", ncm: "123456", icms: "12%", unitValue: 23100.00}},
//     {quantity: 1, product: {id: 3, name: "CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1\"", description: "CONJUNTO DE DRENAGEM MONTADO COM PURGADOR DE BOIA 1\"", ncm: "123456", icms: "12%", unitValue: 100.00}},
//   ], 
//   estimatedDate: "25/06/2024",
//   maxDealDate: "28 DDL",
//   guarantee: "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO",
//   tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
//   totalValue: 80000.00,
//   createdAt: new Date("2024-06-25"),
//   updatedAt: new Date()
// };

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
            <Route path="Representantes" element={<Representatives />} />
            <Route path="Orcamentos" element={<Budgets />} />
            <Route path="Orcamentos/Adicionar" element={<CreateBudget />} />
            <Route path="Orcamentos/Editar/:id" element={<EditBudget />} />
          </Route>
          </Route>
        </Routes>
      </Router>
    );
  }
};

export default AppRouter;

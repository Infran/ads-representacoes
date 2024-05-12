import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Home } from "./pages/Home/Home";
import { Products } from "./pages/Products/Products";
import { Clients } from "./pages/Clients/Clients";
import DefaultLayout from "./layouts/DefaultLayout";
import { Login } from "./components/Login/Login";
import { AuthProvider } from "./context/ContextAuth";

const AppRouter = () => {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<DefaultLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/Home" element={<Home />} />
              <Route path="/Login" element={<Login />} />
              <Route path="/Produtos" element={<Products />} />
              <Route path="/Clientes" element={<Clients />} />
            </Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
};

export default AppRouter;

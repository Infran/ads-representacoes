import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Home } from "./pages/Home/Home";
import { Products } from "./pages/Products/Products";
import { Clients } from "./pages/Clients/Clients";
import DefaultLayout from "./layouts/DefaultLayout";

const AppRouter = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/Home" element={<Home />} />
            <Route path="/Produtos" element={<Products />} />
            <Route path="/Clientes" element={<Clients />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { Home } from "./pages/Home/Home";
import { CreateProduct } from "./pages/CreateProduct/CreateProduct";
import { CreateClient } from "./pages/CreateClient/CreateClient";
import DefaultLayout from "./layouts/DefaultLayout";

const AppRouter = () => {
  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<DefaultLayout />}>
            <Route path="/Home" element={<Home />} />
            <Route path="/CriarProduto" element={<CreateProduct />} />
            <Route path="/CriarCliente" element={<CreateClient />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
};

export default AppRouter;

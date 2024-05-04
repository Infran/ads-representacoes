import { Divider } from "@mui/material";
import SectionCard from "../../components/SectionCard/SectionCard";
import Box from "@mui/material/Box";

export const Home = () => {
  return (
    <>
    
      <Box display="flex" gap={10} width={1}>
        <SectionCard title="Cadastrar Cliente" link="/CriarCliente" />
        <SectionCard title="Cadastrar Produto" link="/CriarProduto" />
        <SectionCard title="Gerar Orçamento" link="/" />
      </Box>
      <Divider sx={{ margin: 2 }} />
      <Box display="flex" gap={10} height={200} width={1}>
        <SectionCard title="Listar Orçamento" link="/" />
        <SectionCard title="Listar Clientes" link="/" />
      </Box>
    </>
  );
};

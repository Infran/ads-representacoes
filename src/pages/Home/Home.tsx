import SectionCard from "../../components/SectionCard/SectionCard";
import Box from "@mui/material/Box";

export const Home = () => {
  return (
    <>
      <Box width="1280px" display={"flex"} gap={4} flexWrap="wrap">
        <SectionCard title="Clientes" link="/Clientes" />
        <SectionCard title="Produtos" link="/Produtos" />
        <SectionCard title="Gerar Orçamento" link="/Orcamentos" />
      </Box>
    </>
  );
};

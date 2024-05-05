import SectionCard from "../../components/SectionCard/SectionCard";
import Box from "@mui/material/Box";

export const Home = () => {
  return (
    <>
      <Box width="80vw" display={"flex"} gap={4} >
        <SectionCard title="Clientes" link="/Clientes" />
        <SectionCard title="Produtos" link="/Produtos" />
        <SectionCard title="Gerar Orçamento" link="/" />
      </Box>
    </>
  );
};

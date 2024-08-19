import { Outlet } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import Box from "@mui/material/Box";

export default function DefaultLayout() {
  return (
    <>
      <Box  sx={{ display: "flex", paddingTop:8, minHeight:"720px", maxWidth:"1280px" }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, width:"100%" }}>
          <Outlet />
        </Box>
      </Box>
    </>
  );
}

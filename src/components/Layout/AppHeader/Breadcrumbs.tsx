import React from "react";
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { NavigateNext, Home } from "@mui/icons-material";
import { useLocation, useNavigate } from "react-router-dom";
import { getBreadcrumbs } from "../Sidebar/sidebarConfig";

const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const breadcrumbs = getBreadcrumbs(location.pathname);

  // Não mostra breadcrumbs na home
  if (location.pathname === "/" || location.pathname === "/Home") {
    return null;
  }

  return (
    <MuiBreadcrumbs
      separator={
        <NavigateNext fontSize="small" sx={{ color: "rgba(0,0,0,0.3)" }} />
      }
      aria-label="breadcrumb"
      sx={{
        "& .MuiBreadcrumbs-ol": {
          flexWrap: "nowrap",
        },
      }}
    >
      {/* Link Home */}
      <Link
        underline="hover"
        color="inherit"
        onClick={() => navigate("/Home")}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          color: "rgba(0, 0, 0, 0.54)",
          fontSize: "0.75rem",
          "&:hover": {
            color: "#1976D2",
          },
        }}
      >
        <Home sx={{ mr: 0.5, fontSize: "0.9rem" }} />
        Home
      </Link>

      {/* Links intermediários */}
      {breadcrumbs.slice(0, -1).map((crumb) => (
        <Link
          key={crumb.path}
          underline="hover"
          color="inherit"
          onClick={() => navigate(crumb.path)}
          sx={{
            cursor: "pointer",
            color: "rgba(0, 0, 0, 0.54)",
            fontSize: "0.75rem",
            "&:hover": {
              color: "#1976D2",
            },
          }}
        >
          {crumb.label}
        </Link>
      ))}

      {/* Página atual */}
      {breadcrumbs.length > 0 && (
        <Typography
          sx={{
            color: "#1976D2",
            fontWeight: 500,
            fontSize: "0.75rem",
          }}
        >
          {breadcrumbs[breadcrumbs.length - 1]?.label}
        </Typography>
      )}
    </MuiBreadcrumbs>
  );
};

export default Breadcrumbs;

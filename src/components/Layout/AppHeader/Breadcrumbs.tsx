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
        <NavigateNext fontSize="small" sx={{ color: "text.disabled" }} />
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
          color: "text.secondary",
          fontSize: "0.75rem",
          "&:hover": {
            color: "primary.main",
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
            color: "text.secondary",
            fontSize: "0.75rem",
            "&:hover": {
              color: "primary.main",
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
            color: "primary.main",
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

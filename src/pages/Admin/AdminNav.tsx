import { FC } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { NavLink } from "react-router-dom";
import { Dashboard, DeleteSweep, Tune } from "@mui/icons-material";

const links = [
  { to: "/Admin", label: "Visão geral & atividades", icon: Dashboard, end: true },
  { to: "/Admin/Lixeira", label: "Lixeira", icon: DeleteSweep, end: false },
  { to: "/Admin/Sistema", label: "Sistema", icon: Tune, end: false },
];

/**
 * Navegação entre as telas do painel.
 *
 * Uma faixa de links em vez de cinco itens na sidebar (que inchariam o menu
 * principal) e em vez de `Tabs` do MUI — o repo não usa `Tabs` em lugar nenhum;
 * o idioma estabelecido é o rail de itens do `Help.tsx`.
 */
const AdminNav: FC = () => (
  <Paper
    elevation={0}
    sx={{
      p: 1,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      gap: 0.5,
      flexWrap: "wrap",
    }}
  >
    {links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        style={{ textDecoration: "none", flex: "1 1 auto" }}
      >
        {({ isActive }) => (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.75,
              px: 1.5,
              py: 1,
              borderRadius: 2,
              minWidth: 0,
              color: isActive ? "primary.main" : "text.secondary",
              bgcolor: isActive
                ? (t) => alpha(t.palette.primary.main, 0.1)
                : "transparent",
              transition: "background-color 120ms ease",
              "&:hover": {
                bgcolor: (t) =>
                  alpha(t.palette.primary.main, isActive ? 0.14 : 0.06),
              },
            }}
          >
            <Icon sx={{ fontSize: 18 }} />
            <Typography
              sx={{
                fontSize: 12.5,
                fontWeight: isActive ? 600 : 500,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Typography>
          </Box>
        )}
      </NavLink>
    ))}
  </Paper>
);

export default AdminNav;

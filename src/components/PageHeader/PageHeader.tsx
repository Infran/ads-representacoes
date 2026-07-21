import { FC } from "react";
import { Box, Paper, Typography, alpha } from "@mui/material";
import { Add } from "@mui/icons-material";
import { OverridableComponent } from "@mui/material/OverridableComponent";
import { SvgIconTypeMap } from "@mui/material/SvgIcon";
import Button from "../../ui/Button";

type IconType = OverridableComponent<SvgIconTypeMap>;

interface PageHeaderProps {
  title: string;
  description: string;
  icon: IconType;
  /** Rótulo do botão de ação primária (ex.: "Adicionar cliente"). */
  actionLabel?: string;
  onAction?: () => void;
  /** Ícone do botão de ação. Padrão: "+". */
  actionIcon?: IconType;
}

/**
 * Cabeçalho de página tokenizado: tile de ícone com tom de marca, título e
 * descrição e — opcionalmente — a ação primária da tela (ex.: Adicionar) à
 * direita. Manter a ação de cadastro aqui, e não na barra de filtros, separa
 * "operar a lista" de "criar um registro".
 */
const PageHeader: FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Add,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: { xs: 2, sm: 2.5 },
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
      display: "flex",
      alignItems: "center",
      gap: 2,
      flexWrap: "wrap",
    }}
  >
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 52,
        height: 52,
        borderRadius: 2.5,
        flexShrink: 0,
        color: "primary.main",
        bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
      }}
    >
      <Icon sx={{ fontSize: 28 }} />
    </Box>

    <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
      <Typography
        variant="h6"
        component="h1"
        sx={{ fontWeight: 700, lineHeight: 1.25 }}
      >
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
        {description}
      </Typography>
    </Box>

    {actionLabel && onAction && (
      <Button
        variant="contained"
        onClick={onAction}
        startIcon={<ActionIcon />}
        sx={{ flexShrink: 0, ml: { sm: "auto" }, width: { xs: "100%", sm: "auto" } }}
      >
        {actionLabel}
      </Button>
    )}
  </Paper>
);

export default PageHeader;

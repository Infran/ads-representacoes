import { FC, useState } from "react";
import {
  Box,
  InputBase,
  Menu,
  MenuItem,
  Paper,
  Switch,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ExpandMore, Search } from "@mui/icons-material";
import Button from "../../ui/Button";

/** Combo (dropdown de valor único) da barra de filtros. */
export interface CockpitSelect {
  key: string;
  /** Rótulo em maiúsculas acima do controle. */
  label: string;
  value: string;
  /** Texto quando nada está selecionado (ex.: "Todos"). */
  placeholder: string;
  /** Primeiro item do menu, que limpa o filtro (ex.: "Todos os estados"). */
  allLabel: string;
  options: string[];
  formatOption?: (value: string) => string;
  width?: number;
  onPick: (value: string) => void;
}

/** Toggle booleano emoldurado da barra de filtros. */
export interface CockpitToggle {
  key: string;
  /** Rótulo em maiúsculas acima do controle. */
  caption: string;
  /** Rótulo inline ao lado do switch. */
  label: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

interface CockpitFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  selects: CockpitSelect[];
  toggles: CockpitToggle[];
  onReset: () => void;
}

const captionSx = {
  fontSize: 10.5,
  fontWeight: 600,
  letterSpacing: ".4px",
  textTransform: "uppercase" as const,
  color: "text.secondary",
  opacity: 0.85,
  mb: 0.6,
};

const SelectField: FC<CockpitSelect> = ({
  label,
  value,
  placeholder,
  allLabel,
  options,
  formatOption,
  width = 160,
  onPick,
}) => {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const display = value ? (formatOption ? formatOption(value) : value) : placeholder;

  return (
    <Box sx={{ width }}>
      <Typography component="div" sx={captionSx}>
        {label}
      </Typography>
      <Box
        role="button"
        tabIndex={0}
        onClick={(e) => setAnchor(e.currentTarget)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setAnchor(e.currentTarget);
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          border: "1px solid",
          borderColor: value || open ? "primary.main" : "divider",
          borderRadius: 2,
          px: 1.4,
          height: 38,
          cursor: "pointer",
          userSelect: "none",
          fontSize: 12.5,
          fontWeight: 500,
          color: value ? "text.primary" : "text.secondary",
        }}
      >
        <Box
          component="span"
          sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        >
          {display}
        </Box>
        <ExpandMore sx={{ fontSize: 18, color: "text.secondary", flexShrink: 0 }} />
      </Box>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { maxHeight: 280, minWidth: width } } }}
      >
        <MenuItem
          selected={!value}
          onClick={() => {
            onPick("");
            setAnchor(null);
          }}
          sx={{ fontSize: 12.5 }}
        >
          {allLabel}
        </MenuItem>
        {options.map((opt) => (
          <MenuItem
            key={opt}
            selected={opt === value}
            onClick={() => {
              onPick(opt);
              setAnchor(null);
            }}
            sx={{ fontSize: 12.5 }}
          >
            {formatOption ? formatOption(opt) : opt}
          </MenuItem>
        ))}
      </Menu>
    </Box>
  );
};

const ToggleField: FC<CockpitToggle> = ({ caption, label, checked, onToggle }) => (
  <Box>
    <Typography component="div" sx={captionSx}>
      {caption}
    </Typography>
    <Box
      onClick={() => onToggle(!checked)}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 0.5,
        border: "1px solid",
        borderColor: checked ? "primary.main" : "divider",
        borderRadius: 2,
        pl: 1.4,
        pr: 0.5,
        height: 38,
        cursor: "pointer",
        userSelect: "none",
        fontSize: 12.5,
        color: "text.primary",
      }}
    >
      {label}
      <Switch
        size="small"
        checked={checked}
        onClick={(e) => e.stopPropagation()}
        onChange={(_, v) => onToggle(v)}
        inputProps={{ "aria-label": caption }}
      />
    </Box>
  </Box>
);

const CockpitFilterBar: FC<CockpitFilterBarProps> = ({
  search,
  onSearchChange,
  searchPlaceholder,
  selects,
  toggles,
  onReset,
}) => (
  <Paper
    elevation={0}
    sx={{
      p: 1.75,
      borderRadius: 3,
      border: "1px solid",
      borderColor: "divider",
      display: "flex",
      alignItems: "flex-end",
      gap: 1.75,
      flexWrap: "wrap",
    }}
  >
    <Box sx={{ flex: 1, minWidth: 220 }}>
      <Typography component="div" sx={captionSx}>
        Buscar
      </Typography>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          border: "1px solid",
          borderColor: search ? "primary.main" : "divider",
          borderRadius: 2,
          px: 1.4,
          height: 38,
        }}
      >
        <Search sx={{ fontSize: 18, color: "text.secondary" }} />
        <InputBase
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          sx={{ flex: 1, fontSize: 12.5, color: "text.primary" }}
          inputProps={{ "aria-label": "Buscar" }}
        />
      </Box>
    </Box>

    {selects.map((s) => (
      <SelectField key={s.key} {...s} />
    ))}
    {toggles.map((t) => (
      <ToggleField key={t.key} {...t} />
    ))}

    <Button
      variant="outlined"
      color="inherit"
      onClick={onReset}
      sx={{
        height: 38,
        color: "text.secondary",
        borderColor: "divider",
        "&:hover": {
          borderColor: "divider",
          bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
        },
      }}
    >
      Limpar
    </Button>
  </Paper>
);

export default CockpitFilterBar;

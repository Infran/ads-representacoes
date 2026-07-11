import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Box,
  InputBase,
  IconButton,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Popper,
  Fade,
  ClickAwayListener,
  Chip,
} from "@mui/material";
import {
  Search,
  Close,
  Apartment,
  NoteAdd,
  Widgets,
  Groups,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useData } from "../../../context/DataContext";
import useDebounce from "../../../hooks/useDebounce";

interface SearchResult {
  id: string;
  type: "client" | "budget" | "product" | "representative";
  title: string;
  subtitle?: string;
  path: string;
}

const typeConfig = {
  client: { icon: Apartment, label: "Cliente", color: "#2196F3" },
  budget: { icon: NoteAdd, label: "Orçamento", color: "#4CAF50" },
  product: { icon: Widgets, label: "Produto", color: "#FF9800" },
  representative: { icon: Groups, label: "Representante", color: "#9C27B0" },
};

const GlobalSearch: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const anchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { clients, budgets, products } = useData();

  // PERF P1.4: filtra sobre o termo debounced (300ms) e memoiza — não varre as
  // 3 coleções a cada tecla, e o cálculo sai do effect para um useMemo puro.
  const debouncedQuery = useDebounce(query, 300);

  const results = useMemo<SearchResult[]>(() => {
    if (debouncedQuery.length < 2) return [];

    const searchTerm = debouncedQuery.toLowerCase();
    const newResults: SearchResult[] = [];

    // Buscar em clientes
    clients
      .filter((c) => c.name?.toLowerCase().includes(searchTerm))
      .slice(0, 3)
      .forEach((c) => {
        newResults.push({
          id: `client-${c.id}`,
          type: "client",
          title: c.name || "Sem nome",
          subtitle: c.email || c.phone,
          path: "/Clientes",
        });
      });

    // Buscar em orçamentos
    budgets
      .filter(
        (b) =>
          b.id?.toString().includes(searchTerm) ||
          b.client?.name?.toLowerCase().includes(searchTerm)
      )
      .slice(0, 3)
      .forEach((b) => {
        newResults.push({
          id: `budget-${b.id}`,
          type: "budget",
          title: `Orçamento #${b.id}`,
          subtitle: b.client?.name,
          path: `/Orcamentos/Editar/${b.id}`,
        });
      });

    // Buscar em produtos
    products
      .filter((p) => p.name?.toLowerCase().includes(searchTerm))
      .slice(0, 3)
      .forEach((p) => {
        newResults.push({
          id: `product-${p.id}`,
          type: "product",
          title: p.name || "Sem nome",
          subtitle: p.description,
          path: "/Produtos",
        });
      });

    return newResults;
  }, [debouncedQuery, clients, budgets, products]);

  const handleOpen = () => {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    handleClose();
  };

  // Atalho de teclado Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        handleOpen();
      }
      if (e.key === "Escape" && open) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      {/* Botão de busca compacto */}
      <Box
        ref={anchorRef}
        onClick={handleOpen}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.75,
          borderRadius: 2,
          backgroundColor: open ? "background.paper" : "action.hover",
          border: open ? "1px solid" : "1px solid transparent",
          borderColor: open ? "primary.main" : "transparent",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: open ? 300 : 180,
          "&:hover": {
            backgroundColor: "action.hover",
          },
        }}
      >
        <Search sx={{ color: "text.secondary", fontSize: 20 }} />
        {!open && (
          <>
            <Typography
              sx={{
                color: "text.secondary",
                fontSize: "0.875rem",
                flex: 1,
              }}
            >
              Buscar...
            </Typography>
            <Chip
              label="Ctrl+K"
              size="small"
              sx={{
                height: 20,
                fontSize: "0.65rem",
                backgroundColor: "action.selected",
                "& .MuiChip-label": { px: 1 },
              }}
            />
          </>
        )}
        {open && (
          <InputBase
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, orçamentos, produtos..."
            sx={{
              flex: 1,
              fontSize: "0.875rem",
              "& input": { p: 0 },
            }}
          />
        )}
        {open && query && (
          <IconButton size="small" onClick={() => setQuery("")}>
            <Close sx={{ fontSize: 16 }} />
          </IconButton>
        )}
      </Box>

      {/* Dropdown de resultados */}
      <Popper
        open={open && (results.length > 0 || query.length >= 2)}
        anchorEl={anchorRef.current}
        placement="bottom-start"
        transition
        style={{ zIndex: 1300 }}
      >
        {({ TransitionProps }) => (
          <ClickAwayListener onClickAway={handleClose}>
            <Fade {...TransitionProps} timeout={200}>
              <Paper
                elevation={8}
                sx={{
                  mt: 1,
                  width: 360,
                  maxHeight: 400,
                  overflow: "auto",
                  borderRadius: 2,
                }}
              >
                {results.length === 0 && query.length >= 2 ? (
                  <Box sx={{ p: 3, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body2">
                      Nenhum resultado para "{query}"
                    </Typography>
                  </Box>
                ) : (
                  <List disablePadding>
                    {results.map((result) => {
                      const config = typeConfig[result.type];
                      const IconComponent = config.icon;
                      return (
                        <ListItem key={result.id} disablePadding>
                          <ListItemButton onClick={() => handleSelect(result)}>
                            <ListItemIcon sx={{ minWidth: 40 }}>
                              <IconComponent sx={{ color: config.color }} />
                            </ListItemIcon>
                            <ListItemText
                              primary={result.title}
                              secondary={result.subtitle}
                              primaryTypographyProps={{
                                fontSize: "0.875rem",
                                fontWeight: 500,
                              }}
                              secondaryTypographyProps={{
                                fontSize: "0.75rem",
                              }}
                            />
                            <Chip
                              label={config.label}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: "0.65rem",
                                backgroundColor: `${config.color}15`,
                                color: config.color,
                              }}
                            />
                          </ListItemButton>
                        </ListItem>
                      );
                    })}
                  </List>
                )}
              </Paper>
            </Fade>
          </ClickAwayListener>
        )}
      </Popper>
    </>
  );
};

export default GlobalSearch;

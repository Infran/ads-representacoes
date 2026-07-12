import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  InputBase,
  useMediaQuery,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import { Search, Close } from "@mui/icons-material";
import Card from "../../ui/Card";
import { helpChapters, HelpChapter } from "./helpRegistry";

/** Remove acentos e caixa para uma busca tolerante a diacríticos. */
const normalize = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

const DEFAULT_SLUG = "inicio";

const getSlugFromHash = (hash: string): string => {
  const raw = decodeURIComponent(hash.replace(/^#/, "")).trim();
  return helpChapters.some((c) => c.slug === raw) ? raw : DEFAULT_SLUG;
};

// ---------------------------------------------------------------------------
// Item do sumário lateral (índice do manual). Ativo marcado por uma "espinha"
// de marca à esquerda — sem preencher cada item com um tile colorido.
// ---------------------------------------------------------------------------
const RailItem: React.FC<{
  chapter: HelpChapter;
  active: boolean;
  compact: boolean;
  onSelect: (slug: string) => void;
}> = ({ chapter, active, compact, onSelect }) => (
  <Box
    component="button"
    type="button"
    onClick={() => onSelect(chapter.slug)}
    aria-current={active ? "page" : undefined}
    sx={{
      position: "relative",
      appearance: "none",
      textAlign: "left",
      cursor: "pointer",
      font: "inherit",
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      width: compact ? "auto" : "100%",
      minWidth: compact ? "max-content" : 0,
      flexShrink: 0,
      py: 1,
      pl: compact ? 1.5 : 1.75,
      pr: compact ? 1.75 : 1.5,
      borderRadius: 2,
      border: compact ? "1px solid" : "1px solid transparent",
      borderColor: compact
        ? active
          ? "primary.main"
          : "divider"
        : "transparent",
      bgcolor: (t) =>
        active ? alpha(t.palette.primary.main, 0.08) : "transparent",
      color: active ? "primary.main" : "text.primary",
      transition: "background-color .15s ease, border-color .15s ease",
      "@media (prefers-reduced-motion: reduce)": { transition: "none" },
      "&:hover": {
        bgcolor: (t) => alpha(t.palette.primary.main, active ? 0.1 : 0.04),
      },
      "&:focus-visible": {
        outline: "2px solid",
        outlineColor: "primary.main",
        outlineOffset: 2,
      },
      // Espinha de marca à esquerda (só no índice vertical do desktop).
      "&::before": !compact
        ? {
            content: '""',
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: active ? "56%" : 0,
            borderRadius: 4,
            bgcolor: "primary.main",
            transition: "height .18s ease",
            "@media (prefers-reduced-motion: reduce)": { transition: "none" },
          }
        : undefined,
    }}
  >
    <chapter.Icon
      aria-hidden
      sx={{
        fontSize: 19,
        flexShrink: 0,
        color: active ? "primary.main" : "text.secondary",
      }}
    />
    <Typography
      component="span"
      variant="body2"
      sx={{
        fontWeight: active ? 600 : 500,
        whiteSpace: compact ? "nowrap" : "normal",
        lineHeight: 1.35,
      }}
    >
      {chapter.title}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// Cabeçalho do capítulo — o único momento "de marca" por capítulo.
// ---------------------------------------------------------------------------
const ChapterHeader: React.FC<{ chapter: HelpChapter }> = ({ chapter }) => (
  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, mb: 3 }}>
    <Box
      aria-hidden
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 48,
        height: 48,
        borderRadius: 2.5,
        flexShrink: 0,
        color: "primary.main",
        bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
      }}
    >
      <chapter.Icon sx={{ fontSize: 26 }} />
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Typography
        variant="h5"
        component="h2"
        sx={{ fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.01em" }}
      >
        {chapter.title}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5, lineHeight: 1.5 }}
      >
        {chapter.subtitle}
      </Typography>
    </Box>
  </Box>
);

// ---------------------------------------------------------------------------
// Página /Ajuda.
// ---------------------------------------------------------------------------
const Help: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [query, setQuery] = useState("");
  const activeSlug = getSlugFromHash(location.hash);
  const active = useMemo(
    () => helpChapters.find((c) => c.slug === activeSlug) ?? helpChapters[0],
    [activeSlug]
  );

  const panelRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const didMount = useRef(false);

  const openChapter = (slug: string) => {
    if (slug === activeSlug) return;
    navigate({ hash: slug });
  };
  const goToOverview = () => openChapter(DEFAULT_SLUG);

  // Ao trocar de capítulo: rola para o topo do conteúdo e move o foco (a11y).
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    sentinelRef.current?.scrollIntoView({
      block: "start",
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
    panelRef.current?.focus({ preventScroll: true });
  }, [activeSlug, prefersReducedMotion]);

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return helpChapters;
    return helpChapters.filter((c) =>
      normalize(`${c.title} ${c.subtitle} ${c.keywords}`).includes(q)
    );
  }, [query]);

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && filtered.length > 0) {
      openChapter(filtered[0].slug);
      setQuery("");
    }
    if (e.key === "Escape") setQuery("");
  };

  const ActiveContent = active.Component;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 3, md: 4 } }}>
      {/* Cabeçalho — mesmo idioma visual das demais telas (sem hero de gradiente). */}
      <Box>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            alignItems: { xs: "flex-start", md: "flex-end" },
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}
            >
              Central de Ajuda
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 0.75, maxWidth: "60ch", lineHeight: 1.6 }}
            >
              Guias passo a passo para cada tela — do cadastro de clientes à
              emissão de orçamentos em PDF.
            </Typography>
          </Box>

          {/* Busca de tópicos — campo real, alinhado ao produto. */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: { xs: "100%", md: 340 },
              flexShrink: 0,
              px: 1.5,
              py: 0.75,
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              transition: "border-color .15s ease, box-shadow .15s ease",
              "&:focus-within": {
                borderColor: "primary.main",
                boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.15)}`,
              },
            }}
          >
            <Search sx={{ color: "text.secondary", fontSize: 20 }} />
            <InputBase
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Buscar tópico (CNPJ, NCM, PDF…)"
              inputProps={{ "aria-label": "Buscar um tópico na Central de Ajuda" }}
              sx={{
                flex: 1,
                fontSize: "0.9rem",
                color: "text.primary",
                "& input::placeholder": { opacity: 0.7 },
              }}
            />
            {query && (
              <Box
                component="button"
                type="button"
                onClick={() => setQuery("")}
                aria-label="Limpar busca"
                sx={{
                  appearance: "none",
                  border: 0,
                  p: 0.25,
                  m: 0,
                  display: "flex",
                  cursor: "pointer",
                  bgcolor: "transparent",
                  color: "text.secondary",
                  borderRadius: 1,
                  "&:hover": { color: "text.primary" },
                  "&:focus-visible": {
                    outline: "2px solid",
                    outlineColor: "primary.main",
                  },
                }}
              >
                <Close sx={{ fontSize: 18 }} />
              </Box>
            )}
          </Box>
        </Box>
        <Divider sx={{ mt: 2.5 }} />
      </Box>

      <Box ref={sentinelRef} />

      {/* Índice + conteúdo. */}
      <Box
        sx={{
          display: "grid",
          gap: { xs: 2, md: 3 },
          gridTemplateColumns: { xs: "1fr", md: "248px minmax(0, 1fr)" },
          alignItems: "start",
        }}
      >
        {/* Índice do manual. */}
        <Box
          component="nav"
          aria-label="Tópicos da ajuda"
          sx={{
            position: { md: "sticky" },
            top: { md: 16 },
            display: "flex",
            flexDirection: { xs: "row", md: "column" },
            gap: { xs: 1, md: 0.25 },
            p: { xs: 0, md: 1 },
            borderRadius: 3,
            border: { md: "1px solid" },
            borderColor: { md: "divider" },
            bgcolor: { md: "background.paper" },
            overflowX: { xs: "auto", md: "visible" },
            // Esconde a barra de rolagem horizontal no mobile sem perder o gesto.
            scrollbarWidth: "none",
            "&::-webkit-scrollbar": { display: { xs: "none", md: "auto" } },
          }}
        >
          {!isMobile && (
            <Typography
              variant="overline"
              sx={{
                px: 1.75,
                pt: 0.5,
                pb: 1,
                color: "text.disabled",
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              Neste manual
            </Typography>
          )}
          {filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
              Nenhum tópico encontrado.
            </Typography>
          ) : (
            filtered.map((c) => (
              <RailItem
                key={c.slug}
                chapter={c}
                active={c.slug === activeSlug}
                compact={isMobile}
                onSelect={openChapter}
              />
            ))
          )}
        </Box>

        {/* Painel de conteúdo. */}
        <Box
          ref={panelRef}
          tabIndex={-1}
          role="region"
          aria-label={`Ajuda: ${active.title}`}
          sx={{ outline: "none" }}
        >
          <Card sx={{ p: { xs: 2.5, md: 4 } }}>
            {active.slug !== DEFAULT_SLUG && <ChapterHeader chapter={active} />}
            <ActiveContent onOpen={openChapter} goToOverview={goToOverview} />
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Help;

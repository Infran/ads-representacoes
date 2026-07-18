import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ChevronLeft, ChevronRight, EditOutlined, RequestQuote } from "@mui/icons-material";
import { SvgIconComponent } from "@mui/icons-material";
import { Timestamp } from "firebase/firestore";
import Button from "../../ui/Button";
import { DetailField, initials, tintForId } from "./cockpitUtils";

/** Configuração estática + derivadores do painel de detalhes de uma entidade. */
export interface CockpitDetailConfig<T> {
  getRowId: (item: T) => string;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  getFields: (item: T) => DetailField[];
  getTimestamps?: (item: T) => { createdAt?: Timestamp; updatedAt?: Timestamp };
  /** Tag verde ao lado do #id (ex.: "Cliente ativo"). */
  statusLabel: string;
  /** Rótulo vertical do rail recolhido (ex.: "DETALHES DO CLIENTE"). */
  railLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyIcon: SvgIconComponent;
  /** Rótulo do botão primário (ex.: "Novo orçamento"). */
  primaryActionLabel: string;
}

interface CockpitDetailPanelProps<T> {
  item: T | null;
  config: CockpitDetailConfig<T>;
  collapsed: boolean;
  /** Se o rail recolhível está disponível (telas largas). */
  collapsible: boolean;
  onCollapse: () => void;
  onExpand: () => void;
  onEdit: (item: T) => void;
  onPrimaryAction: (item: T) => void;
}

const formatDate = (ts?: Timestamp): string | null => {
  if (!ts?.seconds) return null;
  return new Date(ts.seconds * 1000).toLocaleDateString("pt-BR");
};

const FieldRow = ({ field }: { field: DetailField }) => (
  <Box>
    <Typography
      sx={{
        fontSize: 10,
        letterSpacing: ".5px",
        textTransform: "uppercase",
        color: "text.secondary",
        opacity: 0.85,
        mb: 0.4,
      }}
    >
      {field.label}
    </Typography>
    <Typography
      sx={{
        fontSize: 13,
        color: "text.primary",
        fontVariantNumeric: field.mono ? "tabular-nums" : undefined,
        wordBreak: "break-word",
      }}
    >
      {field.value}
    </Typography>
  </Box>
);

function CockpitDetailPanel<T>({
  item,
  config,
  collapsed,
  collapsible,
  onCollapse,
  onExpand,
  onEdit,
  onPrimaryAction,
}: CockpitDetailPanelProps<T>) {
  const showRail = collapsible && collapsed;
  const EmptyIcon = config.emptyIcon;

  const containerSx = {
    width: { xs: "100%", lg: showRail ? 46 : 300 },
    flexShrink: 0,
    border: "1px solid",
    borderColor: "divider",
    borderRadius: 3,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    transition: "width .18s ease",
  } as const;

  // Rail recolhido
  if (showRail) {
    return (
      <Paper elevation={0} sx={containerSx}>
        <Box
          onClick={onExpand}
          role="button"
          aria-label="Mostrar detalhes"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 1.75,
            cursor: "pointer",
            "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.03) },
          }}
        >
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              bgcolor: "primary.main",
              color: "common.white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronLeft sx={{ fontSize: 20 }} />
          </Box>
          <Typography
            sx={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1px",
              color: "text.secondary",
            }}
          >
            {config.railLabel}
          </Typography>
          <EmptyIcon sx={{ fontSize: 22, color: "text.disabled" }} />
        </Box>
      </Paper>
    );
  }

  // Sem seleção
  if (!item) {
    return (
      <Paper elevation={0} sx={containerSx}>
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 1.25,
            px: 3,
            py: 5,
            textAlign: "center",
            minHeight: 220,
          }}
        >
          <EmptyIcon sx={{ fontSize: 44, color: "text.disabled", opacity: 0.6 }} />
          <Typography sx={{ fontSize: 13, fontWeight: 600, color: "text.secondary" }}>
            {config.emptyTitle}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: "text.secondary", opacity: 0.8, lineHeight: 1.5 }}>
            {config.emptyDescription}
          </Typography>
        </Box>
      </Paper>
    );
  }

  const id = config.getRowId(item);
  const stamps = config.getTimestamps?.(item);
  const created = formatDate(stamps?.createdAt);
  const updated = formatDate(stamps?.updatedAt);

  return (
    <Paper elevation={0} sx={containerSx}>
      {/* Cabeçalho */}
      <Box
        sx={{
          p: 2.5,
          background: (t) =>
            `linear-gradient(180deg, ${alpha(t.palette.primary.main, 0.1)}, ${
              t.palette.background.paper
            })`,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              bgcolor: tintForId(id),
              color: "common.white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {initials(config.getTitle(item))}
          </Box>
          {collapsible && (
            <ChevronRight
              role="button"
              aria-label="Recolher detalhes"
              onClick={onCollapse}
              sx={{ fontSize: 22, color: "text.secondary", cursor: "pointer" }}
            />
          )}
        </Box>
        <Typography sx={{ fontSize: 16, fontWeight: 700, color: "text.primary", mt: 1.5 }}>
          {config.getTitle(item)}
        </Typography>
        <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
          {config.getSubtitle(item)}
        </Typography>
        <Box sx={{ display: "flex", gap: 0.75, mt: 1.25, flexWrap: "wrap" }}>
          <Box
            component="span"
            sx={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "primary.dark",
              bgcolor: "background.paper",
              border: "1px solid",
              borderColor: (t) => alpha(t.palette.primary.main, 0.3),
              px: 1.1,
              py: 0.35,
              borderRadius: 999,
            }}
          >
            #{id}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: 10.5,
              fontWeight: 600,
              color: "success.main",
              bgcolor: (t) => alpha(t.palette.success.main, 0.12),
              px: 1.1,
              py: 0.35,
              borderRadius: 999,
            }}
          >
            {config.statusLabel}
          </Box>
        </Box>
      </Box>

      {/* Corpo */}
      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2.5,
          py: 2.25,
          display: "flex",
          flexDirection: "column",
          gap: 1.9,
        }}
      >
        {config.getFields(item).map((field) => (
          <FieldRow key={field.label} field={field} />
        ))}

        {(created || updated) && (
          <>
            <Box sx={{ height: "1px", bgcolor: "divider" }} />
            <Typography sx={{ fontSize: 11, fontWeight: 600, color: "text.secondary" }}>
              Registro
            </Typography>
            {created && (
              <Box sx={{ display: "flex", gap: 1.25 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    mt: 0.6,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.primary" }}>Cadastrado</Typography>
                  <Typography sx={{ fontSize: 10.5, color: "text.secondary", opacity: 0.85 }}>
                    {created}
                  </Typography>
                </Box>
              </Box>
            )}
            {updated && (
              <Box sx={{ display: "flex", gap: 1.25 }}>
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "divider",
                    mt: 0.6,
                    flexShrink: 0,
                  }}
                />
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.primary" }}>Atualizado</Typography>
                  <Typography sx={{ fontSize: 10.5, color: "text.secondary", opacity: 0.85 }}>
                    {updated}
                  </Typography>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>

      {/* Ações */}
      <Box sx={{ display: "flex", gap: 1.25, p: 2, borderTop: "1px solid", borderColor: "divider" }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={() => onEdit(item)}
          startIcon={<EditOutlined />}
          sx={{ flex: 1, color: "text.secondary", borderColor: "divider" }}
        >
          Editar
        </Button>
        <Button
          variant="contained"
          onClick={() => onPrimaryAction(item)}
          startIcon={<RequestQuote />}
          sx={{ flex: 1.4 }}
        >
          {config.primaryActionLabel}
        </Button>
      </Box>
    </Paper>
  );
}

export default CockpitDetailPanel;

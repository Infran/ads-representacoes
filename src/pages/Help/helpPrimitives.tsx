import React from "react";
import {
  Box,
  Chip,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  SvgIconProps,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  InfoOutlined,
  TipsAndUpdates,
  WarningAmber,
  ReportProblem,
  PriorityHigh,
  ExpandMore,
} from "@mui/icons-material";

/**
 * Primitivas visuais da Central de Ajuda (tela /Ajuda).
 * Renderizam a estrutura do manual (docs/manual) como componentes de leitura,
 * todos tokenizados via tema (sem hex — UI U3.5) e válidos em claro/escuro.
 * A regra estética: os marcadores numéricos existem apenas onde o conteúdo é
 * de fato sequencial (passos, fluxos); títulos e listas de destaque são calmos.
 * Reusados pelos capítulos em `helpChapters.tsx`.
 */

type SemanticColor = "info" | "primary" | "success" | "warning" | "error";

// ---------------------------------------------------------------------------
// SectionTitle — cabeçalho de seção. Ícone inline na cor semântica (sem tile),
// para não repetir o mesmo "chiclete" colorido em toda a página.
// ---------------------------------------------------------------------------
interface SectionTitleProps {
  icon: React.ComponentType<SvgIconProps>;
  children: React.ReactNode;
  color?: SemanticColor;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  icon: Icon,
  children,
  color = "primary",
}) => (
  <Box
    sx={{
      display: "flex",
      alignItems: "center",
      gap: 1.25,
      mt: 4,
      mb: 1.75,
    }}
  >
    <Icon aria-hidden sx={{ fontSize: 20, color: `${color}.main`, flexShrink: 0 }} />
    <Typography
      variant="subtitle1"
      component="h3"
      sx={{ fontWeight: 700, lineHeight: 1.3, letterSpacing: "-0.01em" }}
    >
      {children}
    </Typography>
  </Box>
);

// ---------------------------------------------------------------------------
// Lead — parágrafo de abertura do capítulo (medida de leitura confortável).
// ---------------------------------------------------------------------------
export const Lead: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="body1"
    color="text.secondary"
    sx={{ lineHeight: 1.75, maxWidth: "68ch", mb: 1 }}
  >
    {children}
  </Typography>
);

// ---------------------------------------------------------------------------
// Callout — Nota / Importante / Dica / Atenção. Faixa lateral semântica + ícone.
// ---------------------------------------------------------------------------
type CalloutVariant = "nota" | "importante" | "dica" | "atencao" | "cuidado";

const CALLOUTS: Record<
  CalloutVariant,
  { color: SemanticColor; Icon: React.ComponentType<SvgIconProps>; label: string }
> = {
  nota: { color: "info", Icon: InfoOutlined, label: "Nota" },
  importante: { color: "primary", Icon: PriorityHigh, label: "Importante" },
  dica: { color: "success", Icon: TipsAndUpdates, label: "Dica" },
  atencao: { color: "warning", Icon: WarningAmber, label: "Atenção" },
  cuidado: { color: "error", Icon: ReportProblem, label: "Atenção" },
};

interface CalloutProps {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
}

export const Callout: React.FC<CalloutProps> = ({
  variant = "nota",
  title,
  children,
}) => {
  const { color, Icon, label } = CALLOUTS[variant];
  return (
    <Box
      sx={{
        display: "flex",
        gap: 1.5,
        p: 2,
        my: 2.5,
        borderRadius: 2,
        border: "1px solid",
        borderColor: (t) => alpha(t.palette[color].main, 0.25),
        borderLeft: "3px solid",
        borderLeftColor: `${color}.main`,
        bgcolor: (t) => alpha(t.palette[color].main, 0.06),
      }}
    >
      <Box sx={{ color: `${color}.main`, display: "flex", pt: 0.25 }} aria-hidden>
        <Icon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 700, color: `${color}.main`, mb: 0.25 }}
        >
          {title ?? label}
        </Typography>
        <Typography
          variant="body2"
          color="text.primary"
          component="div"
          sx={{ lineHeight: 1.65 }}
        >
          {children}
        </Typography>
      </Box>
    </Box>
  );
};

// ---------------------------------------------------------------------------
// FlowSteps — fluxos do manual como sequência de nós numerados. Os números são
// justificados: o conteúdo É ordenado. Horizontal no desktop; empilha no mobile
// com uma linha-guia vertical à esquerda.
// ---------------------------------------------------------------------------
export interface FlowNode {
  label: string;
  detail?: string;
}

export const FlowSteps: React.FC<{ nodes: FlowNode[] }> = ({ nodes }) => (
  <Box
    role="list"
    sx={{
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      alignItems: "stretch",
      gap: { xs: 0, md: 1.5 },
      my: 2.5,
    }}
  >
    {nodes.map((node, i) => (
      <Box
        role="listitem"
        key={node.label}
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          gap: 1.25,
          pb: { xs: i < nodes.length - 1 ? 2.5 : 0, md: 0 },
          // Linha-guia vertical conectando os passos no mobile.
          "&::before": {
            content: '""',
            display: { xs: i < nodes.length - 1 ? "block" : "none", md: "none" },
            position: "absolute",
            left: 13,
            top: 30,
            bottom: 0,
            width: "2px",
            bgcolor: "divider",
          },
        }}
      >
        <Box
          aria-hidden
          sx={{
            zIndex: 1,
            flexShrink: 0,
            width: 28,
            height: 28,
            borderRadius: "50%",
            bgcolor: "primary.main",
            color: "primary.contrastText",
            fontSize: 13,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {i + 1}
        </Box>
        <Box sx={{ minWidth: 0, pt: 0.25 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4 }}>
            {node.label}
          </Typography>
          {node.detail && (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.25, lineHeight: 1.45 }}
            >
              {node.detail}
            </Typography>
          )}
        </Box>
      </Box>
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// FieldTable — tabela de especificação de campos de formulário.
// ---------------------------------------------------------------------------
type FieldReq = "req" | "opt" | "rec" | "locked";

export interface FieldSpec {
  name: string;
  req: FieldReq;
  input: React.ReactNode;
  format: React.ReactNode;
}

const REQ_CHIP: Record<
  FieldReq,
  { label: string; color: "warning" | "default" | "info"; variant: "filled" | "outlined" }
> = {
  req: { label: "Obrigatório", color: "warning", variant: "outlined" },
  opt: { label: "Opcional", color: "default", variant: "outlined" },
  rec: { label: "Recomendado", color: "info", variant: "outlined" },
  locked: { label: "Travado", color: "default", variant: "outlined" },
};

export const FieldTable: React.FC<{ fields: FieldSpec[] }> = ({ fields }) => (
  <TableContainer
    sx={{
      my: 2.5,
      border: "1px solid",
      borderColor: "divider",
      borderRadius: 2,
      overflowX: "auto",
    }}
  >
    <Table size="small" sx={{ minWidth: 620 }}>
      <TableHead>
        <TableRow sx={{ bgcolor: (t) => alpha(t.palette.text.primary, 0.03) }}>
          <TableCell sx={{ fontWeight: 700 }}>Campo</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Obrigatório?</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>O que digitar</TableCell>
          <TableCell sx={{ fontWeight: 700 }}>Formato / comportamento</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {fields.map((f) => {
          const chip = REQ_CHIP[f.req];
          return (
            <TableRow
              key={f.name}
              sx={{
                "&:last-child td": { border: 0 },
                "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.02) },
              }}
            >
              <TableCell sx={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                {f.name}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={chip.label}
                  color={chip.color}
                  variant={chip.variant}
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{f.input}</TableCell>
              <TableCell sx={{ color: "text.secondary" }}>{f.format}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

// ---------------------------------------------------------------------------
// NumberedList — passo a passo (1..n) com selos numerados (sequência real).
// ---------------------------------------------------------------------------
export const NumberedList: React.FC<{ items: React.ReactNode[]; start?: number }> = ({
  items,
  start = 1,
}) => (
  <Box component="ol" sx={{ listStyle: "none", m: 0, p: 0, my: 1.5 }}>
    {items.map((item, i) => (
      <Box
        component="li"
        key={i}
        sx={{ display: "flex", gap: 1.5, alignItems: "flex-start", mb: 1.25 }}
      >
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 24,
            height: 24,
            mt: 0.1,
            borderRadius: "50%",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
            color: "primary.main",
            fontSize: 12.5,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {start + i}
        </Box>
        <Typography
          variant="body2"
          color="text.primary"
          component="div"
          sx={{ lineHeight: 1.65, pt: 0.15 }}
        >
          {item}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// SubHeading — título de sub-fluxo (ex.: "B. Como cadastrar…").
// ---------------------------------------------------------------------------
export const SubHeading: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography
    variant="subtitle2"
    component="h4"
    sx={{ fontWeight: 700, mt: 2.5, mb: 0.75, color: "text.primary" }}
  >
    {children}
  </Typography>
);

// ---------------------------------------------------------------------------
// Faq — perguntas frequentes como acordeão acessível.
// ---------------------------------------------------------------------------
export interface FaqItem {
  q: string;
  a: React.ReactNode;
}

export const Faq: React.FC<{ items: FaqItem[] }> = ({ items }) => (
  <Box sx={{ my: 1 }}>
    {items.map((item, i) => (
      <Accordion
        key={i}
        disableGutters
        elevation={0}
        square
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          mb: 1,
          bgcolor: "transparent",
          "&:before": { display: "none" },
          overflow: "hidden",
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            "& .MuiAccordionSummary-content": { my: 1.25 },
            "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.02) },
          }}
        >
          <Typography sx={{ fontWeight: 600 }}>{item.q}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            component="div"
            sx={{ lineHeight: 1.7 }}
          >
            {item.a}
          </Typography>
        </AccordionDetails>
      </Accordion>
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Bullets — lista de destaques com marcador de marca.
// ---------------------------------------------------------------------------
export const Bullets: React.FC<{ items: React.ReactNode[] }> = ({ items }) => (
  <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, my: 1.5 }}>
    {items.map((item, i) => (
      <Box
        component="li"
        key={i}
        sx={{ display: "flex", gap: 1.25, alignItems: "flex-start", mb: 1 }}
      >
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 6,
            height: 6,
            mt: 1,
            borderRadius: "50%",
            bgcolor: "primary.main",
          }}
        />
        <Typography
          variant="body2"
          color="text.primary"
          component="div"
          sx={{ lineHeight: 1.65 }}
        >
          {item}
        </Typography>
      </Box>
    ))}
  </Box>
);

// ---------------------------------------------------------------------------
// Term — realce inline para termos/valores do sistema. Estilo "código" neutro,
// legível em ambos os modos (sem depender de tons de marca com baixo contraste).
// ---------------------------------------------------------------------------
export const Term: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Box
    component="code"
    sx={{
      fontFamily: "'SFMono-Regular', 'Roboto Mono', Menlo, Consolas, monospace",
      fontSize: "0.85em",
      whiteSpace: "nowrap",
      px: 0.6,
      py: 0.15,
      borderRadius: 1,
      border: "1px solid",
      borderColor: (t) => alpha(t.palette.text.primary, 0.1),
      bgcolor: (t) => alpha(t.palette.text.primary, 0.05),
      color: "text.primary",
    }}
  >
    {children}
  </Box>
);

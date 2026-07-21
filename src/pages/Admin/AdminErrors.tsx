import { FC, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BugReport, ExpandMore, CheckCircleOutline } from "@mui/icons-material";
import PageHeader from "../../components/PageHeader/PageHeader";
import { Card, Button, TableSkeleton, ErrorState, EmptyState } from "../../ui";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import AdminNav from "./AdminNav";
import { groupErrors, formatDateTime, formatRelative } from "./auditFormat";

const AdminErrors: FC = () => {
  // Filtro no SERVIDOR (índice composto `{action ASC, at DESC}`). Peneirar no
  // cliente faria uma tarde normal de cadastros empurrar o erro para fora da
  // janela carregada — e esta tela anunciaria "nenhum erro" justamente quando
  // houvesse um.
  const { logs, loading, error, hasMore, loadMore, reload } = useAuditLogs(
    100,
    "error"
  );
  const [expanded, setExpanded] = useState<string | false>(false);

  // Agrupado por assinatura: 300 ocorrências do mesmo bug viram uma linha com
  // contador, em vez de 300 linhas que escondem os outros problemas.
  const groups = useMemo(() => groupErrors(logs), [logs]);

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Erros"
        description="Falhas de runtime agrupadas por assinatura, com ocorrências, rota e usuário."
        icon={BugReport}
      />
      <AdminNav />

      {loading && logs.length === 0 ? (
        <TableSkeleton />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar os erros"
          message="A leitura do registro falhou. Confirme se o seu usuário tem papel de administrador."
          onRetry={reload}
        />
      ) : groups.length === 0 ? (
        <EmptyState
          title="Nenhum erro registrado"
          description="Nada quebrou desde que a captura de erros foi ativada. Erros de tela, de rede e de permissão aparecem aqui automaticamente."
          icon={CheckCircleOutline}
        />
      ) : (
        <>
          {groups.map((group) => (
            <Accordion
              key={group.fingerprint}
              expanded={expanded === group.fingerprint}
              onChange={(_e, isOpen) =>
                setExpanded(isOpen ? group.fingerprint : false)
              }
              elevation={0}
              disableGutters
              sx={{
                borderRadius: 3,
                border: "1px solid",
                borderColor: "divider",
                bgcolor: "background.paper",
                "&::before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box
                  display="flex"
                  alignItems="center"
                  gap={1.5}
                  flexWrap="wrap"
                  width="100%"
                >
                  <Box
                    component="span"
                    sx={{
                      px: 1,
                      py: 0.25,
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "error.main",
                      bgcolor: (t) => alpha(t.palette.error.main, 0.1),
                      flexShrink: 0,
                    }}
                  >
                    {group.occurrences}×
                  </Box>
                  <Typography
                    sx={{ fontSize: 13, fontWeight: 600, minWidth: 0, flex: 1 }}
                    noWrap
                  >
                    {group.errorMessage}
                  </Typography>
                  <Typography
                    sx={{ fontSize: 11.5, flexShrink: 0 }}
                    color="text.secondary"
                  >
                    {formatRelative(group.lastAt)}
                  </Typography>
                </Box>
              </AccordionSummary>

              <AccordionDetails>
                <Box display="flex" flexDirection="column" gap={0.75}>
                  <Typography variant="body2">
                    <strong>Rota:</strong> {group.route || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Código:</strong> {group.errorCode || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Usuários afetados:</strong>{" "}
                    {group.actors.join(", ") || "—"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Última ocorrência:</strong>{" "}
                    {formatDateTime(group.lastAt)}
                  </Typography>

                  {group.sample.errorStack && (
                    <Box mt={1}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: ".3px",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Stack
                      </Typography>
                      {/* Rola dentro do próprio container: a página nunca
                          rola horizontalmente. */}
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          borderRadius: 2,
                          fontSize: 11,
                          overflowX: "auto",
                          bgcolor: "background.default",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {group.sample.errorStack}
                      </Box>
                    </Box>
                  )}

                  {group.sample.componentStack && (
                    <Box mt={1}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: ".3px",
                          textTransform: "uppercase",
                          color: "text.secondary",
                          mb: 0.5,
                        }}
                      >
                        Componentes
                      </Typography>
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 1.5,
                          borderRadius: 2,
                          fontSize: 11,
                          overflowX: "auto",
                          bgcolor: "background.default",
                          border: "1px solid",
                          borderColor: "divider",
                        }}
                      >
                        {group.sample.componentStack}
                      </Box>
                    </Box>
                  )}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}

          {hasMore && (
            <Box display="flex" justifyContent="center">
              <Button variant="outlined" onClick={loadMore} disabled={loading}>
                Carregar mais
              </Button>
            </Box>
          )}

          <Card>
            <Typography variant="body2" color="text.secondary">
              Erros repetidos são agrupados e gravados no máximo uma vez a cada
              10 minutos por assinatura, com teto de 25 por sessão — as
              ocorrências seguem sendo contadas.
            </Typography>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AdminErrors;

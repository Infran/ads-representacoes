import { FC, useMemo, useState, useEffect } from "react";
import { Box, Typography, Alert } from "@mui/material";
import {
  AdminPanelSettings,
  PlaylistAddCheck,
  BugReport,
  DeleteSweep,
  Schedule,
} from "@mui/icons-material";
import PageHeader from "../../components/PageHeader/PageHeader";
import { StatCard, Card, TableSkeleton, ErrorState } from "../../ui";
import { useAuditLogs } from "../../hooks/useAuditLogs";
import { getAuditHealth } from "../../services/auditService";
import { getReporterHealth } from "../../utils/errorReporter";
import { countBinItems } from "../../services/binService";
import { useData } from "../../context/DataContext";
import { logger } from "../../utils/logger";
import AdminNav from "./AdminNav";
import { actionLabel, entityLabel, formatRelative } from "./auditFormat";

const DAY_MS = 24 * 60 * 60 * 1000;

const AdminOverview: FC = () => {
  // Uma página de 100 alimenta o feed e os indicadores de atividade.
  const { logs, loading, error, reload } = useAuditLogs(100);
  // Erros vêm de uma query PRÓPRIA, filtrada no servidor. Contá-los dentro da
  // página geral subnotificaria: o log é dominado por CRUD, então um dia
  // movimentado empurra os erros para fora das 100 entradas e o indicador
  // exibiria zero com erros acontecendo.
  const { logs: errorLogs } = useAuditLogs(50, "error");
  const { getCacheStats } = useData();

  // Contagem REAL da lixeira, via agregação no servidor. Antes este número saía
  // de `logs.filter(action === "delete")`, que conta EVENTOS de exclusão nas
  // últimas 100 entradas — restaurar um item não fazia o número cair, e
  // exclusões antigas sumiam da conta. O rótulo dizia "itens na lixeira" e
  // mostrava outra coisa.
  const [binCount, setBinCount] = useState<number | null>(null);
  useEffect(() => {
    let cancelled = false;
    countBinItems()
      .then((n) => {
        if (!cancelled) setBinCount(n);
      })
      .catch((err) => {
        logger.error("[AdminOverview] falha ao contar a lixeira:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const auditHealth = getAuditHealth();
  const reporterHealth = getReporterHealth();

  const metrics = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const at = (log: (typeof logs)[number]) =>
      log.at?.toDate ? log.at.toDate().getTime() : 0;

    const errors7d = errorLogs.filter((l) => now - at(l) <= 7 * DAY_MS).length;

    return {
      today: logs.filter((l) => l.action !== "error" && at(l) >= startOfToday)
        .length,
      errors7d,
      // A página de erros é limitada a 50: se TODOS os 50 couberam na janela,
      // provavelmente há mais. Melhor "50+" do que um número exato e errado.
      errors7dTruncated: errors7d === errorLogs.length && errorLogs.length === 50,
      failures: logs.filter((l) => l.status === "failure").length,
      last: logs[0],
    };
  }, [logs, errorLogs]);

  // `getCacheStats` já existia no DataContext e nenhuma tela consumia.
  const cacheStats = useMemo(() => {
    try {
      const stats = getCacheStats();
      return Object.entries(stats)
        .map(([key, s]) => `${key}: ${s.itemCount}`)
        .join(" · ");
    } catch {
      return "indisponível";
    }
  }, [getCacheStats]);

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Painel de administração"
        description="Visão geral da atividade, dos erros e da saúde do sistema."
        icon={AdminPanelSettings}
      />
      <AdminNav />

      {/*
        Falhas de gravação do próprio log aparecem AQUI, e nunca como toast:
        interromper um salvamento bem-sucedido por causa de encanamento de
        telemetria seria pior que o problema que se quer observar.
      */}
      {auditHealth.failures > 0 && (
        <Alert severity="warning">
          {auditHealth.failures} registro(s) de auditoria falharam ao ser
          gravados — pode haver atividade que NÃO está no histórico abaixo.
          {auditHealth.lastFailureMessage
            ? ` Última causa: ${auditHealth.lastFailureMessage}`
            : ""}
          {auditHealth.lastFailureAt
            ? ` (${new Date(auditHealth.lastFailureAt).toLocaleString("pt-BR")})`
            : ""}
        </Alert>
      )}
      {reporterHealth.capped && (
        <Alert severity="info">
          O limite de {reporterHealth.written} erros por sessão foi atingido;
          novas ocorrências estão sendo contabilizadas, mas não gravadas.
        </Alert>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <ErrorState
          title="Não foi possível carregar o painel"
          message="A leitura do registro de auditoria falhou. Confirme se o seu usuário tem papel de administrador."
          onRetry={reload}
        />
      ) : (
        <>
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(4, 1fr)",
            }}
          >
            <StatCard
              label="Ações hoje"
              value={metrics.today}
              icon={PlaylistAddCheck}
              highlight
            />
            <StatCard
              label="Erros (7 dias)"
              value={
                metrics.errors7dTruncated
                  ? `${metrics.errors7d}+`
                  : metrics.errors7d
              }
              icon={BugReport}
              color={metrics.errors7d > 0 ? "error" : "success"}
            />
            <StatCard
              label="Itens na lixeira"
              value={binCount ?? "—"}
              icon={DeleteSweep}
              color="warning"
              helperText="Exclusões restauráveis"
            />
            <StatCard
              label="Última atividade"
              value={formatRelative(metrics.last?.at)}
              icon={Schedule}
              color="info"
              helperText={metrics.last?.label}
            />
          </Box>

          <Card>
            <Typography
              sx={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: ".4px",
                textTransform: "uppercase",
                color: "text.secondary",
                mb: 1.5,
              }}
            >
              Últimas ações
            </Typography>

            {logs.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Nenhuma atividade registrada ainda.
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {logs.slice(0, 8).map((log) => (
                  <Box
                    key={log.id}
                    display="flex"
                    alignItems="center"
                    gap={1}
                    flexWrap="wrap"
                  >
                    <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                      {actionLabel(log.action)}
                    </Typography>
                    <Typography sx={{ fontSize: 12.5 }} color="text.secondary">
                      {entityLabel(log.entity)} · {log.label}
                    </Typography>
                    <Typography
                      sx={{ fontSize: 11.5, ml: "auto" }}
                      color="text.secondary"
                    >
                      {log.actorEmail} · {formatRelative(log.at)}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Card>

          <Card>
            <Typography variant="body2" color="text.secondary">
              Cache local — {cacheStats}
              {metrics.failures > 0
                ? ` · ${metrics.failures} operação(ões) com falha registrada(s)`
                : ""}
            </Typography>
          </Card>
        </>
      )}
    </Box>
  );
};

export default AdminOverview;

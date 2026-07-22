import { FC, useState, useEffect } from "react";
import { Box, Typography, Divider, Alert, TextField } from "@mui/material";
import { Tune, DeleteSweep } from "@mui/icons-material";
import PageHeader from "../../components/PageHeader/PageHeader";
import { Card, Button, confirmDialog, notifySuccess, notifyError } from "../../ui";
import { useAuth } from "../../context/ContextAuth";
import { useData } from "../../context/DataContext";
import { invalidateAllCache } from "../../services/cacheService";
import {
  purgeExpiredAuditLogs,
  purgeAuditLogsInRange,
  getAuditHealth,
  clearAuditHealth,
} from "../../services/auditService";
import { logger } from "../../utils/logger";
import AdminNav from "./AdminNav";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

/** Linha rótulo/valor do bloco de diagnóstico. */
const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box
    display="flex"
    justifyContent="space-between"
    gap={2}
    py={0.75}
    flexWrap="wrap"
  >
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
      {value}
    </Typography>
  </Box>
);

const AdminSystem: FC = () => {
  const { currentUser, role } = useAuth();
  const { refreshAll } = useData();
  const [busy, setBusy] = useState(false);
  const [remaining, setRemaining] = useState("—");
  // Expurgo de erros por intervalo de datas (inputs `type="date"`, "yyyy-MM-dd").
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  // Em estado, e não lido direto no render: `clearAuditHealth` precisa
  // repintar a tela, e `getAuditHealth` sozinho não é reativo.
  const [health, setHealth] = useState(getAuditHealth);

  // Contagem regressiva da sessão, a partir do mesmo `loginTime` que o
  // logout automático do ContextAuth usa.
  useEffect(() => {
    const tick = () => {
      const loginTime = sessionStorage.getItem("loginTime");
      if (!loginTime) {
        setRemaining("—");
        return;
      }
      const left = SESSION_TTL_MS - (Date.now() - parseInt(loginTime, 10));
      if (left <= 0) {
        setRemaining("expirada");
        return;
      }
      const minutes = Math.floor(left / 60000);
      setRemaining(`${Math.floor(minutes / 60)}h ${minutes % 60}min`);
    };

    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const handleClearCache = async () => {
    setBusy(true);
    try {
      invalidateAllCache();
      await refreshAll();
      await notifySuccess("Cache limpo", "Os dados foram recarregados.");
    } catch (err) {
      logger.error("Erro ao limpar cache:", err);
      await notifyError("Não foi possível limpar o cache", err);
    } finally {
      setBusy(false);
    }
  };

  const handleClearHealth = async () => {
    clearAuditHealth();
    setHealth(getAuditHealth());
    await notifySuccess(
      "Contador zerado",
      "As falhas de gravação foram marcadas como vistas."
    );
  };

  const handlePurge = async () => {
    setBusy(true);
    try {
      const removed = await purgeExpiredAuditLogs();
      await notifySuccess(
        "Expurgo concluído",
        removed === 0
          ? "Nenhum registro vencido foi encontrado."
          : `${removed} registro(s) vencido(s) removido(s).`
      );
    } catch (err) {
      logger.error("Erro ao expurgar registros:", err);
      await notifyError("Não foi possível expurgar os registros", err);
    } finally {
      setBusy(false);
    }
  };

  // Expurga todos os erros gravados no intervalo [fromDate 00:00, toDate 23:59].
  const handlePurgeErrorRange = async () => {
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59.999`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
    if (start > end) {
      await notifyError(
        "Intervalo inválido",
        "A data inicial não pode ser posterior à data final."
      );
      return;
    }

    const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
    const ok = await confirmDialog({
      title: "Expurgar erros no período?",
      text: `Remove permanentemente todos os erros registrados entre ${fmt(
        start
      )} e ${fmt(end)}. Não pode ser desfeito.`,
      confirmText: "Expurgar",
      danger: true,
      icon: "warning",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const removed = await purgeAuditLogsInRange(start, end, "error");
      await notifySuccess(
        "Expurgo concluído",
        removed === 0
          ? "Nenhum erro encontrado no período."
          : `${removed} registro(s) de erro removido(s).`
      );
      setFromDate("");
      setToDate("");
    } catch (err) {
      logger.error("Erro ao expurgar erros por intervalo:", err);
      await notifyError("Não foi possível expurgar os erros", err);
    } finally {
      setBusy(false);
    }
  };

  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "—";

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Sistema"
        description="Diagnóstico do ambiente, da sessão e do cache local."
        icon={Tune}
      />
      <AdminNav />

      {/*
        Os IDs de projeto deste app são invertidos (`ads-representacoes-dev` é
        a PRODUÇÃO real). Mostrar qual está ativo evita a classe inteira de
        engano de "mexi no banco errado".
      */}
      <Alert severity={projectId.endsWith("-dev") ? "warning" : "info"}>
        {projectId.endsWith("-dev")
          ? "Você está conectado ao ambiente de PRODUÇÃO."
          : "Você está conectado ao ambiente de desenvolvimento."}
      </Alert>

      <Card>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: ".4px",
            textTransform: "uppercase",
            color: "text.secondary",
            mb: 1,
          }}
        >
          Ambiente
        </Typography>
        <Row label="Projeto Firebase" value={projectId} />
        <Divider />
        <Row label="Modo de build" value={import.meta.env.MODE} />
        <Divider />
        <Row label="Usuário" value={currentUser?.email ?? "—"} />
        <Divider />
        <Row label="Papel" value={role === "admin" ? "Administrador" : "Staff"} />
        <Divider />
        <Row label="Sessão expira em" value={remaining} />
      </Card>

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
          Expurgar erros por período
        </Typography>
        <Box display="flex" gap={1.5} alignItems="center" flexWrap="wrap">
          <TextField
            label="De"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Até"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteSweep />}
            onClick={handlePurgeErrorRange}
            disabled={busy || !fromDate || !toDate}
          >
            Expurgar no período
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Remove permanentemente os registros de <strong>erro</strong> gravados
          no intervalo informado (datas inclusivas). Não afeta os demais tipos
          de auditoria.
        </Typography>
      </Card>

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
          Manutenção
        </Typography>
        <Box display="flex" gap={1.5} flexWrap="wrap">
          <Button variant="outlined" onClick={handleClearCache} disabled={busy}>
            Limpar cache local
          </Button>
          <Button variant="outlined" onClick={handlePurge} disabled={busy}>
            Expurgar registros vencidos
          </Button>
          {health.failures > 0 && (
            <Button variant="outlined" onClick={handleClearHealth} disabled={busy}>
              Marcar falhas como vistas
            </Button>
          )}
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          Registros de auditoria vencem em 180 dias. O expurgo remove apenas os
          já vencidos.
        </Typography>
      </Card>
    </Box>
  );
};

export default AdminSystem;

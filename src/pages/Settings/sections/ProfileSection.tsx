import { FC, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Divider,
  Avatar,
  Stack,
  InputAdornment,
  IconButton,
} from "@mui/material";
import { Visibility, VisibilityOff, Check } from "@mui/icons-material";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../../firebase";
import { useAuth } from "../../../context/ContextAuth";
import { usePreferences } from "../../../context/PreferencesContext";
import { tokens } from "../../../theme/tokens";
import { Card, Field, Button, notifySuccess, notifyError } from "../../../ui";
import { logger } from "../../../utils/logger";

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

const SectionCaption: FC<{ children: string }> = ({ children }) => (
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
    {children}
  </Typography>
);

const Row: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box display="flex" justifyContent="space-between" gap={2} py={0.75} flexWrap="wrap">
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-all" }}>
      {value}
    </Typography>
  </Box>
);

const getInitials = (name?: string | null) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const ProfileSection: FC = () => {
  const { currentUser, role, refreshUser } = useAuth();
  const { preferences, setPreference } = usePreferences();

  const [name, setName] = useState(currentUser?.displayName ?? "");
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);

  const [remaining, setRemaining] = useState("—");

  // Contagem regressiva da sessão (mesmo `loginTime` do logout automático).
  useEffect(() => {
    const tick = () => {
      const loginTime = sessionStorage.getItem("loginTime");
      if (!loginTime) return setRemaining("—");
      const left = SESSION_TTL_MS - (Date.now() - parseInt(loginTime, 10));
      if (left <= 0) return setRemaining("expirada");
      const minutes = Math.floor(left / 60000);
      setRemaining(`${Math.floor(minutes / 60)}h ${minutes % 60}min`);
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  const avatarColor = preferences.avatarColor || undefined;

  const handleSaveName = async () => {
    const trimmed = name.trim();
    if (!auth.currentUser || !trimmed || trimmed === currentUser?.displayName) return;
    setSavingName(true);
    try {
      await updateProfile(auth.currentUser, { displayName: trimmed });
      await refreshUser();
      await notifySuccess("Nome atualizado");
    } catch (err) {
      logger.error("Erro ao atualizar nome:", err);
      await notifyError("Não foi possível atualizar o nome", err);
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!auth.currentUser || !currentUser?.email) return;
    if (newPassword.length < 6) {
      await notifyError("Senha muito curta", "Use ao menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      await notifyError("As senhas não conferem", "Confirme a nova senha corretamente.");
      return;
    }
    setSavingPass(true);
    try {
      // Reautenticação: o Firebase exige login recente para trocar a senha.
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      await notifySuccess("Senha alterada");
    } catch (err) {
      logger.error("Erro ao alterar senha:", err);
      await notifyError("Não foi possível alterar a senha", err);
    } finally {
      setSavingPass(false);
    }
  };

  const handleSendReset = async () => {
    if (!currentUser?.email) return;
    setSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, currentUser.email);
      await notifySuccess(
        "E-mail enviado",
        "Verifique sua caixa de entrada para redefinir a senha."
      );
    } catch (err) {
      logger.error("Erro ao enviar redefinição:", err);
      await notifyError("Não foi possível enviar o e-mail", err);
    } finally {
      setSendingReset(false);
    }
  };

  const nameChanged = name.trim() !== (currentUser?.displayName ?? "") && name.trim().length > 0;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Card>
        <SectionCaption>Identificação</SectionCaption>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1.5 }}>
          <Avatar
            sx={{
              width: 56,
              height: 56,
              bgcolor: avatarColor ?? "primary.main",
              fontWeight: 600,
            }}
          >
            {getInitials(name || currentUser?.displayName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Field
              label="Nome de exibição"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="small"
            />
          </Box>
          <Button
            variant="contained"
            onClick={handleSaveName}
            disabled={!nameChanged || savingName}
          >
            Salvar
          </Button>
        </Stack>

        <Divider sx={{ my: 1 }} />

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Cor do avatar
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {["", ...tokens.avatarTints].map((tint) => {
            const selected = preferences.avatarColor === tint;
            const isDefault = tint === "";
            return (
              <IconButton
                key={tint || "default"}
                onClick={() => setPreference("avatarColor", tint)}
                aria-label={isDefault ? "Cor padrão" : `Cor ${tint}`}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: isDefault ? "primary.main" : tint,
                  border: selected ? "3px solid" : "2px solid",
                  borderColor: selected ? "text.primary" : "divider",
                  "&:hover": { bgcolor: isDefault ? "primary.dark" : tint },
                }}
              >
                {selected && (
                  <Check sx={{ fontSize: 18, color: "common.white" }} />
                )}
              </IconButton>
            );
          })}
        </Box>
      </Card>

      <Card>
        <SectionCaption>Segurança</SectionCaption>
        <Stack spacing={1.5}>
          <Field
            label="Senha atual"
            type={showPass ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPass((s) => !s)}
                    edge="end"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Field
            label="Nova senha"
            type={showPass ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            helperText="Mínimo de 6 caracteres."
          />
          <Field
            label="Confirmar nova senha"
            type={showPass ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          <Box display="flex" gap={1.5} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Check />}
              onClick={handleChangePassword}
              disabled={
                savingPass ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              Alterar senha
            </Button>
            <Button
              variant="outlined"
              onClick={handleSendReset}
              disabled={sendingReset}
            >
              Enviar e-mail de redefinição
            </Button>
          </Box>
        </Stack>
      </Card>

      <Card>
        <SectionCaption>Conta</SectionCaption>
        <Row label="E-mail" value={currentUser?.email ?? "—"} />
        <Divider />
        <Row label="Papel" value={role === "admin" ? "Administrador" : "Staff"} />
        <Divider />
        <Row label="Sessão expira em" value={remaining} />
      </Card>
    </Box>
  );
};

export default ProfileSection;

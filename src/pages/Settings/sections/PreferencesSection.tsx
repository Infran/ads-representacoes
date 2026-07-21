import { FC } from "react";
import {
  Box,
  Typography,
  Divider,
  Switch,
  Select,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Card } from "../../../ui";
import {
  usePreferences,
  LANDING_OPTIONS,
} from "../../../context/PreferencesContext";
import SettingRow from "../SettingRow";

const SectionCaption: FC<{ children: string }> = ({ children }) => (
  <Typography
    sx={{
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: ".4px",
      textTransform: "uppercase",
      color: "text.secondary",
      mb: 0.5,
    }}
  >
    {children}
  </Typography>
);

const PreferencesSection: FC = () => {
  const { preferences, setPreference } = usePreferences();

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Card>
        <SectionCaption>Aparência</SectionCaption>

        <SettingRow
          htmlFor="pref-colorMode"
          label="Modo escuro"
          description="Alterna o tema entre claro e escuro."
          control={
            <Switch
              id="pref-colorMode"
              checked={preferences.colorMode === "dark"}
              onChange={(e) =>
                setPreference("colorMode", e.target.checked ? "dark" : "light")
              }
            />
          }
        />
        <Divider />
        <SettingRow
          label="Densidade das tabelas"
          description="Espaçamento das linhas em listas e tabelas."
          control={
            <ToggleButtonGroup
              exclusive
              size="small"
              value={preferences.density}
              onChange={(_, v) => v !== null && setPreference("density", v)}
              aria-label="Densidade das tabelas"
            >
              <ToggleButton value="comfortable">Confortável</ToggleButton>
              <ToggleButton value="compact">Compacta</ToggleButton>
            </ToggleButtonGroup>
          }
        />
      </Card>

      <Card>
        <SectionCaption>Comportamento</SectionCaption>

        <SettingRow
          label="Página inicial"
          description="Para onde ir logo após entrar no sistema."
          control={
            <Select
              size="small"
              value={preferences.defaultLanding}
              onChange={(e) => setPreference("defaultLanding", e.target.value)}
              sx={{ minWidth: 180 }}
              aria-label="Página inicial"
            >
              {LANDING_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Select>
          }
        />
        <Divider />
        <SettingRow
          htmlFor="pref-rememberSidebar"
          label="Lembrar o menu lateral"
          description="Reabre o menu no mesmo estado da última vez."
          control={
            <Switch
              id="pref-rememberSidebar"
              checked={preferences.rememberSidebar}
              onChange={(e) =>
                setPreference("rememberSidebar", e.target.checked)
              }
            />
          }
        />
        <Divider />
        <SettingRow
          htmlFor="pref-successToasts"
          label="Avisos de sucesso"
          description="Mostrar as notificações verdes de confirmação."
          control={
            <Switch
              id="pref-successToasts"
              checked={preferences.successToasts}
              onChange={(e) => setPreference("successToasts", e.target.checked)}
            />
          }
        />
      </Card>
    </Box>
  );
};

export default PreferencesSection;

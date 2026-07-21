import { FC } from "react";
import {
  Box,
  Typography,
  Divider,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { Card, Button, confirmDialog, notifySuccess } from "../../../ui";
import {
  usePreferences,
  FONT_SCALE_STEPS,
  Preferences,
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

const AccessibilitySection: FC = () => {
  const { preferences, setPreference, resetPreferences } = usePreferences();

  // Switch atrelado a uma preferência booleana + linha com rótulo/descrição.
  const boolRow = (
    key: keyof Preferences,
    label: string,
    description: string
  ) => {
    const id = `pref-${key}`;
    return (
      <SettingRow
        htmlFor={id}
        label={label}
        description={description}
        control={
          <Switch
            id={id}
            checked={Boolean(preferences[key])}
            onChange={(e) => setPreference(key, e.target.checked)}
          />
        }
      />
    );
  };

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: "Restaurar padrões?",
      text: "Todas as preferências (acessibilidade, uso e cor do avatar) voltarão ao padrão.",
      confirmText: "Restaurar",
      cancelText: "Cancelar",
      icon: "warning",
    });
    if (!ok) return;
    resetPreferences();
    await notifySuccess("Preferências restauradas");
  };

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Card>
        <SectionCaption>Leitura</SectionCaption>

        <SettingRow
          label="Tamanho do texto"
          description="Aumenta o texto de todo o sistema."
          control={
            <ToggleButtonGroup
              exclusive
              size="small"
              value={preferences.fontScale}
              onChange={(_, v) => v !== null && setPreference("fontScale", v)}
              aria-label="Tamanho do texto"
            >
              {FONT_SCALE_STEPS.map((step) => (
                <ToggleButton key={step} value={step} sx={{ px: 1.5 }}>
                  {Math.round(step * 100)}%
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          }
        />
        {/* Prévia ao vivo: escala em rem para acompanhar o tamanho da raiz. */}
        <Box
          sx={{
            mt: 0.5,
            mb: 1,
            p: 1.5,
            borderRadius: 2,
            bgcolor: "background.default",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body1">
            Prévia: o texto do sistema fica deste tamanho.
          </Typography>
        </Box>

        <Divider />
        {boolRow(
          "legibleFont",
          "Fonte de leitura fácil",
          "Troca a fonte por uma de sistema, mais legível."
        )}
        <Divider />
        {boolRow(
          "increasedSpacing",
          "Espaçamento aumentado",
          "Mais espaço entre linhas e letras."
        )}
        <Divider />
        {boolRow("boldText", "Texto em negrito", "Deixa o texto mais encorpado.")}
      </Card>

      <Card>
        <SectionCaption>Cor e movimento</SectionCaption>

        <SettingRow
          htmlFor="pref-contrast"
          label="Alto contraste"
          description="Reforça o contraste entre texto e fundo (claro e escuro)."
          control={
            <Switch
              id="pref-contrast"
              checked={preferences.contrast === "high"}
              onChange={(e) =>
                setPreference("contrast", e.target.checked ? "high" : "normal")
              }
            />
          }
        />
        <Divider />
        {boolRow(
          "reduceMotion",
          "Reduzir movimento",
          "Desliga animações e transições."
        )}
        <Divider />
        {boolRow(
          "enhancedFocus",
          "Foco reforçado",
          "Realça o item selecionado ao navegar pelo teclado."
        )}
      </Card>

      <Card>
        <SectionCaption>Libras</SectionCaption>
        {boolRow(
          "libras",
          "Tradução em Libras (VLibras)",
          "Ativa o avatar oficial do governo. O recurso é baixado apenas quando ligado."
        )}
      </Card>

      <Box>
        <Button variant="outlined" onClick={handleReset}>
          Restaurar padrões
        </Button>
      </Box>
    </Box>
  );
};

export default AccessibilitySection;

import { FC, useState, ReactNode } from "react";
import { Box, Tabs, Tab } from "@mui/material";
import {
  Settings as SettingsIcon,
  Accessibility,
  Tune,
  Person,
} from "@mui/icons-material";
import { useLocation } from "react-router-dom";
import PageHeader from "../../components/PageHeader/PageHeader";
import AccessibilitySection from "./sections/AccessibilitySection";
import PreferencesSection from "./sections/PreferencesSection";
import ProfileSection from "./sections/ProfileSection";

const TABS = [
  { label: "Acessibilidade", icon: <Accessibility /> },
  { label: "Preferências", icon: <Tune /> },
  { label: "Meu Perfil", icon: <Person /> },
] as const;

const TabPanel: FC<{ value: number; index: number; children: ReactNode }> = ({
  value,
  index,
  children,
}) => (
  <Box
    role="tabpanel"
    hidden={value !== index}
    id={`config-tabpanel-${index}`}
    aria-labelledby={`config-tab-${index}`}
    sx={{ mt: 2 }}
  >
    {value === index && children}
  </Box>
);

const SettingsPage: FC = () => {
  // Deep-link: "Meu Perfil" no menu do usuário navega para /Configuracoes#perfil.
  const { hash } = useLocation();
  const initialTab = hash === "#perfil" ? 2 : 0;
  const [tab, setTab] = useState(initialTab);

  return (
    <Box display="flex" flexDirection="column" gap={2} flex={1}>
      <PageHeader
        title="Configurações"
        description="Acessibilidade, preferências de uso e dados da sua conta."
        icon={SettingsIcon}
      />

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Seções de configurações"
      >
        {TABS.map((t, i) => (
          <Tab
            key={t.label}
            label={t.label}
            icon={t.icon}
            iconPosition="start"
            id={`config-tab-${i}`}
            aria-controls={`config-tabpanel-${i}`}
            sx={{ minHeight: 48, textTransform: "none" }}
          />
        ))}
      </Tabs>

      <TabPanel value={tab} index={0}>
        <AccessibilitySection />
      </TabPanel>
      <TabPanel value={tab} index={1}>
        <PreferencesSection />
      </TabPanel>
      <TabPanel value={tab} index={2}>
        <ProfileSection />
      </TabPanel>
    </Box>
  );
};

export default SettingsPage;

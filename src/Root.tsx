import { useEffect, useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'
import { AuthProvider } from './context/ContextAuth.tsx'
import { getTheme } from './theme'
import { ColorModeContext, ColorMode } from './theme/ColorModeContext'
import { FeedbackProvider, ErrorBoundary } from './ui'
import { installGlobalErrorHandlers } from './utils/errorReporter'


const COLOR_MODE_KEY = 'ads_color_mode'

// Modo inicial: preferência salva (U3.2) → senão light por padrão (sem prefers-color-scheme).
const getInitialMode = (): ColorMode => {
  const saved = localStorage.getItem(COLOR_MODE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return 'light'
}

// Root provê o tema (tokens + Light/Dark) + baseline + o contexto de modo de
// cor para todo o app (UI U1.1). O toggle no header (U3.2) persiste a escolha.
export default function Root() {
  const [mode, setMode] = useState<ColorMode>(getInitialMode)
  const theme = useMemo(() => getTheme(mode), [mode])

  // Handlers globais (window.onerror / unhandledrejection) + gancho do
  // notifyError. Idempotente, então o double-mount do StrictMode é inofensivo.
  useEffect(() => {
    installGlobalErrorHandlers()
  }, [])
  const colorMode = useMemo(
    () => ({
      mode,
      toggle: () =>
        setMode((m) => {
          const next = m === 'light' ? 'dark' : 'light'
          localStorage.setItem(COLOR_MODE_KEY, next)
          return next
        }),
    }),
    [mode]
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <FeedbackProvider>
          {/*
            Rede de segurança final. Fica DENTRO do ThemeProvider para o
            fallback sair tematizado, e FORA do AuthProvider para também pegar
            um crash na resolução de sessão/papel.
          */}
          <ErrorBoundary message="O aplicativo encontrou um erro inesperado. O problema foi registrado.">
            <AuthProvider>
              <App />
            </AuthProvider>
          </ErrorBoundary>
        </FeedbackProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

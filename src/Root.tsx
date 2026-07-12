import { useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'
import { AuthProvider } from './context/ContextAuth.tsx'
import { getTheme } from './theme'
import { ColorModeContext, ColorMode } from './theme/ColorModeContext'
import { FeedbackProvider } from './ui'


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
          <AuthProvider>
            <App />
          </AuthProvider>
        </FeedbackProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

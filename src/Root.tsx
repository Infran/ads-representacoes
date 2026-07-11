import { useMemo, useState } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import App from './App.tsx'
import { AuthProvider } from './context/ContextAuth.tsx'
import { getTheme } from './theme'
import { ColorModeContext, ColorMode } from './theme/ColorModeContext'

// Root provê o tema (tokens + Light/Dark) + baseline + o contexto de modo de
// cor para todo o app (UI U1.1). Modo inicial segue o prefers-color-scheme.
export default function Root() {
  const preferred: ColorMode = window.matchMedia?.(
    '(prefers-color-scheme: dark)'
  ).matches
    ? 'dark'
    : 'light'
  const [mode, setMode] = useState<ColorMode>(preferred)
  const theme = useMemo(() => getTheme(mode), [mode])
  const colorMode = useMemo(
    () => ({
      mode,
      toggle: () => setMode((m) => (m === 'light' ? 'dark' : 'light')),
    }),
    [mode]
  )

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  )
}

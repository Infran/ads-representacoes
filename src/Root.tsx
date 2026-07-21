import { useEffect } from 'react'
import App from './App.tsx'
import { AuthProvider } from './context/ContextAuth.tsx'
import { PreferencesProvider } from './context/PreferencesProvider.tsx'
import { FeedbackProvider, ErrorBoundary } from './ui'
import { installGlobalErrorHandlers } from './utils/errorReporter'

// Root provê preferências (tema Light/Dark + acessibilidade) via
// PreferencesProvider, que por dentro monta o ThemeProvider + CssBaseline e
// mantém o ColorModeContext (toggle do header) por compatibilidade.
export default function Root() {
  // Handlers globais (window.onerror / unhandledrejection) + gancho do
  // notifyError. Idempotente, então o double-mount do StrictMode é inofensivo.
  useEffect(() => {
    installGlobalErrorHandlers()
  }, [])

  return (
    <PreferencesProvider>
      <FeedbackProvider>
        {/*
          Rede de segurança final. Fica DENTRO do tema (via PreferencesProvider)
          para o fallback sair tematizado, e FORA do AuthProvider para também
          pegar um crash na resolução de sessão/papel.
        */}
        <ErrorBoundary message="O aplicativo encontrou um erro inesperado. O problema foi registrado.">
          <AuthProvider>
            <App />
          </AuthProvider>
        </ErrorBoundary>
      </FeedbackProvider>
    </PreferencesProvider>
  )
}

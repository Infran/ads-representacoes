import AppRouter from "./Router"
import { AuthProvider } from "./context/ContextAuth"

function App() {
  return (<AuthProvider><AppRouter /></AuthProvider>)
}

export default App

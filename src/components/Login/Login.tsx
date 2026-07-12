import { useState } from "react";
import { useAuth } from "../../context/ContextAuth";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Alert,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { logger } from "../../utils/logger";

// Traduz o código de erro do Firebase Auth para uma mensagem pt-BR ao usuário.
const getLoginErrorMessage = (code?: string): string => {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/invalid-email":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "E-mail ou senha inválidos.";
    case "auth/user-disabled":
      return "Esta conta foi desativada.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Tente novamente mais tarde.";
    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";
    default:
      return "Não foi possível entrar. Tente novamente.";
  }
};

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(event.target.value);
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);

  const submitLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return; // evita duplo submit
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/Home");
    } catch (error) {
      const code = (error as { code?: string })?.code;
      logger.error("Erro ao fazer login:", code);
      setError(getLoginErrorMessage(code));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container
      maxWidth={false}
      sx={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(to right, #333358, #3b3b79)", // Gradiente de fundo
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 400,
          boxShadow: 6,
          borderRadius: 4,
          overflow: "hidden",
          backgroundColor: "#2d2e45", // Fundo do Card
        }}
      >
        <CardContent
          sx={{
            padding: 4,
            background: "#f7f6f9", // Fundo do conteúdo
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              mb: 2,
            }}
          >
            <img
              src="/logo.png"
              alt="ADS Representações"
              style={{
                maxWidth: 200,
                height: "auto",
              }}
            />
          </Box>

          <Box
            component="form"
            onSubmit={submitLogin}
            noValidate
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              id="email"
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={handleEmailChange}
              InputLabelProps={{ style: { color: "#494748" } }}
            />
            <TextField
              id="password"
              label="Senha"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={handlePasswordChange}
              InputLabelProps={{ style: { color: "#494748" } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              sx={{
                padding: 1.5,
                fontSize: "1rem",
                fontWeight: "bold",
                backgroundColor: "#3b3b79",
                "&:hover": {
                  backgroundColor: "#333358",
                },
              }}
            >
              {submitting ? "Entrando..." : "Entrar"}
            </Button>
          </Box>
        </CardContent>
        <Box
          sx={{
            background: "linear-gradient(to right, #333358, #3b3b79)",
            padding: 2,
            textAlign: "center",
            color: "#f7f6f9",
          }}
        >
          <Typography variant="body2">© 2026 ADS Representações</Typography>
        </Box>
      </Card>
    </Container>
  );
};

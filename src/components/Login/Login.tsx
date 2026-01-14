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
} from "@mui/material";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  const submitLogin = async (event) => {
    event.preventDefault();
    try {
      await login(email, password);
      navigate("/Home");
    } catch (error) {
      console.error("Erro ao fazer login:", error);
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
              Entrar
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

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
import { Navigate, useNavigate } from "react-router-dom";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, logout } = useAuth();
  const navigate = useNavigate();

  const handleEmailChange = (event) => setEmail(event.target.value);
  const handlePasswordChange = (event) => setPassword(event.target.value);

  const submitLogin = async (event) => {
    event.preventDefault();
    
    try {
      await login(email, password); // Espera o login finalizar
      navigate("/Home"); // Redireciona após o login ser concluído
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      // Exibir mensagem de erro para o usuário, se necessário
    }
  };
  

  return (
    <Container maxWidth="sm">
      <Box mt={8} display="flex" justifyContent="center" alignItems="center">
        <Card sx={{ width: "100%", boxShadow: 3 }}>
          <CardContent>
            <Typography
              variant="h4"
              gutterBottom
              align="center"
              color="primary"
            >
              ADS REPRESENTAÇÕES
            </Typography>
            <Box component="form" onSubmit={submitLogin}>
              <Box mb={2}>
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  variant="outlined"
                  fullWidth
                  value={email}
                  onChange={handleEmailChange}
                />
              </Box>
              <Box mb={2}>
                <TextField
                  id="password"
                  label="Senha"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={handlePasswordChange}
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Login
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

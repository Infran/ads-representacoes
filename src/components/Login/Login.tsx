import { useState } from "react";
import { useAuth } from "../../context/ContextAuth";
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
} from "@mui/material";
import {
  EmailOutlined,
  LockOutlined,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { logger } from "../../utils/logger";
import { notifyWarning } from "../../ui/Feedback";
import { useTheme } from "@mui/material/styles";

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
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setEmail(event.target.value);
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) =>
    setPassword(event.target.value);

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleForgotPassword = () => {
    notifyWarning(
      "Recuperação de Senha",
      "Para redefinir sua senha, entre em contato com o administrador do sistema ou envie um e-mail para o suporte comercial."
    );
  };

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
    <Box
      sx={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "row",
        backgroundColor: theme.palette.background.paper,
        overflow: "hidden",
      }}
    >
      {/* Painel Esquerdo - Branding & Visual (oculto em telas menores) */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          width: "50%",
          background: "url('/login_branding_bg.png') no-repeat center center / cover",
          p: { md: 6, lg: 8 },
          position: "relative",
          overflow: "hidden",
        }}
      >

        {/* Círculos Geométricos Abstratos com linhas finas sobrepostas (mais aparentes) */}
        <Box
          sx={{
            position: "absolute",
            bottom: "-5%",
            left: "-5%",
            width: 450,
            height: 450,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.18)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-15%",
            left: "-15%",
            width: 650,
            height: 650,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.10)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: "-25%",
            left: "-25%",
            width: 850,
            height: 850,
            borderRadius: "50%",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            pointerEvents: "none",
          }}
        />

        {/* Logo clean em branco */}
        <Box
          component="img"
          src="/logo_clean.png"
          alt="ADS"
          sx={{
            height: 50,
            width: "auto",
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
            alignSelf: "flex-start",
            opacity: 0.9,
          }}
        />

        {/* Conteúdo Institucional */}
        <Box sx={{ zIndex: 1, my: "auto" }}>
          <Typography
            variant="h3"
            sx={{
              color: "#ffffff",
              fontWeight: 700,
              mb: 2,
              letterSpacing: "-0.5px",
              lineHeight: 1.2,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            ADS Representações
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(255, 255, 255, 0.8)",
              fontSize: "1.1rem",
              fontWeight: 300,
              lineHeight: 1.6,
              maxWidth: 400,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            A plataforma inteligente para gestão de orçamentos e representação comercial.
          </Typography>
        </Box>

        {/* Botão de ação secundário */}
        <Button
          variant="outlined"
          onClick={() => window.open("https://ads-webpage.vercel.app/", "_blank")}
          sx={{
            alignSelf: "flex-start",
            color: "#ffffff",
            borderColor: "rgba(255, 255, 255, 0.3)",
            borderRadius: "50px",
            px: 4,
            py: 1.2,
            textTransform: "none",
            fontWeight: 500,
            zIndex: 1,
            transition: "all 0.2s ease",
            "&:hover": {
              borderColor: "#ffffff",
              backgroundColor: "rgba(255, 255, 255, 0.15)",
              transform: "translateY(-1px)",
            },
          }}
        >
          Acessar Site
        </Button>
      </Box>

      {/* Painel Direito - Formulário de Login */}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: { xs: "100%", md: "50%" },
          p: { xs: 4, sm: 8, md: 10, lg: 12 },
          backgroundColor: theme.palette.background.paper,
        }}
      >
        {/* Logo pequena para mobile (quando a coluna da esquerda está oculta) */}
        <Box
          sx={{
            display: { xs: "block", md: "none" },
            textAlign: "center",
            mb: 4,
          }}
        >
          <Box
            component="img"
            src="/logo_clean.png"
            alt="ADS"
            sx={{
              height: 48,
              width: "auto",
              objectFit: "contain",
            }}
          />
        </Box>

        <Box sx={{ mb: 5, maxWidth: 450, mx: "auto", width: "100%" }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1.5,
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            Olá Novamente!
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: theme.palette.text.secondary, fontFamily: "'Poppins', sans-serif" }}
          >
            Seja bem-vindo de volta!
          </Typography>
        </Box>

        {error && (
          <Box sx={{ maxWidth: 450, mx: "auto", width: "100%", mb: 3 }}>
            <Alert
              severity="error"
              sx={{ borderRadius: "12px", alignItems: "center" }}
            >
              {error}
            </Alert>
          </Box>
        )}

        <Box
          component="form"
          onSubmit={submitLogin}
          noValidate
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 3,
            maxWidth: 450,
            mx: "auto",
            width: "100%",
          }}
        >
          <TextField
            id="email"
            label="Endereço de E-mail"
            type="email"
            variant="outlined"
            fullWidth
            value={email}
            onChange={handleEmailChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailOutlined sx={{ color: "text.secondary", mr: 0.5 }} />
                </InputAdornment>
              ),
              sx: {
                borderRadius: "50px",
                transition: "all 0.2s ease-in-out",
                "& fieldset": {
                  borderColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.15)",
                },
                "&.Mui-focused": {
                  boxShadow: theme.palette.mode === "light" ? "0 0 0 4px rgba(29, 99, 196, 0.12)" : "0 0 0 4px rgba(76, 138, 224, 0.2)",
                  "& fieldset": {
                    borderColor: theme.palette.primary.main,
                    borderWidth: "1.5px",
                  },
                },
                "& input": {
                  paddingY: 1.8,
                  "&:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset`,
                    WebkitTextFillColor: theme.palette.text.primary,
                  },
                },
              },
            }}
          />

          <TextField
            id="password"
            label="Senha"
            type={showPassword ? "text" : "password"}
            variant="outlined"
            fullWidth
            value={password}
            onChange={handlePasswordChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockOutlined sx={{ color: "text.secondary", mr: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="alternar visibilidade da senha"
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: "50px",
                transition: "all 0.2s ease-in-out",
                "& fieldset": {
                  borderColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.15)",
                },
                "&.Mui-focused": {
                  boxShadow: theme.palette.mode === "light" ? "0 0 0 4px rgba(29, 99, 196, 0.12)" : "0 0 0 4px rgba(76, 138, 224, 0.2)",
                  "& fieldset": {
                    borderColor: theme.palette.primary.main,
                    borderWidth: "1.5px",
                  },
                },
                "& input": {
                  paddingY: 1.8,
                  "&:-webkit-autofill": {
                    WebkitBoxShadow: `0 0 0 100px ${theme.palette.background.paper} inset`,
                    WebkitTextFillColor: theme.palette.text.primary,
                  },
                },
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              paddingY: 1.8,
              fontSize: "1rem",
              fontWeight: 600,
              borderRadius: "50px",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
              textTransform: "none",
              boxShadow: "0 4px 14px rgba(29, 99, 196, 0.3)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)`,
                boxShadow: "0 6px 20px rgba(29, 99, 196, 0.45)",
                transform: "translateY(-1px)",
              },
              "&:active": {
                transform: "translateY(1px)",
              },
            }}
          >
            {submitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              "Entrar"
            )}
          </Button>
        </Box>

        <Box sx={{ mt: 4, textAlign: "center", maxWidth: 450, mx: "auto", width: "100%" }}>
          <Typography
            variant="body2"
            onClick={handleForgotPassword}
            sx={{
              color: theme.palette.primary.main,
              cursor: "pointer",
              fontWeight: 500,
              display: "inline-block",
              position: "relative",
              fontFamily: "'Poppins', sans-serif",
              "&::after": {
                content: '""',
                position: "absolute",
                width: "100%",
                transform: "scaleX(0)",
                height: "1.5px",
                bottom: -2,
                left: 0,
                backgroundColor: theme.palette.primary.main,
                transformOrigin: "bottom left",
                transition: "transform 0.25s ease-out",
              },
              "&:hover::after": {
                transform: "scaleX(1)",
              },
            }}
          >
            Esqueceu a senha?
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

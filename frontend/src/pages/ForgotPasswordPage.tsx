import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useState } from "react";
import { Link as RouterLink, Navigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";
import { useAuth } from "../contexts/AuthContext";

export default function ForgotPasswordPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(email, password);
      setMessage("Senha redefinida com sucesso. Você já pode entrar.");
      setPassword("");
      setConfirm("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao redefinir senha");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Redefinir senha"
      footer={
        <>
          Lembrou a senha?{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            Voltar ao login
          </Link>
        </>
      }
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <Typography variant="body2" color="text.secondary">
          Informe o e-mail da conta e a nova senha. Use apenas se você tiver acesso a este e-mail.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        <TextField
          type="email"
          label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
        />
        <TextField
          type="password"
          label="Nova senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ minLength: 6 }}
          required
          fullWidth
        />
        <TextField
          type="password"
          label="Confirmar nova senha"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          inputProps={{ minLength: 6 }}
          required
          fullWidth
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
          {loading ? "Salvando..." : "Redefinir senha"}
        </Button>
      </Stack>
    </AuthLayout>
  );
}

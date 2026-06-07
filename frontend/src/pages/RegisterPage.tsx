import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { FormEvent, useState } from "react";
import { Link as RouterLink, Navigate, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import { ApiError } from "../api/client";
import { useAuth } from "../contexts/AuthContext";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(email, password, name);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Falha no cadastro");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Cadastro"
      footer={
        <>
          Já tem conta?{" "}
          <Link component={RouterLink} to="/login" underline="hover">
            Entrar
          </Link>
        </>
      }
    >
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonOutlineIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          type="email"
          label="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <MailOutlineIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          type="password"
          label="Senha (mín. 6 caracteres)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          inputProps={{ minLength: 6 }}
          required
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LockOutlinedIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button type="submit" variant="contained" fullWidth disabled={loading} size="large">
          {loading ? "Cadastrando..." : "Cadastrar"}
        </Button>
      </Stack>
    </AuthLayout>
  );
}

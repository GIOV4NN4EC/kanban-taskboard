import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import PageLayout from "../components/PageLayout";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

const MAX_PHOTO_BYTES = 512 * 1024;

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState(user?.name ?? "");
  const [description, setDescription] = useState(user?.description ?? "");
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photo_url ?? null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setDescription(user.description ?? "");
    setPhotoUrl(user.photo_url ?? null);
  }, [user]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    if (!file.type.startsWith("image/")) {
      setError("Selecione um arquivo de imagem.");
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setError("A imagem deve ter no máximo 512 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhotoUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await authApi.updateMe({ name, description: description.trim() || null, photo_url: photoUrl });
      await refreshUser();
      showToast("Perfil atualizado com sucesso");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao atualizar";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    if (newPassword !== confirmPassword) {
      setPasswordError("As senhas não coincidem.");
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      showToast("Senha alterada com sucesso");
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : "Erro ao alterar senha");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await authApi.deleteMe();
      logout();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Erro ao excluir conta", "error");
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  if (!user) return null;

  return (
    <PageLayout>
      <AppHeader
        breadcrumbs={[{ label: "Projetos", to: "/" }, { label: "Meu perfil" }]}
        title="Meu perfil"
        user={{ name: user.name, photoUrl: user.photo_url }}
        showLogout
        onLogout={logout}
      />

      <Stack spacing={3} maxWidth={560}>
        <Card component="form" onSubmit={handleSubmit} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Avatar src={photoUrl ?? undefined} sx={{ width: 88, height: 88, fontSize: "2rem" }}>
              {name.charAt(0).toUpperCase() || "?"}
            </Avatar>
            <Stack spacing={1}>
              <Button variant="contained" component="label" size="small">
                Escolher foto
                <input type="file" accept="image/*" onChange={handlePhotoChange} hidden />
              </Button>
              {photoUrl && (
                <Button variant="outlined" size="small" onClick={() => setPhotoUrl(null)}>
                  Remover foto
                </Button>
              )}
            </Stack>
          </Stack>

          <Stack spacing={2}>
            <TextField label="E-mail" value={user.email} disabled fullWidth />
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
            <TextField
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte um pouco sobre você..."
              multiline
              rows={4}
              inputProps={{ maxLength: 1000 }}
              fullWidth
            />
            {error && <Alert severity="error">{error}</Alert>}
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </Stack>
        </Card>

        <Card component="form" onSubmit={handlePasswordChange} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Alterar senha
          </Typography>
          <Stack spacing={2}>
            <TextField type="password" label="Senha atual" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required fullWidth />
            <TextField type="password" label="Nova senha" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} inputProps={{ minLength: 6 }} required fullWidth />
            <TextField type="password" label="Confirmar nova senha" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} inputProps={{ minLength: 6 }} required fullWidth />
            {passwordError && <Alert severity="error">{passwordError}</Alert>}
            <Button type="submit" variant="contained" disabled={changingPassword}>
              {changingPassword ? "Atualizando..." : "Atualizar senha"}
            </Button>
          </Stack>
        </Card>

        <Card sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom fontWeight={600}>
            Excluir conta
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Remove sua conta de forma permanente. Você não poderá mais entrar com este e-mail.
          </Typography>
          <Button variant="contained" color="error" onClick={() => setShowDeleteConfirm(true)}>
            Excluir minha conta
          </Button>
        </Card>
      </Stack>

      <ConfirmDialog
        open={showDeleteConfirm}
        title="Excluir conta"
        message="Excluir sua conta permanentemente? Esta ação não pode ser desfeita."
        confirmLabel="Excluir conta"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </PageLayout>
  );
}

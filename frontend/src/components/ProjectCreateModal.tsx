import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { FormEvent, useEffect, useState } from "react";

interface ProjectCreateModalProps {
  open: boolean;
  loading?: boolean;
  error?: string;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; dueDate: string }) => Promise<void>;
}

const empty = { name: "", description: "", dueDate: "" };

export default function ProjectCreateModal({
  open,
  loading = false,
  error,
  onClose,
  onSubmit,
}: ProjectCreateModalProps) {
  const [values, setValues] = useState(empty);

  useEffect(() => {
    if (open) setValues(empty);
  }, [open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Novo projeto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField
              label="Nome do projeto"
              value={values.name}
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Descrição (opcional)"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              multiline
              rows={2}
              fullWidth
            />
            <TextField
              type="date"
              label="Prazo (opcional)"
              value={values.dueDate}
              onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Criando..." : "Criar projeto"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

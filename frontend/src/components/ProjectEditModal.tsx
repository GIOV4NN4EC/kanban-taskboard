import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { FormEvent, useEffect, useState } from "react";
import type { Project } from "../types";

interface ProjectEditModalProps {
  project: Project;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; description: string; dueDate: string }) => Promise<void>;
}

export default function ProjectEditModal({
  project,
  loading = false,
  open,
  onClose,
  onSubmit,
}: ProjectEditModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [dueDate, setDueDate] = useState(project.due_date ?? "");

  useEffect(() => {
    setName(project.name);
    setDescription(project.description ?? "");
    setDueDate(project.due_date ?? "");
  }, [project]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit({ name, description, dueDate });
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Editar projeto</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Nome" value={name} onChange={(e) => setName(e.target.value)} required fullWidth autoFocus />
            <TextField
              label="Descrição"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              type="date"
              label="Prazo do projeto"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
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
            {loading ? "Salvando..." : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

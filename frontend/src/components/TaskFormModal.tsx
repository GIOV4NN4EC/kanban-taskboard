import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import { FormEvent, useEffect, useState } from "react";
import type { ProjectMember, Task, TaskPriority, User } from "../types";

export interface TaskFormValues {
  title: string;
  description: string;
  priority: TaskPriority;
  assigneeId: string;
  dueDate: string;
}

interface TaskFormModalProps {
  mode: "create" | "edit";
  task?: Task;
  members: ProjectMember[];
  userNames: Record<string, User>;
  loading?: boolean;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: TaskFormValues) => Promise<void>;
}

const emptyForm: TaskFormValues = {
  title: "",
  description: "",
  priority: "MEDIUM",
  assigneeId: "",
  dueDate: "",
};

export default function TaskFormModal({
  mode,
  task,
  members,
  userNames,
  loading = false,
  open,
  onClose,
  onSubmit,
}: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(emptyForm);

  useEffect(() => {
    if (mode === "edit" && task) {
      setValues({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        assigneeId: task.assignee_id ?? "",
        dueDate: task.due_date ?? "",
      });
    } else {
      setValues(emptyForm);
    }
  }, [mode, task, open]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(values);
  };

  const memberLabel = (userId: string) => {
    const user = userNames[userId];
    if (user) return `${user.name} (${user.email})`;
    return userId.slice(0, 8) + "…";
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{mode === "create" ? "Nova tarefa" : "Editar tarefa"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Título"
              placeholder="Título da tarefa"
              value={values.title}
              onChange={(e) => setValues((v) => ({ ...v, title: e.target.value }))}
              required
              fullWidth
              autoFocus
            />
            <TextField
              label="Observações"
              placeholder="Anotações, detalhes, links, critérios de aceite..."
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              multiline
              rows={4}
              fullWidth
            />
            <TextField
              select
              label="Prioridade"
              value={values.priority}
              onChange={(e) => setValues((v) => ({ ...v, priority: e.target.value as TaskPriority }))}
              fullWidth
            >
              <MenuItem value="LOW">Baixa</MenuItem>
              <MenuItem value="MEDIUM">Média</MenuItem>
              <MenuItem value="HIGH">Alta</MenuItem>
            </TextField>
            <TextField
              type="date"
              label="Data limite"
              value={values.dueDate}
              onChange={(e) => setValues((v) => ({ ...v, dueDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              select
              label="Responsável"
              value={values.assigneeId}
              onChange={(e) => setValues((v) => ({ ...v, assigneeId: e.target.value }))}
              fullWidth
            >
              <MenuItem value="">Não atribuída</MenuItem>
              {members.map((m) => (
                <MenuItem key={m.user_id} value={m.user_id}>
                  {memberLabel(m.user_id)}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Salvando..." : mode === "create" ? "Criar" : "Salvar"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

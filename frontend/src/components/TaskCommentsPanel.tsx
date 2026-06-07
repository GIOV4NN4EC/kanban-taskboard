import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/client";
import * as commentsApi from "../api/comments";
import ConfirmDialog from "./ConfirmDialog";
import type { ProjectMember, Task, TaskComment, User } from "../types";

const MENTION_PATTERN = /@\[([^\]]+)\]\(([0-9a-f-]{36})\)/gi;

function renderCommentBody(body: string, userNames: Record<string, User>) {
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  const regex = new RegExp(MENTION_PATTERN);
  while ((match = regex.exec(body)) !== null) {
    if (match.index > lastIndex) parts.push(body.slice(lastIndex, match.index));
    const userId = match[2];
    const label = userNames[userId]?.name ?? match[1];
    parts.push(
      <Typography key={`${match.index}-${userId}`} component="span" color="primary" fontWeight={500}>
        @{label}
      </Typography>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < body.length) parts.push(body.slice(lastIndex));
  return parts;
}

interface TaskCommentsPanelProps {
  task: Task;
  members: ProjectMember[];
  userNames: Record<string, User>;
  currentUserId: string;
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
}

export default function TaskCommentsPanel({
  task,
  members,
  userNames,
  currentUserId,
  isOwner,
  open,
  onClose,
}: TaskCommentsPanelProps) {
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [body, setBody] = useState("");
  const [mentionUserId, setMentionUserId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      setComments(await commentsApi.listComments(task.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao carregar comentários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) load();
  }, [task.id, open]);

  const insertMention = () => {
    if (!mentionUserId) return;
    const user = userNames[mentionUserId];
    if (!user) return;
    setBody((prev) => `${prev}@[${user.name}](${mentionUserId}) `);
    setMentionUserId("");
    textareaRef.current?.focus();
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setError("");
    try {
      await commentsApi.createComment(task.id, body.trim());
      setBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao comentar");
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editBody.trim()) return;
    setError("");
    try {
      await commentsApi.updateComment(task.id, commentId, editBody.trim());
      setEditingId(null);
      setEditBody("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao editar comentário");
    }
  };

  const handleDelete = async () => {
    if (!deleteCommentId) return;
    setDeleting(true);
    try {
      await commentsApi.deleteComment(task.id, deleteCommentId);
      setDeleteCommentId(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erro ao excluir comentário");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth scroll="paper">
        <DialogTitle>Comentários — {task.title}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          {loading ? (
            <Stack spacing={1}>
              <Skeleton variant="rounded" height={80} />
              <Skeleton variant="rounded" height={80} />
            </Stack>
          ) : (
            <Stack spacing={1.5} sx={{ maxHeight: 320, overflow: "auto", mb: 2 }}>
              {comments.map((comment) => {
                const author = userNames[comment.author_id]?.name ?? "Usuário";
                const canEdit = comment.author_id === currentUserId;
                const canDelete = canEdit || isOwner;
                return (
                  <Paper key={comment.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="subtitle2">{author}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(comment.created_at).toLocaleString("pt-BR")}
                      </Typography>
                    </Stack>
                    {editingId === comment.id ? (
                      <Stack spacing={1}>
                        <TextField multiline rows={3} value={editBody} onChange={(e) => setEditBody(e.target.value)} fullWidth size="small" />
                        <Stack direction="row" spacing={1}>
                          <Button size="small" variant="contained" onClick={() => handleUpdate(comment.id)}>Salvar</Button>
                          <Button size="small" onClick={() => { setEditingId(null); setEditBody(""); }}>Cancelar</Button>
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
                        {renderCommentBody(comment.body, userNames)}
                      </Typography>
                    )}
                    {(canEdit || canDelete) && editingId !== comment.id && (
                      <Stack direction="row" spacing={1} mt={1}>
                        {canEdit && (
                          <Button size="small" onClick={() => { setEditingId(comment.id); setEditBody(comment.body); }}>
                            Editar
                          </Button>
                        )}
                        {canDelete && (
                          <Button size="small" color="error" onClick={() => setDeleteCommentId(comment.id)}>
                            Excluir
                          </Button>
                        )}
                      </Stack>
                    )}
                  </Paper>
                );
              })}
              {comments.length === 0 && (
                <Typography variant="body2" color="text.secondary" align="center" py={2}>
                  Nenhum comentário ainda.
                </Typography>
              )}
            </Stack>
          )}

          <Box component="form" onSubmit={handleCreate}>
            <TextField
              inputRef={textareaRef}
              label="Novo comentário"
              placeholder="Escreva um comentário..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              multiline
              rows={3}
              required
              fullWidth
              size="small"
            />
            <Stack direction="row" spacing={1} mt={1} alignItems="center">
              <TextField
                select
                size="small"
                value={mentionUserId}
                onChange={(e) => setMentionUserId(e.target.value)}
                sx={{ flex: 1 }}
                label="Mencionar"
              >
                <MenuItem value="">Selecionar membro...</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.user_id} value={m.user_id}>
                    {userNames[m.user_id]?.name ?? m.user_id}
                  </MenuItem>
                ))}
              </TextField>
              <Button size="small" variant="outlined" onClick={insertMention} disabled={!mentionUserId}>
                Inserir
              </Button>
            </Stack>
            <DialogActions sx={{ px: 0, pt: 2 }}>
              <Button onClick={onClose}>Fechar</Button>
              <Button type="submit" variant="contained">Comentar</Button>
            </DialogActions>
          </Box>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteCommentId}
        title="Excluir comentário"
        message="Tem certeza que deseja excluir este comentário?"
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteCommentId(null)}
      />
    </>
  );
}

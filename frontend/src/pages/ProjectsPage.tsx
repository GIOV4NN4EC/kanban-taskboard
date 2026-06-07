import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import ViewKanbanOutlinedIcon from "@mui/icons-material/ViewKanbanOutlined";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid2";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import Link from "@mui/material/Link";
import Paper from "@mui/material/Paper";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import AppHeader from "../components/AppHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import PageLayout from "../components/PageLayout";
import ProjectCreateModal from "../components/ProjectCreateModal";
import { ApiError } from "../api/client";
import * as projectsApi from "../api/projects";
import * as tasksApi from "../api/tasks";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import type { Project } from "../types";

interface ProjectTaskStats {
  total: number;
  done: number;
}

function formatProjectDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProjectSkeleton() {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Skeleton width="70%" height={28} />
        <Skeleton width="40%" sx={{ mt: 1 }} />
        <Skeleton width="90%" sx={{ mt: 1.5 }} />
      </CardContent>
      <CardActions sx={{ px: 2, pb: 2 }}>
        <Skeleton width={100} height={32} />
      </CardActions>
    </Card>
  );
}

export default function ProjectsPage() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [projects, setProjects] = useState<Project[]>([]);
  const [taskStats, setTaskStats] = useState<Record<string, ProjectTaskStats>>({});
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadTaskStats = async (projectList: Project[]) => {
    setStatsLoading(true);
    const entries = await Promise.all(
      projectList.map(async (p) => {
        try {
          const tasks = await tasksApi.listTasks(p.id);
          return [p.id, { total: tasks.length, done: tasks.filter((t) => t.status === "DONE").length }] as const;
        } catch {
          return [p.id, { total: 0, done: 0 }] as const;
        }
      })
    );
    setTaskStats(Object.fromEntries(entries));
    setStatsLoading(false);
  };

  const load = async () => {
    setLoading(true);
    try {
      const list = await projectsApi.listProjects();
      setProjects(list);
      await loadTaskStats(list);
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Erro ao carregar projetos", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return projects;
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description?.toLowerCase().includes(q) ?? false)
    );
  }, [projects, search]);

  const handleCreate = async (data: { name: string; description: string; dueDate: string }) => {
    setCreateError("");
    setCreating(true);
    try {
      await projectsApi.createProject(data.name, data.description || undefined, data.dueDate || undefined);
      setCreateOpen(false);
      showToast("Projeto criado com sucesso");
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao criar projeto";
      setCreateError(msg);
      showToast(msg, "error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await projectsApi.deleteProject(deleteId);
      setDeleteId(null);
      showToast("Projeto excluído");
      await load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Erro ao excluir", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PageLayout>
      <AppHeader
        title="Meus projetos"
        subtitle="Organize suas tarefas em quadros Kanban"
        user={user ? { name: user.name, photoUrl: user.photo_url } : undefined}
        showLogout
        onLogout={logout}
      />

      <Paper
        elevation={0}
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 2,
          p: 2,
          mb: 3,
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Buscar projetos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flex: 1, minWidth: 200 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setCreateError(""); setCreateOpen(true); }}>
          Novo projeto
        </Button>
      </Paper>

      {loading ? (
        <Grid container spacing={3}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
              <ProjectSkeleton />
            </Grid>
          ))}
        </Grid>
      ) : projects.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 6 }}>
          <ViewKanbanOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum projeto ainda
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Crie seu primeiro projeto para começar a organizar tarefas.
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
            Novo projeto
          </Button>
        </Card>
      ) : filteredProjects.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 5 }}>
          <Typography variant="body1" color="text.secondary">
            Nenhum projeto encontrado para &quot;{search}&quot;.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {filteredProjects.map((p) => {
            const stats = taskStats[p.id];
            return (
              <Grid key={p.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "box-shadow 0.2s, transform 0.2s",
                    "&:hover": { boxShadow: 6, transform: "translateY(-2px)" },
                  }}
                >
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
                      <Typography variant="h6" component="h3" fontWeight={600} sx={{ lineHeight: 1.3 }}>
                        <Link component={RouterLink} to={`/projects/${p.id}`} underline="hover" color="inherit">
                          {p.name}
                        </Link>
                      </Typography>
                      {statsLoading && !stats ? (
                        <Skeleton width={72} height={24} />
                      ) : (
                        <Chip
                          label={stats ? `${stats.done}/${stats.total} tarefas` : "— tarefas"}
                          size="small"
                          variant="outlined"
                          color={stats && stats.total > 0 && stats.done === stats.total ? "success" : "default"}
                        />
                      )}
                    </Stack>

                    {p.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                          mb: 1.5,
                        }}
                      >
                        {p.description}
                      </Typography>
                    )}

                    {p.due_date && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Prazo: {formatProjectDate(p.due_date)}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1 }}>
                    <Button
                      component={RouterLink}
                      to={`/projects/${p.id}`}
                      variant="contained"
                      size="small"
                      fullWidth
                      sx={{ flex: 1 }}
                    >
                      Abrir quadro
                    </Button>
                    <Tooltip title="Excluir projeto">
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => setDeleteId(p.id)}
                        aria-label={`Excluir projeto ${p.name}`}
                        sx={{ color: "text.secondary", "&:hover": { color: "error.main" } }}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {statsLoading && !loading && <LinearProgress sx={{ mt: 2, borderRadius: 1 }} />}

      <ProjectCreateModal
        open={createOpen}
        loading={creating}
        error={createError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ConfirmDialog
        open={!!deleteId}
        title="Excluir projeto"
        message="Tem certeza que deseja excluir este projeto? Todas as tarefas serão removidas permanentemente."
        confirmLabel="Excluir"
        variant="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </PageLayout>
  );
}

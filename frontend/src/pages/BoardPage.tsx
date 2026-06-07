import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid2";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError } from "../api/client";
import * as authApi from "../api/auth";
import * as activitiesApi from "../api/activities";
import * as projectsApi from "../api/projects";
import * as tasksApi from "../api/tasks";
import AppHeader from "../components/AppHeader";
import ConfirmDialog from "../components/ConfirmDialog";
import PageLayout from "../components/PageLayout";
import ProjectEditModal from "../components/ProjectEditModal";
import TaskCard, { STATUS_LABELS } from "../components/TaskCard";
import TaskCommentsPanel from "../components/TaskCommentsPanel";
import TaskFormModal, { type TaskFormValues } from "../components/TaskFormModal";
import UserAvatar from "../components/UserAvatar";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { COLUMN_COLORS } from "../theme/muiTheme";
import type { Activity, Project, ProjectMember, Task, TaskStatus, User } from "../types";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "TODO", label: STATUS_LABELS.TODO },
  { status: "DOING", label: STATUS_LABELS.DOING },
  { status: "DONE", label: STATUS_LABELS.DONE },
];

type SidebarTab = "members" | "activity";
type ConfirmState =
  | { type: "deleteTask"; taskId: string }
  | { type: "removeMember"; userId: string }
  | null;

function formatDueDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function isTaskOverdue(task: Task) {
  if (!task.due_date || task.status === "DONE") return false;
  const [year, month, day] = task.due_date.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [userNames, setUserNames] = useState<Record<string, User>>({});
  const [activities, setActivities] = useState<Activity[]>([]);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("members");
  const [searchText, setSearchText] = useState("");
  const [filterStatus, setFilterStatus] = useState<TaskStatus | "">("");
  const [filterAssignee, setFilterAssignee] = useState("");
  const [filterDueBefore, setFilterDueBefore] = useState("");
  const [filterOverdue, setFilterOverdue] = useState(false);
  const [error, setError] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [commentsTask, setCommentsTask] = useState<Task | null>(null);
  const [showProjectEdit, setShowProjectEdit] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [savingProject, setSavingProject] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmState>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadUserNames = async (memberList: ProjectMember[]) => {
    const ids = [...new Set(memberList.map((m) => m.user_id))];
    const entries = await Promise.all(
      ids.map(async (id) => {
        try {
          const u = await authApi.getUser(id);
          return [id, u] as const;
        } catch {
          return null;
        }
      })
    );
    const map: Record<string, User> = {};
    for (const entry of entries) {
      if (entry) map[entry[0]] = entry[1];
    }
    setUserNames(map);
  };

  const isOwner = project?.owner_id === user?.id;

  const loadActivities = useCallback(async () => {
    if (!projectId || !isOwner) return;
    try {
      setActivities(await activitiesApi.listActivities(projectId));
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao carregar histórico";
      setError(msg);
      showToast(msg, "error");
    }
  }, [projectId, isOwner, showToast]);

  const load = useCallback(async () => {
    if (!projectId) return;
    try {
      const filters: tasksApi.TaskFilters = {};
      if (searchText.trim()) filters.q = searchText.trim();
      if (filterStatus) filters.status = filterStatus;
      if (filterAssignee) filters.assignee_id = filterAssignee;
      if (filterDueBefore) filters.due_before = filterDueBefore;
      if (filterOverdue) filters.overdue = true;

      const [taskList, memberList, projectData] = await Promise.all([
        tasksApi.listTasks(projectId, filters),
        projectsApi.listMembers(projectId),
        projectsApi.getProject(projectId),
      ]);
      setTasks(taskList);
      setMembers(memberList);
      setProject(projectData);
      await loadUserNames(memberList);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao carregar quadro";
      setError(msg);
      showToast(msg, "error");
    }
  }, [projectId, searchText, filterStatus, filterAssignee, filterDueBefore, filterOverdue, showToast]);

  useEffect(() => {
    setSidebarTab("members");
    setActivities([]);
    setProject(null);
    setSearchText("");
    setFilterStatus("");
    setFilterAssignee("");
    setFilterDueBefore("");
    setFilterOverdue(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (sidebarTab === "activity" && isOwner) loadActivities();
  }, [sidebarTab, isOwner, loadActivities]);

  const tasksByStatus = (status: TaskStatus) => tasks.filter((t) => t.status === status);

  const assigneeInfo = (assigneeId: string | null) => {
    if (!assigneeId) return { name: null, photo: null };
    const u = userNames[assigneeId];
    return u ? { name: u.name, photo: u.photo_url } : { name: `Usuário ${assigneeId.slice(0, 8)}…`, photo: null };
  };

  const clearFilters = () => {
    setSearchText("");
    setFilterStatus("");
    setFilterAssignee("");
    setFilterDueBefore("");
    setFilterOverdue(false);
  };

  const handleCreateTask = async (values: TaskFormValues) => {
    if (!projectId) return;
    setSavingTask(true);
    try {
      await tasksApi.createTask(projectId, {
        title: values.title,
        description: values.description.trim() || undefined,
        priority: values.priority,
        assignee_id: values.assigneeId || undefined,
        due_date: values.dueDate || undefined,
      });
      setModalMode(null);
      showToast("Tarefa criada com sucesso");
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao criar tarefa";
      showToast(msg, "error");
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditTask = async (values: TaskFormValues) => {
    if (!editingTask) return;
    setSavingTask(true);
    try {
      await tasksApi.updateTask(editingTask.id, {
        title: values.title,
        description: values.description.trim() || null,
        priority: values.priority,
        assignee_id: values.assigneeId || null,
        due_date: values.dueDate || null,
      });
      setModalMode(null);
      setEditingTask(null);
      showToast("Tarefa atualizada");
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao salvar tarefa";
      showToast(msg, "error");
    } finally {
      setSavingTask(false);
    }
  };

  const handleEditProject = async (data: { name: string; description: string; dueDate: string }) => {
    if (!projectId) return;
    setSavingProject(true);
    try {
      await projectsApi.updateProject(projectId, {
        name: data.name,
        description: data.description.trim() || null,
        due_date: data.dueDate || null,
      });
      setShowProjectEdit(false);
      showToast("Projeto atualizado");
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro ao editar projeto";
      showToast(msg, "error");
    } finally {
      setSavingProject(false);
    }
  };

  const handleConfirm = async () => {
    if (!confirmState || !projectId) return;
    setConfirmLoading(true);
    try {
      if (confirmState.type === "deleteTask") {
        await tasksApi.deleteTask(confirmState.taskId);
        showToast("Tarefa excluída");
      } else {
        await projectsApi.removeMember(projectId, confirmState.userId);
        showToast("Membro removido");
      }
      setConfirmState(null);
      await load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Erro na operação";
      showToast(msg, "error");
    } finally {
      setConfirmLoading(false);
    }
  };

  const moveTask = async (task: Task, status: TaskStatus) => {
    if (task.status === status) return;
    try {
      await tasksApi.updateTaskStatus(task.id, status);
      showToast(`Tarefa movida para ${STATUS_LABELS[status]}`);
      await load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Erro ao mover tarefa", "error");
    }
  };

  const handleAddMember = async (e: FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    setAddingMember(true);
    try {
      await projectsApi.addMember(projectId, memberEmail);
      setMemberEmail("");
      showToast("Membro adicionado");
      await load();
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : "Erro ao adicionar membro", "error");
    } finally {
      setAddingMember(false);
    }
  };

  if (!projectId) return null;

  return (
    <PageLayout>
      <AppHeader
        breadcrumbs={[{ label: "Projetos", to: "/" }, { label: project?.name ?? "Projeto" }]}
        title={project?.name ?? "Projeto"}
        subtitle={project?.due_date ? `Prazo do projeto: ${formatDueDate(project.due_date)}` : undefined}
        primaryAction={
          <Button variant="contained" onClick={() => setModalMode("create")}>
            Nova tarefa
          </Button>
        }
        actions={
          isOwner ? (
            <Button variant="outlined" size="small" onClick={() => setShowProjectEdit(true)}>
              Editar projeto
            </Button>
          ) : undefined
        }
        user={user ? { name: user.name, photoUrl: user.photo_url } : undefined}
        showLogout
        onLogout={logout}
      />

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Filtros
            </Typography>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField size="small" fullWidth placeholder="Buscar por texto..." value={searchText} onChange={(e) => setSearchText(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField select size="small" fullWidth label="Status" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | "")}>
                  <MenuItem value="">Todos</MenuItem>
                  {COLUMNS.map((c) => (
                    <MenuItem key={c.status} value={c.status}>{c.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField select size="small" fullWidth label="Responsável" value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)}>
                  <MenuItem value="">Todos</MenuItem>
                  {members.map((m) => (
                    <MenuItem key={m.user_id} value={m.user_id}>{userNames[m.user_id]?.name ?? m.user_id}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField type="date" size="small" fullWidth label="Prazo até" value={filterDueBefore} onChange={(e) => setFilterDueBefore(e.target.value)} InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <FormControlLabel
                  control={<Checkbox checked={filterOverdue} onChange={(e) => setFilterOverdue(e.target.checked)} size="small" />}
                  label="Apenas atrasadas"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <Button variant="outlined" size="small" onClick={clearFilters} fullWidth sx={{ height: "100%" }}>
                  Limpar filtros
                </Button>
              </Grid>
            </Grid>
          </Paper>

          <Box sx={{ display: "flex", gap: 2, overflowX: "auto", pb: 1 }}>
            {COLUMNS.map((col) => {
              const colTasks = tasksByStatus(col.status);
              return (
                <Paper
                  key={col.status}
                  sx={{
                    minWidth: { xs: 280, sm: 300 },
                    flex: 1,
                    p: 1.5,
                    bgcolor: "action.hover",
                    borderTop: 3,
                    borderColor: COLUMN_COLORS[col.status],
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <Typography variant="overline" fontWeight={700} color="text.secondary">
                      {col.label}
                    </Typography>
                    <Typography variant="caption" sx={{ bgcolor: "background.paper", px: 1, py: 0.25, borderRadius: 10, fontWeight: 600 }}>
                      {colTasks.length}
                    </Typography>
                  </Stack>
                  {colTasks.length === 0 ? (
                    <Paper variant="outlined" sx={{ p: 3, textAlign: "center", borderStyle: "dashed", bgcolor: "background.paper" }}>
                      <Typography variant="body2" color="text.secondary">Nenhuma tarefa</Typography>
                    </Paper>
                  ) : (
                    colTasks.map((task) => {
                      const assignee = assigneeInfo(task.assignee_id);
                      return (
                        <TaskCard
                          key={task.id}
                          task={task}
                          assigneeName={assignee.name}
                          assigneePhoto={assignee.photo}
                          otherColumns={COLUMNS.filter((c) => c.status !== task.status)}
                          onEdit={(t) => { setEditingTask(t); setModalMode("edit"); }}
                          onMove={moveTask}
                          onDelete={(id) => setConfirmState({ type: "deleteTask", taskId: id })}
                          onComments={setCommentsTask}
                          formatDueDate={formatDueDate}
                          isOverdue={isTaskOverdue(task)}
                        />
                      );
                    })
                  )}
                </Paper>
              );
            })}
          </Box>
        </Grid>

        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper sx={{ position: { lg: "sticky" }, top: 16 }}>
            <Tabs value={sidebarTab} onChange={(_, v) => setSidebarTab(v)} variant="fullWidth">
              <Tab value="members" label={`Membros (${members.length})`} />
              {isOwner && <Tab value="activity" label="Histórico" />}
            </Tabs>
            <Box sx={{ p: 2 }}>
              {sidebarTab === "members" && (
                <>
                  <Stack spacing={1} divider={<Box sx={{ borderBottom: 1, borderColor: "divider" }} />}>
                    {members.map((m) => {
                      const memberUser = userNames[m.user_id];
                      return (
                        <Stack key={m.id} direction="row" alignItems="center" justifyContent="space-between" py={0.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <UserAvatar name={memberUser?.name ?? m.user_id} photoUrl={memberUser?.photo_url} size="sm" />
                            <Box>
                              <Typography variant="body2">{memberUser?.name ?? m.user_id}</Typography>
                              {memberUser && (
                                <Typography variant="caption" color="text.secondary">{memberUser.email}</Typography>
                              )}
                            </Box>
                          </Stack>
                          {isOwner && m.user_id !== project?.owner_id && (
                            <Button size="small" color="inherit" onClick={() => setConfirmState({ type: "removeMember", userId: m.user_id })}>
                              Remover
                            </Button>
                          )}
                        </Stack>
                      );
                    })}
                  </Stack>
                  {isOwner && (
                    <Stack component="form" direction="row" spacing={1} mt={2} onSubmit={handleAddMember}>
                      <TextField
                        type="email"
                        size="small"
                        placeholder="E-mail do membro"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        required
                        fullWidth
                      />
                      <Button type="submit" variant="contained" size="small" disabled={addingMember}>
                        {addingMember ? "..." : "Adicionar"}
                      </Button>
                    </Stack>
                  )}
                </>
              )}
              {sidebarTab === "activity" && isOwner && (
                activities.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" align="center" py={2}>
                    Nenhuma atividade registrada.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {activities.map((a) => (
                      <Paper key={a.id} variant="outlined" sx={{ p: 1.5, borderLeft: 3, borderColor: "primary.main" }}>
                        <Typography variant="body2">
                          <strong>{a.event_type}</strong>: {a.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(a.created_at).toLocaleString("pt-BR")}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                )
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <TaskFormModal
        mode="create"
        members={members}
        userNames={userNames}
        loading={savingTask}
        open={modalMode === "create"}
        onClose={() => setModalMode(null)}
        onSubmit={handleCreateTask}
      />

      <TaskFormModal
        mode="edit"
        task={editingTask ?? undefined}
        members={members}
        userNames={userNames}
        loading={savingTask}
        open={modalMode === "edit" && !!editingTask}
        onClose={() => { setModalMode(null); setEditingTask(null); }}
        onSubmit={handleEditTask}
      />

      {commentsTask && user && (
        <TaskCommentsPanel
          task={commentsTask}
          members={members}
          userNames={userNames}
          currentUserId={user.id}
          isOwner={!!isOwner}
          open={!!commentsTask}
          onClose={() => setCommentsTask(null)}
        />
      )}

      {project && (
        <ProjectEditModal
          project={project}
          loading={savingProject}
          open={showProjectEdit}
          onClose={() => setShowProjectEdit(false)}
          onSubmit={handleEditProject}
        />
      )}

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.type === "deleteTask" ? "Excluir tarefa" : "Remover membro"}
        message={
          confirmState?.type === "deleteTask"
            ? "Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita."
            : "Remover este membro do projeto?"
        }
        confirmLabel={confirmState?.type === "deleteTask" ? "Excluir" : "Remover"}
        variant="danger"
        loading={confirmLoading}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmState(null)}
      />
    </PageLayout>
  );
}

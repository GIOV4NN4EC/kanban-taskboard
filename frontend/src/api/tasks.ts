import { apiRequest } from "./client";
import type { Task, TaskPriority, TaskStatus } from "../types";

export interface TaskFilters {
  status?: TaskStatus;
  q?: string;
  assignee_id?: string;
  due_before?: string;
  due_after?: string;
  overdue?: boolean;
}

function buildTaskQuery(filters?: TaskFilters) {
  if (!filters) return "";
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.assignee_id) params.set("assignee_id", filters.assignee_id);
  if (filters.due_before) params.set("due_before", filters.due_before);
  if (filters.due_after) params.set("due_after", filters.due_after);
  if (filters.overdue) params.set("overdue", "true");
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function listTasks(projectId: string, filters?: TaskFilters) {
  return apiRequest<Task[]>(`/projects/${projectId}/tasks${buildTaskQuery(filters)}`);
}

export function createTask(
  projectId: string,
  data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assignee_id?: string;
    due_date?: string;
  }
) {
  return apiRequest<Task>(`/projects/${projectId}/tasks`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string | null;
    priority?: TaskPriority;
    assignee_id?: string | null;
    due_date?: string | null;
  }
) {
  return apiRequest<Task>(`/tasks/${taskId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId: string) {
  return apiRequest<void>(`/tasks/${taskId}`, { method: "DELETE" });
}

export function updateTaskStatus(taskId: string, status: TaskStatus) {
  return apiRequest<Task>(`/tasks/${taskId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

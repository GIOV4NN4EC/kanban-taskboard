import { apiRequest } from "./client";
import type { TaskComment } from "../types";

export function listComments(taskId: string) {
  return apiRequest<TaskComment[]>(`/tasks/${taskId}/comments`);
}

export function createComment(taskId: string, body: string) {
  return apiRequest<TaskComment>(`/tasks/${taskId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export function updateComment(taskId: string, commentId: string, body: string) {
  return apiRequest<TaskComment>(`/tasks/${taskId}/comments/${commentId}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}

export function deleteComment(taskId: string, commentId: string) {
  return apiRequest<void>(`/tasks/${taskId}/comments/${commentId}`, { method: "DELETE" });
}

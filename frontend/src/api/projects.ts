import { apiRequest } from "./client";
import type { Project, ProjectMember } from "../types";

export function listProjects() {
  return apiRequest<Project[]>("/projects");
}

export function getProject(id: string) {
  return apiRequest<Project>(`/projects/${id}`);
}

export function createProject(name: string, description?: string, dueDate?: string) {
  return apiRequest<Project>("/projects", {
    method: "POST",
    body: JSON.stringify({ name, description, due_date: dueDate || null }),
  });
}

export function updateProject(
  id: string,
  data: { name?: string; description?: string | null; due_date?: string | null }
) {
  return apiRequest<Project>(`/projects/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteProject(id: string) {
  return apiRequest<void>(`/projects/${id}`, { method: "DELETE" });
}

export function listMembers(projectId: string) {
  return apiRequest<ProjectMember[]>(`/projects/${projectId}/members`);
}

export function addMember(projectId: string, email: string) {
  return apiRequest<ProjectMember>(`/projects/${projectId}/members`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function removeMember(projectId: string, memberUserId: string) {
  return apiRequest<void>(`/projects/${projectId}/members/${memberUserId}`, {
    method: "DELETE",
  });
}

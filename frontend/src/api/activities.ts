import { apiRequest } from "./client";
import type { Activity } from "../types";

export function listActivities(projectId: string) {
  return apiRequest<Activity[]>(`/projects/${projectId}/activities`);
}

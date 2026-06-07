export interface User {
  id: string;
  email: string;
  name: string;
  description: string | null;
  photo_url: string | null;
  created_at: string;
}

export interface ProfileUpdate {
  name?: string;
  description?: string | null;
  photo_url?: string | null;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  due_date: string | null;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  body: string;
  mentioned_user_ids: string[];
  created_at: string;
  updated_at: string | null;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: string;
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export type TaskStatus = "TODO" | "DOING" | "DONE";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id: string | null;
  due_date: string | null;
  position: number;
  created_by: string;
  created_at: string;
  updated_at: string | null;
}

export interface Activity {
  id: string;
  project_id: string;
  actor_id: string;
  event_type: string;
  message: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

import { apiRequest } from "./client";
import type { AuthResponse, ProfileUpdate, User } from "../types";

export function register(email: string, password: string, name: string) {
  return apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export function login(email: string, password: string) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function getMe() {
  return apiRequest<User>("/users/me");
}

export function getUser(userId: string) {
  return apiRequest<User>(`/users/${userId}`);
}

export function updateMe(data: ProfileUpdate) {
  return apiRequest<User>("/users/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteMe() {
  return apiRequest<void>("/users/me", { method: "DELETE" });
}

export function changePassword(currentPassword: string, newPassword: string) {
  return apiRequest<void>("/users/me/password", {
    method: "PUT",
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export function resetPassword(email: string, newPassword: string) {
  return apiRequest<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email, new_password: newPassword }),
  });
}

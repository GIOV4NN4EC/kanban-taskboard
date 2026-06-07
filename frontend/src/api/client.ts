const API_BASE = import.meta.env.VITE_API_URL || "/api";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

function getToken(): string | null {
  return localStorage.getItem("token");
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  const token = getToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    let detail = "Request failed";
    if (typeof data.detail === "string") {
      detail = data.detail;
    } else if (Array.isArray(data.detail)) {
      detail = data.detail
        .map((item: { msg?: string }) => item.msg ?? String(item))
        .join(", ");
    }
    throw new ApiError(detail, response.status);
  }

  return data as T;
}

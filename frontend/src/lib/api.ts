const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "customer" | "seller" | "admin";
  bio: string | null;
  avatar: string | null;
  shopName: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
}

/**
 * Cookie-based API client. Sessions are httpOnly cookies (`fc_session`), so
 * every request includes credentials and no token is ever stored in JS.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError(0, `Cannot reach the API at ${API_URL} — is the backend running?`);
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body.error) message = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  /* auth */
  me: () => request<{ user: AuthUser | null }>("/api/auth/me"),
  register: (
    name: string,
    email: string,
    password: string,
    role?: "customer" | "seller",
    shopName?: string,
    bio?: string
  ) =>
    request<{ user: AuthUser }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role, shopName, bio }),
    }),
  updateProfile: (profile: {
    name: string;
    bio?: string;
    avatar?: string;
    shopName?: string;
    location?: string;
    website?: string;
  }) => request<{ user: AuthUser }>("/api/me/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean }>("/api/me/password", {
      method: "PUT",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
  login: (email: string, password: string) =>
    request<{ user: AuthUser }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request<{ ok: boolean }>("/api/auth/logout", { method: "POST" }),

  /* public reads */
  get: <T,>(path: string) => request<T>(path),
  list: <T,>(path: string) => request<T[]>(path),

  /* mutations (customer submits + seller management) */
  create: <T = { success: boolean; id: string | number }>(path: string, data: unknown) =>
    request<T>(path, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: <T = { success: boolean; id: string | number }>(
    path: string,
    id: string | number,
    data: unknown
  ) =>
    request<T>(`${path}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  put: <T = { success: boolean }>(path: string, data: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  patch: <T = { success: boolean; id: string | number }>(
    path: string,
    id: string | number,
    data: unknown
  ) =>
    request<T>(`${path}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  remove: <T = { success: boolean; id: string | number }>(path: string, id: string | number) =>
    request<T>(`${path}/${id}`, {
      method: "DELETE",
    }),
};

const API_BASE_URL = "http://localhost:4000/api/v1";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("erp.accessToken");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {})
    }
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "La solicitud falló");
  }

  return payload.data as T;
}

export const api = {
  login: (email: string, password: string) =>
    request<{ user: any; tokens: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    }),
  me: () => request<any>("/auth/me"),
  refresh: (refreshToken: string) =>
    request<{ user: any; tokens: any }>("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken })
    }),
  logout: () =>
    request<null>("/auth/logout", {
      method: "POST"
    })
};

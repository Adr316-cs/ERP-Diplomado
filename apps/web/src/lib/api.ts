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
    }),
  catalog: (companyId: string, resource: string, query: { q?: string; page?: number; pageSize?: number }) => {
    const params = new URLSearchParams();
    if (query.q) params.set("q", query.q);
    if (query.page) params.set("page", String(query.page));
    if (query.pageSize) params.set("pageSize", String(query.pageSize));
    return fetch(`${API_BASE_URL}/companies/${encodeURIComponent(companyId)}/${resource}?${params.toString()}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("erp.accessToken") ?? ""}` }
    }).then(async (response) => {
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error?.message ?? "La solicitud falló");
      return { data: payload.data as Record<string, unknown>[], meta: payload.meta as { page: number; pageSize: number; total: number; totalPages: number } | undefined };
    });
  }
};

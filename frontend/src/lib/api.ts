/* eslint-disable @typescript-eslint/no-explicit-any */
// FinePrint — API client utility
// Wraps fetch calls to the FastAPI backend with auth headers.

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("fineprint_token");
}

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("fineprint_token");
      window.location.href = "/login";
    }
    const error = await response.json().catch(() => ({ detail: "Network error" }));
    throw new Error(error.detail || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  register: (data: { org_name: string; email: string; password: string; full_name?: string }) =>
    apiFetch<{ access_token: string }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    apiFetch<{ access_token: string }>("/auth/login", { method: "POST", body: JSON.stringify(data) }),

  me: () => apiFetch<{ id: string; email: string; role: string; org_id: string }>("/auth/me"),

  // Dashboard
  dashboardSummary: () => apiFetch<any>("/dashboard/summary"),

  // Contracts
  listContracts: (params?: { risk_level?: string; status?: string }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/contracts${qs ? `?${qs}` : ""}`);
  },
  getContract: (id: string) => apiFetch<any>(`/contracts/${id}`),
  triggerScan: (id: string) =>
    apiFetch<any>(`/contracts/${id}/scan`, { method: "POST" }),

  uploadContract: async (file: File) => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch(`${API_BASE}/contracts/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("fineprint_token");
        window.location.href = "/login";
      }
      throw new Error("Upload failed");
    }
    return response.json();
  },

  // Decisions
  listDecisions: (status?: string) =>
    apiFetch<any>(`/decisions${status ? `?status=${status}` : ""}`),
  approveDecision: (id: string) =>
    apiFetch<any>(`/decisions/${id}/approve`, { method: "POST" }),
  rejectDecision: (id: string) =>
    apiFetch<any>(`/decisions/${id}/reject`, { method: "POST" }),

  // Actions
  listActions: () => apiFetch<any>("/actions"),
  getAction: (id: string) => apiFetch<any>(`/actions/${id}`),
  sendAction: (id: string) =>
    apiFetch<any>(`/actions/${id}/send`, { method: "POST" }),

  // MCP
  listMcpConnections: () => apiFetch<any>("/mcp"),
  connectMcpServer: (server_type: string, data: { url: string; credentials?: string }) =>
    apiFetch<any>(`/mcp/${server_type}/connect`, { method: "POST", body: JSON.stringify(data) }),
  disconnectMcpServer: (server_type: string) =>
    apiFetch<any>(`/mcp/${server_type}`, { method: "DELETE" }),
  updateMcpScopes: (server_type: string, data: { scopes: string[] }) =>
    apiFetch<any>(`/mcp/${server_type}/scopes`, { method: "PATCH", body: JSON.stringify(data) }),

  // Settings
  getOrgSettings: () => apiFetch<any>("/settings"),
  updateOrgSettings: (data: any) =>
    apiFetch<any>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // Audit Log
  listAuditLogs: (params?: { contract_id?: string; limit?: number }) => {
    const qs = new URLSearchParams(params as any).toString();
    return apiFetch<any>(`/audit${qs ? `?${qs}` : ""}`);
  },

  // Chat (AI Q&A)
  chat: (data: { message: string; contract_id?: string }) =>
    apiFetch<{ reply: string; context_used: string[] }>("/chat", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  // Analytics
  getOutcomeAnalytics: () => apiFetch<any>("/analytics/outcomes"),
  getRiskTrend: (days?: number) =>
    apiFetch<any>(`/analytics/risk-trend${days ? `?days=${days}` : ""}`),
  getAnalyticsSummary: () => apiFetch<any>("/analytics/summary"),

  // Notifications
  listNotifications: () => apiFetch<any>("/notifications"),

  // Renewals Calendar
  getRenewals: () => apiFetch<any>("/renewals"),

  // Export (direct download links — use window.open)
  exportContractsUrl: () => `${API_BASE}/export/contracts`,
  exportDecisionsUrl: () => `${API_BASE}/export/decisions`,

  // Vendor Intelligence
  getVendors: () => apiFetch<any>("/vendors"),

  // Team Management
  listTeam: () => apiFetch<any>("/team"),
  inviteUser: (data: { email: string; full_name?: string; role: string }) =>
    apiFetch<any>("/team/invite", { method: "POST", body: JSON.stringify(data) }),
  updateUserRole: (userId: string, data: { role: string }) =>
    apiFetch<any>(`/team/${userId}/role`, { method: "PATCH", body: JSON.stringify(data) }),
  removeUser: (userId: string) =>
    apiFetch<any>(`/team/${userId}`, { method: "DELETE" }),

  // Webhooks
  listWebhooks: () => apiFetch<any>("/webhooks"),
  createWebhook: (data: { url: string; description?: string; event_types?: string[] }) =>
    apiFetch<any>("/webhooks", { method: "POST", body: JSON.stringify(data) }),
  updateWebhook: (id: string, data: { is_active?: boolean; description?: string }) =>
    apiFetch<any>(`/webhooks/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  deleteWebhook: (id: string) =>
    apiFetch<any>(`/webhooks/${id}`, { method: "DELETE" }),
  testWebhook: (id: string) =>
    apiFetch<any>(`/webhooks/${id}/test`, { method: "POST" }),
};

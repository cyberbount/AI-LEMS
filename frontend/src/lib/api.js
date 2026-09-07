const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(/\/$/, "");

export const fallbackData = {
  devices: [
    { id: 14, asset_code: "EQ-014", name: "Oscilloscope Tektronix TBS1102B", category: "Test equipment", status: "available" },
    { id: 22, asset_code: "EQ-022", name: "Nguồn DC Keysight E3631A", category: "Power supply", status: "available" },
    { id: 31, asset_code: "EQ-031", name: "Bộ kit ESP32 IoT", category: "IoT", status: "available" },
  ],
  requests: [],
  maintenance: [],
  stats: { users: null, devices: null, requests: null, maintenance_open: null, usage_by_action: {} },
};

async function request(path, options = {}) {
  const token = localStorage.getItem("lab_token");
  const headers = { ...(options.body instanceof URLSearchParams ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.detail || `API error ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function login(username, password) {
  const data = await request("/api/auth/login", { method: "POST", body: new URLSearchParams({ username, password }) });
  localStorage.setItem("lab_token", data.access_token);
  return request("/api/auth/me");
}

export const api = {
  me: () => request("/api/auth/me"),
  devices: () => request("/api/devices"),
  createDevice: (payload) => request("/api/devices", { method: "POST", body: JSON.stringify(payload) }),
  updateDeviceStatus: (id, status) => request(`/api/devices/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  requests: () => request("/api/requests"),
  borrow: (device_id, purpose) => request("/api/requests", { method: "POST", body: JSON.stringify({ device_id, purpose }) }),
  approveRequest: (id, status) => request(`/api/requests/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  returnRequest: (id) => request(`/api/requests/${id}/return`, { method: "PATCH" }),
  maintenance: () => request("/api/maintenance"),
  completeMaintenance: (id) => request(`/api/maintenance/${id}/complete`, { method: "PATCH" }),
  createMaintenance: (device_id, notes, kind = "inspection") => request("/api/maintenance", { method: "POST", body: JSON.stringify({ device_id, notes, kind }) }),
  stats: () => request("/api/stats"),
  groups: () => request("/api/groups"),
  locations: () => request("/api/locations"),
  users: () => request("/api/users"),
  chat: (message, history, mode = "chat") => request("/api/ai/chat", { method: "POST", body: JSON.stringify({ message, history, mode }) }),
};

export function clearSession() { localStorage.removeItem("lab_token"); localStorage.removeItem("lab_role"); localStorage.removeItem("lab_user"); }

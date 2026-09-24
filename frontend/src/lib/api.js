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
  const fetchOptions = { ...options, headers };
  if (!options.signal) {
    delete fetchOptions.signal;
  }
  const response = await fetch(`${API_URL}${path}`, fetchOptions);
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

export async function googleLogin(idToken) {
  const data = await request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  localStorage.setItem("lab_token", data.access_token);
  return request("/api/auth/me");
}


export const api = {
  me: () => request("/api/auth/me"),
  devices: () => request("/api/devices"),
  createDevice: (payload) => request("/api/devices", { method: "POST", body: JSON.stringify(payload) }),
  updateDeviceStatus: (id, status, condition) => {
    let url = `/api/devices/${id}/status?status=${encodeURIComponent(status)}`;
    if (condition) url += `&condition=${encodeURIComponent(condition)}`;
    return request(url, { method: "PATCH" });
  },
  updateDevice: (id, payload) => request(`/api/devices/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  requests: () => request("/api/requests"),
  borrow: (device_id, purpose) => request("/api/requests", { method: "POST", body: JSON.stringify({ device_id, purpose }) }),
  approveRequest: (id, status) => request(`/api/requests/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  handoverRequest: (id) => request(`/api/requests/${id}/borrow`, { method: "PATCH" }),
  returnRequest: (id) => request(`/api/requests/${id}/return`, { method: "PATCH" }),
  maintenance: () => request("/api/maintenance"),
  completeMaintenance: (id) => request(`/api/maintenance/${id}/complete`, { method: "PATCH" }),
  updateMaintenance: (id, payload) => request(`/api/maintenance/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteMaintenance: (id) => request(`/api/maintenance/${id}`, { method: "DELETE" }),
  createMaintenance: (device_id, notes, status = "open", kind = "inspection") => request("/api/maintenance", { method: "POST", body: JSON.stringify({ device_id, notes, status, kind }) }),
  stats: () => request("/api/stats"),
  groups: () => request("/api/groups"),
  locations: () => request("/api/locations"),
  users: () => request("/api/users"),
  createUser: (payload) => request("/api/users", { method: "POST", body: JSON.stringify(payload) }),
  updateUser: (id, payload) => request(`/api/users/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteUser: (id) => request(`/api/users/${id}`, { method: "DELETE" }),
  resetUserPassword: (id, new_password) => request(`/api/users/${id}/reset-password`, { method: "POST", body: JSON.stringify({ new_password }) }),
  changePassword: (payload) => request("/api/auth/password", { method: "PATCH", body: JSON.stringify(payload) }),
  chat: (message, history, mode = "chat", signal = undefined) => {
    const opts = { method: "POST", body: JSON.stringify({ message, history, mode }) };
    if (signal) opts.signal = signal;
    return request("/api/ai/chat", opts);
  },
};

export function clearSession() { localStorage.removeItem("lab_token"); localStorage.removeItem("lab_role"); localStorage.removeItem("lab_user"); }

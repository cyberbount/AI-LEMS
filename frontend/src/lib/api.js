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
  const token = sessionStorage.getItem("lab_token") || localStorage.getItem("lab_token");
  const headers = { ...(options.body instanceof URLSearchParams ? {} : { "Content-Type": "application/json" }), ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;
  const fetchOptions = { ...options, headers };
  if (!options.signal) {
    delete fetchOptions.signal;
  }
  const response = await fetch(`${API_URL}${path}`, fetchOptions);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    let message = `Lỗi hệ thống (${response.status})`;
    if (typeof data.detail === "string") {
      message = data.detail;
    } else if (Array.isArray(data.detail)) {
      message = data.detail
        .map((d) => {
          const field = d.loc ? d.loc[d.loc.length - 1] : "";
          if (field === "password") return "Mật khẩu phải có tối thiểu 8 ký tự.";
          if (field === "username") return "Tên đăng nhập không hợp lệ (tối thiểu 3 ký tự).";
          if (field === "email") return "Định dạng email không hợp lệ.";
          return d.msg || "Dữ liệu không hợp lệ";
        })
        .join(". ");
    } else if (data.detail && typeof data.detail === "object") {
      message = data.detail.message || JSON.stringify(data.detail);
    }
    const error = new Error(message);
    error.status = response.status;
    error.detail = data.detail;
    throw error;
  }
  return data;
}

function normalizeUser(user) {
  if (user && user.role === "manager") {
    return { ...user, role: "admin" };
  }
  return user;
}

export async function login(username, password) {
  const data = await request("/api/auth/login", { method: "POST", body: new URLSearchParams({ username, password }) });
  sessionStorage.setItem("lab_token", data.access_token);
  localStorage.removeItem("lab_token");
  const user = await request("/api/auth/me");
  return normalizeUser(user);
}

export async function googleLogin(idToken) {
  const data = await request("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ id_token: idToken }),
  });
  sessionStorage.setItem("lab_token", data.access_token);
  localStorage.removeItem("lab_token");
  const user = await request("/api/auth/me");
  return normalizeUser(user);
}


export const api = {
  me: async () => normalizeUser(await request("/api/auth/me")),
  devices: () => request("/api/devices"),
  createDevice: (payload) => request("/api/devices", { method: "POST", body: JSON.stringify(payload) }),
  updateDeviceStatus: (id, status, condition) => {
    let url = `/api/devices/${id}/status?status=${encodeURIComponent(status)}`;
    if (condition) url += `&condition=${encodeURIComponent(condition)}`;
    return request(url, { method: "PATCH" });
  },
  updateDevice: (id, payload) => request(`/api/devices/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteDevice: (id) => request(`/api/devices/${id}`, { method: "DELETE" }),
  requests: () => request("/api/requests"),
  borrow: (device_id, purpose, requested_to = null, requested_from = null) => {
    const body = { device_id, purpose };
    if (requested_to) body.requested_to = requested_to;
    if (requested_from) body.requested_from = requested_from;
    return request("/api/requests", { method: "POST", body: JSON.stringify(body) });
  },
  reportIncident: (request_id, description) => request(`/api/requests/${request_id}/incident`, { method: "POST", body: JSON.stringify({ description }) }),
  approveRequest: (id, status) => request(`/api/requests/${id}/status?status=${encodeURIComponent(status)}`, { method: "PATCH" }),
  handoverRequest: (id) => request(`/api/requests/${id}/borrow`, { method: "PATCH" }),
  requestReturn: (id) => request(`/api/requests/${id}/request-return`, { method: "PATCH" }),
  confirmReturn: (id, payload = {}) => request(`/api/requests/${id}/confirm-return`, { method: "PATCH", body: JSON.stringify(payload) }),
  returnRequest: (id) => request(`/api/requests/${id}/return`, { method: "PATCH" }),

  maintenance: () => request("/api/maintenance"),
  completeMaintenance: (id) => request(`/api/maintenance/${id}/complete`, { method: "PATCH" }),
  acceptIncident: (id) => request(`/api/maintenance/${id}/accept`, { method: "PATCH" }),
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
  auditLogs: (params = {}) => {
    const q = new URLSearchParams();
    if (params.target_type) q.set("target_type", params.target_type);
    if (params.action) q.set("action", params.action);
    if (params.limit) q.set("limit", params.limit);
    const qs = q.toString() ? `?${q.toString()}` : "";
    return request(`/api/audit-logs${qs}`);
  },
  chat: (message, history, mode = "chat", signal = undefined) => {

    const opts = { method: "POST", body: JSON.stringify({ message, history, mode }) };
    if (signal) opts.signal = signal;
    return request("/api/ai/chat", opts);
  },
};

export function clearSession() {
  sessionStorage.removeItem("lab_token");
  sessionStorage.removeItem("lab_role");
  sessionStorage.removeItem("lab_user");
  localStorage.removeItem("lab_token");
  localStorage.removeItem("lab_role");
  localStorage.removeItem("lab_user");
}

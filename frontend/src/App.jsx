import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Bot, CheckCircle2, ClipboardCheck, Cpu,
  LayoutDashboard, LogOut, Menu, Package, Search, Settings2, Users, Wrench, X, Zap,
  Eye, EyeOff, Loader2, Lock, User as UserIcon,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Toast } from "./components/ui";
import { api, clearSession, fallbackData, login } from "./lib/api";

/* ------------------------------------------------------------------ */
/* Roles & navigation                                                  */
/* ------------------------------------------------------------------ */
const roles = {
  admin: { label: "Quản trị viên", initials: "QT", name: "Nguyễn Minh Anh", path: "/admin" },
  user: { label: "Người sử dụng", initials: "NS", name: "Nguyễn Hoàng Nam", path: "/user" },
  technician: { label: "Kỹ thuật viên", initials: "KT", name: "Trần Minh Kỹ", path: "/technician" },
};

const navItems = {
  admin: [
    ["Tổng quan", LayoutDashboard],
    ["Người dùng", Users],
    ["Thiết bị", Cpu],
    ["Bảo trì", Wrench],
    ["Yêu cầu mượn", ClipboardCheck],
    ["Báo cáo", BarChart3],
    ["Trợ lý AI", Bot],
  ],
  user: [
    ["Tổng quan", LayoutDashboard],
    ["Thiết bị", Cpu],
    ["Lượt mượn của tôi", Package],
    ["Trợ lý AI", Bot],
  ],
  technician: [
    ["Tổng quan", LayoutDashboard],
    ["Bảo trì", Wrench],
    ["Lịch sử", ClipboardCheck],
    ["Cảnh báo AI", AlertTriangle],
  ],
};

const statusMeta = {
  available: { label: "Sẵn sàng", tone: "green" },
  reserved: { label: "Đã đặt trước", tone: "blue" },
  borrowed: { label: "Đang mượn", tone: "amber" },
  maintenance: { label: "Đang bảo trì", tone: "red" },
  pending: { label: "Chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "blue" },
  rejected: { label: "Từ chối", tone: "red" },
  returned: { label: "Đã trả", tone: "green" },
  open: { label: "Đang mở", tone: "amber" },
  completed: { label: "Hoàn thành", tone: "green" },
};

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

/* ------------------------------------------------------------------ */
/* Auth provider                                                       */
/* ------------------------------------------------------------------ */
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("lab_user") || "null"));

  async function signIn(username, password) {
    try {
      const loggedIn = await login(username, password);
      setUser(loggedIn);
      localStorage.setItem("lab_user", JSON.stringify(loggedIn));
      localStorage.setItem("lab_role", loggedIn.role);
      return loggedIn;
    } catch (error) {
      throw error;
    }
  }

  function signOut() {
    clearSession();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, signIn, signOut }}>{children}</AuthContext.Provider>;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/:role" element={<Protected />} />
          <Route path="*" element={<Navigate to={localStorage.getItem("lab_role") ? roles[localStorage.getItem("lab_role")].path : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

function Protected() {
  const { user } = useAuth();
  const role = localStorage.getItem("lab_role");
  if (!user || !roles[role]) return <Navigate to="/login" replace />;
  return <DashboardLayout role={role} />;
}

/* ------------------------------------------------------------------ */
/* Login page                                                          */
/* ------------------------------------------------------------------ */
function Login() {
  const navigate = useNavigate();
  const { user, signIn } = useAuth();
  const roleOptions = {
    admin: { icon: Users },
    user: { icon: UserIcon },
    technician: { icon: Wrench },
  };
  const [selectedRole, setSelectedRole] = useState("admin");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user) navigate(roles[user.role]?.path || "/login", { replace: true });
  }, [user, navigate]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const account = await signIn(username.trim(), password);
      navigate(roles[account.role].path);
    } catch (error) {
      setNotice(error.status === 401 ? "Tên đăng nhập hoặc mật khẩu không đúng." : "Không thể kết nối với hệ thống. Hãy kiểm tra backend hoặc Ollama.");
    } finally {
      setBusy(false);
    }
  }

  function chooseDemoRole(nextRole) {
    setSelectedRole(nextRole);
    setUsername(nextRole);
    setPassword("");
    setNotice("");
  }

  return (
    <div className="min-h-[100dvh] bg-mist text-ink lg:grid lg:grid-cols-[1.05fr_.95fr]">

      {/* Left brand panel */}
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-slate-200 bg-white p-14 lg:flex">
        <div><Logo /></div>
        <div className="mt-28 max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-brand">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Quản lý phòng thí nghiệm
          </p>
          <h1 className="mt-7 text-5xl font-extrabold leading-[1.04] tracking-tight">
            Quản lý thiết bị rõ ràng, chính xác.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-500">
            Theo dõi thiết bị, mượn trả, bảo trì và trợ lý AI nội bộ trong cùng một hệ thống.
          </p>
        </div>
        <div className="max-w-md border-l border-red-200 pl-5 text-sm leading-7 text-slate-500">
          <p>Quản lý thiết bị, mượn/trả và bảo trì trong cùng một hệ thống.</p>
          <p>Trợ lý AI chạy cục bộ qua Ollama và chỉ hỗ trợ từ dữ liệu được cung cấp.</p>
        </div>
      </section>

      {/* Right login form */}
      <section className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md">
          <Card className="rounded-2xl border border-slate-200 bg-white p-1.5 shadow-card">
            <div className="rounded-xl bg-white p-8 sm:p-10">
              <div className="mb-8 lg:hidden"><Logo /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-brand">QUẢN LÝ PHÒNG THÍ NGHIỆM</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-ink">Đăng nhập hệ thống</h1>
              <p className="mt-2 text-sm leading-6 text-slate-500">Thiết bị, mượn trả, bảo trì và trợ lý AI nội bộ.</p>

              <form className="mt-9 space-y-5" onSubmit={submit}>
                <label className="block text-sm font-semibold text-slate-700">
                  Tên đăng nhập
                  <div className="relative mt-2">
                    <UserIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-white pl-11 text-ink placeholder:text-slate-400 focus:border-brand/70"
                      placeholder="Nhập tên đăng nhập"
                      required
                    />
                  </div>
                </label>

                <fieldset>
                  <legend className="text-sm font-semibold text-slate-700">Chọn vai trò</legend>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {Object.entries(roleOptions).map(([key, item]) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={selectedRole === key}
                          onClick={() => chooseDemoRole(key)}
                          className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-xs font-semibold transition ${selectedRole === key ? "border-brand bg-red-50 text-brand shadow-sm" : "border-slate-200 bg-white text-slate-500 hover:border-red-200 hover:text-brand"}`}
                        >
                          <Icon size={17} />
                          <span>{roles[key].label}</span>
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="block text-sm font-semibold text-slate-700">
                  Mật khẩu
                  <div className="relative mt-2">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-xl border-slate-200 bg-white pl-11 pr-12 text-ink placeholder:text-slate-400 focus:border-brand/70"
                      type={showPassword ? "text" : "password"}
                      placeholder="Nhập mật khẩu"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-300"
                      aria-label="Hiện/ẩn mật khẩu"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>

                {notice && (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">{notice}</p>
                )}

                <Button
                  className="group relative mt-2 w-full overflow-hidden rounded-full py-3.5 text-sm transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[#a9191f] active:scale-[0.98]"
                  type="submit"
                  disabled={busy}
                >
                  {busy ? (
                    <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Đang xác thực...</span>
                  ) : (
                    <>
                      Đăng nhập
                      <span className="ml-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 group-hover:-translate-y-px">
                        <ArrowRight size={14} />
                      </span>
                    </>
                  )}
                </Button>
              </form>

              <p className="mt-6 text-center text-xs text-slate-400">Trợ lý AI chạy nội bộ. Dữ liệu không gửi ra bên ngoài.</p>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function DashboardLayout({ role }) {
  const { signOut, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("Tổng quan");
  const profile = roles[role];

  return (
    <div className="min-h-screen bg-mist text-ink">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-slate-200 bg-white p-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between">
          <Logo />
          <button className="text-slate-400 lg:hidden" onClick={() => setMobileOpen(false)}><X size={20} /></button>
        </div>

        <div className="mt-10 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Khu vực làm việc</p>
          <nav className="mt-3 space-y-1">
            {navItems[role].map(([label, Icon]) => (
              <button
                key={label}
                type="button"
                onClick={() => { setActive(label); setMobileOpen(false); }}
                className={`side-link w-full ${active === label ? "active" : ""}`}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label.includes("AI") && <span className="ml-auto h-2 w-2 rounded-full bg-brand" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4">
          <div className="rounded-xl bg-slate-50 p-3">
            <div className="flex items-center gap-3">
              <div className="avatar">{profile.initials}</div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user?.full_name || profile.name}</p>
                <p className="truncate text-xs text-slate-400">{profile.label}</p>
              </div>
            </div>
            <button onClick={signOut} className="mt-4 flex w-full items-center gap-2 text-xs font-semibold text-slate-500 hover:text-brand">
              <LogOut size={14} /> Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-20 bg-ink/30 lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 text-slate-500 lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={20} /></button>
          <div className="hidden text-sm text-slate-500 sm:block">
            <span className="font-semibold text-slate-800">{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
            <span className="mx-2 text-slate-300">/</span>
            <span>Tổng quan vận hành</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600" aria-label="Thông báo">
              <Bell size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand" />
            </button>
            <div className="avatar">{profile.initials}</div>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-5 sm:p-8">
          {role === "admin" ? <AdminDashboard section={active} /> : role === "user" ? <UserDashboard section={active} /> : <TechnicianDashboard section={active} />}
        </main>
      </div>

      <FloatingAssistant />
    </div>
  );
}

function Logo({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-white shadow-lg shadow-brand/20"><Zap size={19} fill="currentColor" /></div>
      <div>
        <p className={`text-sm font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>LAB<span className="text-brand">CORE</span></p>
        <p className={`whitespace-nowrap text-[9px] font-bold uppercase tracking-[.14em] ${light ? "text-slate-400" : "text-slate-400"}`}>Quản lý thiết bị</p>
      </div>
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title">{title}</h1>
        <p className="page-desc">{description}</p>
      </div>
      {action}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, tone = "red", hint }) {
  const tones = {
    red: "bg-red-50 text-brand",
    amber: "bg-amber-50 text-amber-600",
    green: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <Card hover className="p-5">
      <div className="flex items-start justify-between">
        <div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={19} /></div>
        {hint && <span className="text-[11px] font-semibold text-slate-400">{hint}</span>}
      </div>
      <p className="mt-5 text-3xl font-bold tracking-tight text-ink">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="text-base font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}

function OfflineNotice() {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <AlertTriangle size={16} />
      <span>API tạm thời không khả dụng. Đang hiển thị dữ liệu mẫu; thao tác nghiệp vụ mới sẽ không được ghi nhận.</span>
    </div>
  );
}

function Empty({ text }) {
  return <p className="empty-state">{text}</p>;
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || { label: status, tone: "slate" };
  return <Badge tone={meta.tone} dot>{meta.label}</Badge>;
}

function WorkspaceSection({ section, role, data, onBorrow, onComplete }) {
  const titles = {
    "Người dùng": ["Người dùng", "Danh sách người dùng hiện có trong hệ thống."],
    "Thiết bị": ["Thiết bị", "Tra cứu trạng thái thiết bị từ dữ liệu hiện tại."],
    "Bảo trì": ["Bảo trì", "Các bản ghi bảo trì đang được theo dõi."],
    "Lịch sử": ["Lịch sử bảo trì", "Các bản ghi đã hoàn thành và đang xử lý."],
    "Yêu cầu mượn": ["Yêu cầu mượn", "Theo dõi các yêu cầu mượn thiết bị."],
    "Lượt mượn của tôi": ["Lượt mượn của tôi", "Các yêu cầu mượn gắn với tài khoản hiện tại."],
    "Báo cáo": ["Báo cáo vận hành", "Số liệu được lấy từ API thống kê của hệ thống."],
  };
  const [title, description] = titles[section] || [section, "Nội dung đang được tải từ hệ thống."];
  const maintenanceItems = section === "Lịch sử" ? data.maintenance.filter((item) => item.status === "completed") : data.maintenance;

  if (section === "Trợ lý AI" || section === "Cảnh báo AI") {
    return <AIChatPanel title={section} mode={section === "Cảnh báo AI" ? "inspection_alert" : undefined} starter="Bạn có thể hỏi về thiết bị, quy trình hoặc an toàn phòng thí nghiệm." />;
  }

  return (
    <Card className="p-5 sm:p-6">
      <SectionTitle title={title} />
      <p className="mb-5 text-sm text-slate-500">{description}</p>
      {section === "Thiết bị" && (
        data.devices.length ? <div className="grid gap-3 md:grid-cols-2">{data.devices.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600"><Cpu size={17} /></div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{item.name}</p><p className="mt-1 text-xs text-slate-400">{item.asset_code} • <StatusBadge status={item.status} /></p></div>
            {role === "user" && item.status === "available" && <Button size="sm" onClick={() => onBorrow(item)}>Mượn</Button>}
          </div>
        ))}</div> : <Empty text="Chưa có thiết bị từ API." />
      )}
      {(section === "Yêu cầu mượn" || section === "Lượt mượn của tôi") && (data.requests.length ? <RequestList items={data.requests} onReturn={role === "user" ? data.onReturn : undefined} /> : <Empty text="Chưa có yêu cầu mượn." />)}
      {(section === "Bảo trì" || section === "Lịch sử") && (maintenanceItems.length ? maintenanceItems.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0">
          <Settings2 size={17} className="text-brand" /><span className="flex-1 text-sm font-semibold">Thiết bị #{item.device_id} • {item.kind}</span><StatusBadge status={item.status} />
          {role === "technician" && item.status !== "completed" && <Button size="sm" variant="success" onClick={() => onComplete(item)}>Hoàn thành</Button>}
        </div>
      )) : <Empty text="Chưa có bản ghi bảo trì từ API." />)}
      {section === "Báo cáo" && <><UsageChart usage={data.stats.usage_by_action} /><div className="mt-5 grid gap-3 sm:grid-cols-3"><KPICard label="Thiết bị" value={data.stats.devices} icon={Cpu} /><KPICard label="Yêu cầu" value={data.stats.requests} icon={Package} tone="blue" /><KPICard label="Bảo trì mở" value={data.stats.maintenance_open} icon={Wrench} tone="amber" /></div></>}
      {section === "Người dùng" && <Empty text="Chưa có dữ liệu người dùng từ API." />}
    </Card>
  );
}

function AdminSection({ section, data, onRequestStatus, onOpenDeviceForm, onDeviceStatus }) {
  if (section === "Trợ lý AI") return <AIChatPanel title="Trợ lý AI" mode="summary" starter="Tôi có thể tóm tắt tình trạng thiết bị, yêu cầu mượn và bảo trì từ dữ liệu hiện có." />;
  if (section === "Người dùng") return (
    <Card className="overflow-hidden">
      <SectionTitle title="Danh sách người dùng" />
      {data.users?.length ? <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Họ tên</th><th className="px-5 py-3">Tên đăng nhập</th><th className="px-5 py-3">Vai trò</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody>{data.users.map((item) => <tr className="border-t border-slate-100" key={item.id}><td className="px-5 py-4 font-semibold text-slate-700">{item.full_name}</td><td className="px-5 py-4 text-slate-500">{item.username}</td><td className="px-5 py-4">{roles[item.role]?.label || item.role}</td><td className="px-5 py-4"><Badge tone={item.is_active ? "green" : "red"} dot>{item.is_active ? "Đang hoạt động" : "Đã khóa"}</Badge></td></tr>)}</tbody></table></div> : <Empty text="Chưa có người dùng từ API." />}
    </Card>
  );
  if (section === "Thiết bị") return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6"><div><SectionTitle title="Danh sách thiết bị" /><p className="-mt-3 text-sm text-slate-500">Quản lý trạng thái và thông tin thiết bị trong phòng thí nghiệm.</p></div><Button size="sm" onClick={onOpenDeviceForm}><Package size={15} /> Thêm thiết bị</Button></div>
      {data.devices.length ? <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-5 py-3">Thiết bị</th><th className="px-5 py-3">Mã tài sản</th><th className="px-5 py-3">Nhóm</th><th className="px-5 py-3">Trạng thái</th></tr></thead><tbody>{data.devices.map((item) => <tr className="border-t border-slate-100" key={item.id}><td className="px-5 py-4 font-semibold text-slate-700">{item.name}</td><td className="px-5 py-4 text-slate-500">{item.asset_code}</td><td className="px-5 py-4 text-slate-500">{item.category}</td><td className="px-5 py-3"><Select value={item.status} onChange={(event) => onDeviceStatus(item, event.target.value)} className="h-9 min-w-40 text-xs">{["available", "reserved", "borrowed", "maintenance"].map((status) => <option value={status} key={status}>{statusMeta[status].label}</option>)}</Select></td></tr>)}</tbody></table></div> : <Empty text="Chưa có thiết bị từ API." />}
    </Card>
  );
  if (section === "Yêu cầu mượn") return <Card className="p-5 sm:p-6"><SectionTitle title="Yêu cầu mượn" />{data.requests.length ? <RequestList items={data.requests} onApprove={(item) => onRequestStatus(item, "approved")} onReject={(item) => onRequestStatus(item, "rejected")} /> : <Empty text="Chưa có yêu cầu mượn." />}</Card>;
  if (section === "Báo cáo") return <Card className="p-5 sm:p-6"><SectionTitle title="Báo cáo vận hành" /><UsageChart usage={data.stats.usage_by_action} /><div className="mt-6 grid gap-4 sm:grid-cols-3"><KPICard label="Thiết bị" value={data.stats.devices} icon={Cpu} /><KPICard label="Yêu cầu mượn" value={data.stats.requests} icon={Package} tone="blue" /><KPICard label="Bảo trì đang mở" value={data.stats.maintenance_open} icon={Wrench} tone="amber" /></div></Card>;
  return <WorkspaceSection section={section} role="admin" data={data} />;
}

function DeviceModal({ open, form, setForm, onClose, onSubmit }) {
  return <Modal open={open} onClose={onClose} title="Thêm thiết bị" footer={<><Button variant="outline" onClick={onClose}>Hủy</Button><Button onClick={onSubmit} disabled={!form.asset_code || !form.name || !form.category}>Lưu thiết bị</Button></>}>
    <label className="block text-sm font-semibold text-slate-700">Mã tài sản<Input value={form.asset_code} onChange={(event) => setForm({ ...form, asset_code: event.target.value })} placeholder="Ví dụ: EQ-021" className="mt-2" /></label>
    <label className="block text-sm font-semibold text-slate-700">Tên thiết bị<Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Tên hiển thị của thiết bị" className="mt-2" /></label>
    <label className="block text-sm font-semibold text-slate-700">Nhóm thiết bị<Input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} placeholder="Ví dụ: Thiết bị đo" className="mt-2" /></label>
    <label className="block text-sm font-semibold text-slate-700">Số serial<Input value={form.serial_number} onChange={(event) => setForm({ ...form, serial_number: event.target.value })} placeholder="Có thể bỏ trống" className="mt-2" /></label>
  </Modal>;
}

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */
function useDashboardData(includeUsers = false) {
  const [data, setData] = useState(fallbackData);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.devices(), api.requests(), api.maintenance(), api.stats(), includeUsers ? api.users() : Promise.resolve([])]).then((results) => {
      const next = { ...fallbackData };
      ["devices", "requests", "maintenance", "stats", "users"].forEach((key, i) => {
        if (results[i].status === "fulfilled") next[key] = results[i].value;
      });
      setOffline(results.slice(0, 4).some((result) => result.status === "rejected") || (includeUsers && results[4].status === "rejected"));
      setData(next);
      setLoading(false);
    });
  }, []);

  return { data, offline, loading, setData };
}

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */
function AdminDashboard({ section = "Tổng quan" }) {
  const { data, offline, setData } = useDashboardData(true);
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [deviceModal, setDeviceModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ asset_code: "", name: "", category: "", serial_number: "" });

  async function updateRequest(item, status) {
    try {
      const updated = await api.approveRequest(item.id, status);
      setData((current) => ({ ...current, requests: current.requests.map((row) => row.id === item.id ? updated : row) }));
      setToast({ message: status === "approved" ? "Đã duyệt yêu cầu mượn." : "Đã từ chối yêu cầu mượn.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật yêu cầu.", type: "error" });
    }
  }

  async function createDevice() {
    try {
      const created = await api.createDevice(deviceForm);
      setData((current) => ({ ...current, devices: [...current.devices, created] }));
      setDeviceForm({ asset_code: "", name: "", category: "", serial_number: "" });
      setDeviceModal(false);
      setToast({ message: "Đã thêm thiết bị.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể thêm thiết bị.", type: "error" });
    }
  }

  async function updateDeviceStatus(item, status) {
    try {
      const updated = await api.updateDeviceStatus(item.id, status);
      setData((current) => ({ ...current, devices: current.devices.map((row) => row.id === item.id ? updated : row) }));
      setToast({ message: "Đã cập nhật trạng thái thiết bị.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật thiết bị.", type: "error" });
    }
  }

  const adminSection = section !== "Tổng quan" ? <AdminSection section={section} data={data} onRequestStatus={updateRequest} onOpenDeviceForm={() => setDeviceModal(true)} onDeviceStatus={updateDeviceStatus} /> : null;

  if (section !== "Tổng quan") return <><PageHeader eyebrow="Khu vực quản trị" title={section} description="Quản lý thiết bị, người dùng, yêu cầu và báo cáo." />{offline && <OfflineNotice />}{adminSection}<DeviceModal open={deviceModal} form={deviceForm} setForm={setDeviceForm} onClose={() => setDeviceModal(false)} onSubmit={createDevice} /><Toast message={toast?.message} type={toast?.type} /></>;

  const pendingCount = data.requests.filter((r) => r.status === "pending").length;
  const availableCount = data.devices.filter((d) => d.status === "available").length;

  return (
    <>
      <PageHeader
        eyebrow="Khu vực quản trị"
        title={`Xin chào, ${user?.full_name || "quản lý phòng lab"}`}
        description="Đây là tổng quan vận hành phòng thí nghiệm hôm nay."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Tổng thiết bị" value={data.stats.devices} icon={Cpu} hint={`${availableCount} sẵn sàng`} />
        <KPICard label="Yêu cầu mượn" value={data.stats.requests} icon={Package} tone="blue" hint={`${pendingCount} chờ duyệt`} />
        <KPICard label="Cần kiểm tra" value={data.stats.maintenance_open} icon={AlertTriangle} tone="amber" />
        <KPICard label="Người dùng" value={data.stats.users} icon={Users} tone="green" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6">
          <SectionTitle title="Yêu cầu gần đây" />
          {data.requests.length ? <RequestList items={data.requests} /> : <Empty text="Chưa có yêu cầu mượn." />}
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionTitle title="Tần suất sử dụng" />
          <UsageChart usage={data.stats.usage_by_action} />
        </Card>
      </div>

      <div className="mt-6">
        <AIChatPanel title="AI Summary" mode="summary" starter="Tôi có thể tóm tắt tình trạng thiết bị, yêu cầu và bảo trì từ dữ liệu hiện có." />
      </div>
      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* User dashboard                                                      */
/* ------------------------------------------------------------------ */
function UserDashboard({ section = "Tổng quan" }) {
  const { data, offline, setData } = useDashboardData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const devices = data.devices.filter((item) => item.status === "available").filter((item) =>
    `${item.name} ${item.asset_code} ${item.category}`.toLowerCase().includes(search.toLowerCase())
  );

  async function borrow(device) {
    const purpose = window.prompt("Mục đích mượn thiết bị:", "Thực hành phòng thí nghiệm");
    if (!purpose) return;
    try {
      const item = await api.borrow(device.id, purpose);
      setData((current) => ({ ...current, requests: [...current.requests, item] }));
      setToast({ message: "Đã gửi yêu cầu mượn thành công", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu mượn khi API chưa khả dụng", type: "error" });
    }
  }

  async function returnBorrow(item) {
    try {
      const updated = await api.returnRequest(item.id);
      setData((current) => ({ ...current, requests: current.requests.map((row) => row.id === item.id ? updated : row) }));
      setToast({ message: "Đã ghi nhận trả thiết bị.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể ghi nhận trả thiết bị.", type: "error" });
    }
  }

  if (section !== "Tổng quan") return <><PageHeader eyebrow="Khu vực người sử dụng" title={section} description="Tra cứu thiết bị và theo dõi các lượt mượn của bạn." />{offline && <OfflineNotice />}<WorkspaceSection section={section} role="user" data={{ ...data, onReturn: returnBorrow }} onBorrow={borrow} /></>;

  const myPending = data.requests.filter((r) => r.status === "pending").length;
  const myBorrowed = data.requests.filter((r) => r.status === "borrowed").length;
  const myReturned = data.requests.filter((r) => r.status === "returned").length;

  return (
    <>
      <PageHeader
        eyebrow="Khu vực người sử dụng"
        title={`Xin chào, ${user?.full_name || "người dùng phòng lab"}`}
        description="Sẵn sàng cho phiên làm việc tiếp theo của bạn."
      />
      {offline && <OfflineNotice />}

      <Card className="mb-6 flex items-center gap-3 p-3">
        <Search size={19} className="ml-2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm thiết bị theo tên, mã hoặc nhóm..."
          className="h-10 flex-1 bg-transparent text-sm outline-none"
        />
        <Badge tone="slate">{devices.length} thiết bị</Badge>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang mượn" value={myBorrowed} icon={Package} />
        <KPICard label="Chờ duyệt" value={myPending} icon={ClipboardCheck} tone="amber" />
        <KPICard label="Đã trả" value={myReturned} icon={CheckCircle2} tone="green" />
        <KPICard label="Thiết bị khả dụng" value={data.devices.filter((item) => item.status === "available").length} icon={Cpu} tone="blue" />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <SectionTitle title="Thiết bị khả dụng" />
        {devices.length ? <div className="grid gap-3 md:grid-cols-2">
          {devices.map((device) => (
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 hover:shadow-sm" key={device.id}>
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600"><Cpu size={17} /></div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-700">{device.name}</p>
                <p className="mt-1 text-xs text-slate-400">{device.asset_code} • <StatusBadge status={device.status} /></p>
              </div>
              <Button size="sm" onClick={() => borrow(device)}>Mượn</Button>
            </div>
          ))}
        </div> : <Empty text="Hiện chưa có thiết bị khả dụng." />}
      </Card>

      <div className="mt-6">
        <AIChatPanel title="Trợ lý AI" starter="Xin chào! Tôi có thể giúp tra cứu hướng dẫn sử dụng, quy trình an toàn và thông tin thiết bị." />
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Technician dashboard                                                */
/* ------------------------------------------------------------------ */
function TechnicianDashboard({ section = "Tổng quan" }) {
  const { data, offline, setData } = useDashboardData();
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  async function complete(item) {
    try {
      await api.completeMaintenance(item.id);
      setToast({ message: "Đã hoàn thành công việc bảo trì", type: "success" });
      setData((current) => ({ ...current, maintenance: current.maintenance.map((row) => row.id === item.id ? { ...row, status: "completed" } : row) }));
    } catch {
      setToast({ message: "Không thể cập nhật qua API", type: "error" });
    }
  }

  if (section !== "Tổng quan") return <><PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />{offline && <OfflineNotice />}<WorkspaceSection section={section} role="technician" data={data} onComplete={complete} /></>;

  const openItems = data.maintenance.filter((item) => item.status !== "completed");
  const completedItems = data.maintenance.filter((item) => item.status === "completed");
  const deviceCount = new Set(openItems.map((item) => item.device_id)).size;

  return (
    <>
      <PageHeader
        eyebrow="Khu vực kỹ thuật"
        title={`Xin chào, ${user?.full_name || "kỹ thuật viên"}`}
        description="Theo dõi các công việc kiểm tra và bảo trì cần xử lý."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang bảo trì" value={openItems.length} icon={Wrench} />
        <KPICard label="Đã hoàn thành" value={completedItems.length} icon={CheckCircle2} tone="green" />
        <KPICard label="Thiết bị liên quan" value={deviceCount} icon={Cpu} tone="blue" />
        <KPICard label="Tổng bản ghi" value={data.maintenance.length} icon={ClipboardCheck} tone="amber" />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <SectionTitle title="Danh sách công việc cần làm" />
        {openItems.length ? (
          openItems.map((item) => (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0" key={item.id}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-brand"><Settings2 size={17} /></div>
              <span className="flex-1 text-sm font-semibold">Thiết bị #{item.device_id} • {item.kind}</span>
              <StatusBadge status={item.status} />
              <Button size="sm" variant="success" onClick={() => complete(item)}>Hoàn thành</Button>
            </div>
          ))
        ) : (
          <Empty text="Không có công việc bảo trì từ API." />
        )}
      </Card>

      <div className="mt-6">
        <AIChatPanel title="AI Inspection Alert" mode="inspection_alert" starter="Bạn có thể hỏi về đề xuất kiểm tra. Tôi sẽ nêu rõ giới hạn nếu dữ liệu chưa đủ." />
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared components                                                   */
/* ------------------------------------------------------------------ */
function RequestList({ items, onApprove, onReject, onReturn }) {
  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3" key={item.id}>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-brand"><ClipboardCheck size={16} /></div>
          <span className="min-w-0 flex-1 text-sm"><span className="font-semibold text-slate-700">Thiết bị #{item.device_id}</span><span className="mt-1 block truncate text-xs text-slate-400">{item.purpose || `Yêu cầu #${item.id}`}</span></span>
          <StatusBadge status={item.status} />
          {item.status === "pending" && onApprove && <Button size="sm" onClick={() => onApprove(item)}>Duyệt</Button>}
          {item.status === "pending" && onReject && <Button size="sm" variant="danger" onClick={() => onReject(item)}>Từ chối</Button>}
          {item.status === "borrowed" && onReturn && <Button size="sm" variant="outline" onClick={() => onReturn(item)}>Trả thiết bị</Button>}
        </div>
      ))}
    </div>
  );
}

function UsageChart({ usage = {} }) {
  const data = Object.entries(usage);
  const actionLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", borrowed: "Đang mượn", returned: "Đã trả", rejected: "Từ chối" };
  if (!data.length) return <Empty text="Chưa có dữ liệu lịch sử sử dụng." />;
  const max = Math.max(...data.map(([, count]) => Number(count)), 1);
  return (
    <div className="space-y-5">
      {data.map(([name, count]) => (
        <div key={name}>
          <div className="mb-2 flex justify-between text-xs">
            <span className="font-semibold text-slate-600">{actionLabels[name] || name}</span>
            <span className="text-slate-400">{count} lượt</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${(Number(count) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function AIChatPanel({ title, starter, mode = "chat" }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: starter }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send(event) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;
    const next = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const result = await api.chat(message, messages.slice(-12), mode);
      setMessages([...next, { role: "assistant", content: `${result.answer}${result.sources?.length ? `\n\nNguồn: ${result.sources.join(", ")}` : ""}` }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "AI hiện không kết nối được. Hãy thử lại sau hoặc dùng tài liệu vận hành nội bộ." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-red-50 text-brand"><Bot size={19} /></div>
        <div>
          <h2 className="text-sm font-bold">{title}</h2>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Đang sẵn sàng
          </p>
        </div>
      </div>
      <div className="max-h-72 space-y-3 overflow-y-auto bg-slate-50/60 p-5">
        {messages.map((item, index) => (
          <div
            key={index}
            className={item.role === "user"
              ? "ml-auto max-w-[85%] rounded-xl bg-brand px-4 py-3 text-sm leading-6 text-white"
              : "max-w-[90%] whitespace-pre-line rounded-xl bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-sm"}
          >
            {item.content}
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> AI đang xử lý...
          </div>
        )}
      </div>
      <form className="flex gap-2 border-t border-slate-100 bg-white p-4" onSubmit={send}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về thiết bị, quy trình hoặc an toàn..." disabled={loading} />
        <Button type="submit" disabled={loading || !input.trim()} aria-label="Gửi câu hỏi"><ArrowRight size={16} /></Button>
      </form>
    </Card>
  );
}

function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const dragging = React.useRef(false);
  const moved = React.useRef(false);

  function start(event) {
    event.preventDefault();
    dragging.current = true;
    moved.current = false;
    const origin = { x: event.clientX, y: event.clientY };
    const initial = position;
    function move(next) {
      if (!dragging.current) return;
      const deltaX = next.clientX - origin.x;
      const deltaY = next.clientY - origin.y;
      if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) moved.current = true;
      const margin = 20;
      const size = 56;
      const minX = -(window.innerWidth - margin * 2 - size);
      const minY = -(window.innerHeight - margin * 2 - size);
      setPosition({
        x: Math.max(minX, Math.min(0, initial.x + deltaX)),
        y: Math.max(minY, Math.min(0, initial.y + deltaY)),
      });
    }
    function stop() {
      dragging.current = false;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
    }
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  }

  return (
    <div className="fixed bottom-5 right-5 z-40" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      {open && (
        <div className="mb-3 w-[min(360px,calc(100vw-2rem))]">
          <AIChatPanel title="Trợ lý AI" starter="Tôi đang ở đây để hỗ trợ vận hành phòng thí nghiệm." />
        </div>
      )}
      <button
        onPointerDown={start}
        onClick={() => { if (!moved.current) setOpen((value) => !value); }}
        className="grid h-14 w-14 touch-none cursor-grab place-items-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition hover:bg-brand-dark active:cursor-grabbing"
        aria-label="Mở trợ lý AI"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}

export default App;

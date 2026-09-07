import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Bot, CheckCircle2, ClipboardCheck, Cpu, FileText,
  LayoutDashboard, LogOut, Menu, Package, Plus, Search, Settings2, ShieldCheck, Users, Wrench, X, Zap,
  Activity, CalendarClock, ChevronRight, CircleDot, Clock, Database, Eye, EyeOff, Gauge, HardDrive, Info, KeyRound,
  Loader2, Lock, Mail, MapPin, RefreshCw, Server, Shield, Sparkles, Tag, User as UserIcon, Wifi,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Toast } from "./components/ui";
import { api, clearSession, fallbackData, login } from "./lib/api";

/* ------------------------------------------------------------------ */
/* Roles & navigation                                                  */
/* ------------------------------------------------------------------ */
const roles = {
  admin: { label: "Lab Manager", initials: "LM", name: "Nguyễn Minh Anh", path: "/admin" },
  user: { label: "Lab User", initials: "NU", name: "Nguyễn Hoàng Nam", path: "/user" },
  technician: { label: "Maintenance Technician", initials: "KT", name: "Trần Minh Kỹ", path: "/technician" },
};

const navItems = {
  admin: [
    ["Dashboard", LayoutDashboard],
    ["Users", Users],
    ["Devices", Cpu],
    ["Maintenance", Wrench],
    ["Requests", ClipboardCheck],
    ["Reports", BarChart3],
    ["AI Assistant", Bot],
  ],
  user: [
    ["Dashboard", LayoutDashboard],
    ["Devices", Cpu],
    ["My Borrows", Package],
    ["AI Chat", Bot],
  ],
  technician: [
    ["Dashboard", LayoutDashboard],
    ["Maintenance", Wrench],
    ["History", ClipboardCheck],
    ["AI Alert", AlertTriangle],
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

  async function signIn(username, password, demoRole) {
    try {
      const loggedIn = await login(username, password);
      setUser(loggedIn);
      localStorage.setItem("lab_user", JSON.stringify(loggedIn));
      localStorage.setItem("lab_role", loggedIn.role);
      return loggedIn;
    } catch (error) {
      const demo = { id: 0, username, full_name: roles[demoRole].name, role: demoRole, is_active: true };
      setUser(demo);
      localStorage.setItem("lab_user", JSON.stringify(demo));
      localStorage.setItem("lab_role", demoRole);
      return demo;
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
  const [role, setRole] = useState("admin");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("local-demo");
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
    const account = await signIn(username, password, role);
    if (!localStorage.getItem("lab_token")) setNotice("API chưa khả dụng. Đang dùng dữ liệu demo cục bộ.");
    setBusy(false);
    navigate(roles[account.role].path);
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#08090c] lg:grid lg:grid-cols-[1.05fr_.95fr]">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] rounded-full bg-brand/25 blur-[120px]" />
        <div className="absolute right-[-12rem] top-1/3 h-[30rem] w-[30rem] rounded-full bg-[#3b82f6]/15 blur-[120px]" />
        <div className="absolute bottom-[-14rem] left-1/3 h-[32rem] w-[32rem] rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.035)_1px,transparent_0)] bg-[size:26px_26px]" />
      </div>

      {/* Left brand panel */}
      <section className="relative z-10 hidden flex-col justify-between overflow-hidden p-14 text-white lg:flex">
        <div><Logo light /></div>
        <div className="mt-28 max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.22em] text-brand/90 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Lab Control Center
          </p>
          <h1 className="mt-7 text-5xl font-extrabold leading-[1.04] tracking-tight">
            Một nơi tin cậy cho mọi thiết bị phòng thí nghiệm.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-400">
            Theo dõi tài sản, lịch mượn trả, bảo trì và khai thác AI có kiểm soát trong một không gian thống nhất.
          </p>
        </div>
        <div className="grid max-w-md grid-cols-3 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/10">
          {[["45", "Thiết bị"], ["98%", "Sẵn sàng"], ["24/7", "Theo dõi"]].map(([value, label]) => (
            <div key={label} className="bg-[#0e1015]/80 p-5 backdrop-blur-xl">
              <p className="text-3xl font-extrabold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Right login form */}
      <section className="relative z-10 flex min-h-[100dvh] items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Card className="rounded-[2.25rem] border border-white/10 bg-white/[0.04] p-1.5 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            <div className="rounded-[1.85rem] bg-[#0c0e13]/95 p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] sm:p-10">
              <div className="mb-8 lg:hidden"><Logo light /></div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">Lab Control Center</p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white">Đăng nhập hệ thống</h1>
              <p className="mt-2 text-sm leading-6 text-slate-400">API thật được ưu tiên. Khi offline, dashboard vẫn có demo an toàn.</p>

              <form className="mt-9 space-y-5" onSubmit={submit}>
                <label className="block text-sm font-semibold text-slate-300">
                  Username
                  <div className="relative mt-2">
                    <UserIcon size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-11 text-white placeholder:text-slate-500 focus:border-brand/70"
                      placeholder="Nhập tên đăng nhập"
                      required
                    />
                  </div>
                </label>

                <label className="block text-sm font-semibold text-slate-300">
                  Mật khẩu
                  <div className="relative mt-2">
                    <Lock size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <Input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 rounded-2xl border-white/10 bg-white/5 pl-11 pr-12 text-white placeholder:text-slate-500 focus:border-brand/70"
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

                <label className="block text-sm font-semibold text-slate-300">
                  Vai trò
                  <div className="relative mt-2">
                    <Shield size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="h-12 w-full appearance-none rounded-2xl border border-white/10 bg-white/5 pl-11 pr-10 text-sm text-white outline-none transition focus:border-brand/70"
                    >
                      {Object.entries(roles).map(([key, item]) => (
                        <option key={key} value={key} className="bg-[#0c0e13]">{item.label}</option>
                      ))}
                    </select>
                    <ChevronRight size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rotate-90 text-slate-500" />
                  </div>
                </label>

                {notice && (
                  <p className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-300">{notice}</p>
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

              <div className="mt-9 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Tài khoản demo</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  {Object.entries(roles).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setRole(key); setUsername(key); }}
                      className={`rounded-xl border px-2 py-2 text-xs transition ${role === key ? "border-brand/60 bg-brand/10 text-white" : "border-white/10 text-slate-400 hover:border-white/25 hover:text-white"}`}
                    >
                      <span className="block font-bold">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] text-slate-500">{key}</span>
                    </button>
                  ))}
                </div>
              </div>

              <p className="mt-9 text-center text-xs text-slate-500">PoC local • Không gửi dữ liệu ra bên ngoài</p>
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
  const [active, setActive] = useState(0);
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
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-slate-400">Workspace</p>
          <nav className="mt-3 space-y-1">
            {navItems[role].map(([label, Icon], index) => (
              <a
                key={label}
                href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
                onClick={() => { setActive(index); setMobileOpen(false); }}
                className={`side-link w-full ${active === index ? "active" : ""}`}
              >
                <Icon size={17} />
                <span>{label}</span>
                {label.startsWith("AI") && <span className="ml-auto h-2 w-2 rounded-full bg-brand" />}
              </a>
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
            <span>Operations overview</span>
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
          {role === "admin" ? <AdminDashboard /> : role === "user" ? <UserDashboard /> : <TechnicianDashboard />}
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
        <p className={`text-[9px] font-bold uppercase tracking-[.2em] ${light ? "text-slate-400" : "text-slate-400"}`}>Equipment OS</p>
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
      <p className="mt-5 text-3xl font-bold tracking-tight text-ink">{value}</p>
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
      <span>API tạm thời không khả dụng. Hiển thị dữ liệu mẫu; thao tác mới sẽ được giữ ở giao diện.</span>
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

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */
function useDashboardData() {
  const [data, setData] = useState(fallbackData);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([api.devices(), api.requests(), api.maintenance(), api.stats()]).then((results) => {
      const next = { ...fallbackData };
      ["devices", "requests", "maintenance", "stats"].forEach((key, i) => {
        if (results[i].status === "fulfilled") next[key] = results[i].value;
      });
      setOffline(results.some((result) => result.status === "rejected"));
      setData(next);
      setLoading(false);
    });
  }, []);

  return { data, offline, loading, setData };
}

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */
function AdminDashboard() {
  const { data, offline } = useDashboardData();
  const [toast, setToast] = useState(null);

  const pendingCount = data.requests.filter((r) => r.status === "pending").length;
  const availableCount = data.devices.filter((d) => d.status === "available").length;

  return (
    <>
      <PageHeader
        eyebrow="Admin workspace"
        title="Good morning, Minh Anh"
        description="Đây là tổng quan vận hành phòng thí nghiệm hôm nay."
        action={<Button><Plus size={16} /> Thêm thiết bị</Button>}
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
          <SectionTitle title="Yêu cầu gần đây" action={<Button variant="ghost" size="sm">Xem tất cả <ChevronRight size={14} /></Button>} />
          {data.requests.length ? <RequestList items={data.requests} /> : <Empty text="Chưa có yêu cầu mượn." />}
        </Card>
        <Card className="p-5 sm:p-6">
          <SectionTitle title="Tần suất sử dụng" />
          <UsageChart />
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
function UserDashboard() {
  const { data, offline, setData } = useDashboardData();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  const devices = data.devices.filter((item) =>
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
      setData((current) => ({ ...current, requests: [...current.requests, { id: Date.now(), device_id: device.id, purpose, status: "pending" }] }));
      setToast({ message: "API không khả dụng, yêu cầu đã lưu ở giao diện", type: "info" });
    }
  }

  const myPending = data.requests.filter((r) => r.status === "pending").length;

  return (
    <>
      <PageHeader
        eyebrow="Lab user workspace"
        title="Xin chào, Hoàng Nam"
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
        <KPICard label="Đang mượn" value="2" icon={Package} />
        <KPICard label="Chờ duyệt" value={myPending} icon={ClipboardCheck} tone="amber" />
        <KPICard label="Đã trả" value="5" icon={CheckCircle2} tone="green" />
        <KPICard label="Tài liệu có sẵn" value="12" icon={FileText} tone="blue" />
      </div>

      <Card className="mt-6 p-5 sm:p-6">
        <SectionTitle title="Thiết bị khả dụng" />
        <div className="grid gap-3 md:grid-cols-2">
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
        </div>
      </Card>

      <div className="mt-6">
        <AIChatPanel title="AI Lab Assistant" starter="Xin chào! Tôi có thể giúp tra cứu hướng dẫn sử dụng, quy trình an toàn và thông tin thiết bị." />
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Technician dashboard                                                */
/* ------------------------------------------------------------------ */
function TechnicianDashboard() {
  const { data, offline, setData } = useDashboardData();
  const [toast, setToast] = useState(null);

  async function complete(item) {
    try {
      await api.completeMaintenance(item.id);
      setToast({ message: "Đã hoàn thành công việc bảo trì", type: "success" });
    } catch {
      setToast({ message: "Không thể cập nhật qua API", type: "error" });
    }
    setData((current) => ({ ...current, maintenance: current.maintenance.filter((row) => row.id !== item.id) }));
  }

  const openItems = data.maintenance.filter((item) => item.status !== "completed");

  return (
    <>
      <PageHeader
        eyebrow="Maintenance workspace"
        title="Maintenance board"
        description="Theo dõi các công việc kiểm tra và bảo trì cần xử lý."
        action={<Button><Wrench size={16} /> Tạo công việc</Button>}
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang bảo trì" value={openItems.length} icon={Wrench} />
        <KPICard label="Chờ kiểm tra" value={data.stats.maintenance_open} icon={ClipboardCheck} tone="amber" />
        <KPICard label="Đã hoàn thành" value="12" icon={CheckCircle2} tone="green" />
        <KPICard label="Cảnh báo AI" value="1" icon={AlertTriangle} />
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
function RequestList({ items }) {
  return (
    <div className="space-y-3">
      {items.slice(0, 5).map((item) => (
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3" key={item.id}>
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-50 text-brand"><ClipboardCheck size={16} /></div>
          <span className="flex-1 text-sm">Request #{item.id} • Device #{item.device_id}</span>
          <StatusBadge status={item.status} />
        </div>
      ))}
    </div>
  );
}

function UsageChart() {
  const data = [["Oscilloscope", 86], ["Nguồn DC", 72], ["Multimeter", 61], ["Arduino Kit", 48]];
  return (
    <div className="space-y-5">
      {data.map(([name, percent]) => (
        <div key={name}>
          <div className="mb-2 flex justify-between text-xs">
            <span className="font-semibold text-slate-600">{name}</span>
            <span className="text-slate-400">{percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${percent}%` }} />
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
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Local AI assistant
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

  function start(event) {
    dragging.current = true;
    const origin = { x: event.clientX, y: event.clientY };
    const initial = position;
    function move(next) {
      if (dragging.current) setPosition({ x: initial.x + next.clientX - origin.x, y: initial.y + next.clientY - origin.y });
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
          <AIChatPanel title="Floating AI Assistant" starter="Tôi đang ở đây để hỗ trợ vận hành phòng lab." />
        </div>
      )}
      <button
        onPointerDown={start}
        onClick={() => setOpen((value) => !value)}
        className="grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-xl shadow-brand/30 transition hover:bg-brand-dark"
        aria-label="Mở trợ lý AI"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}

export default App;
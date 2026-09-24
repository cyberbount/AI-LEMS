import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Bot, CheckCircle2, ClipboardCheck, Cpu,
  LayoutDashboard, LogOut, Menu, Package, Search, Settings2, Users, Wrench, X, Zap,
  Eye, EyeOff, Loader2, Lock, User as UserIcon, Sun, Moon, KeyRound, ShieldCheck, FileText,
  FileDown, Printer, Copy, Check, Filter, Sparkles, QrCode, ExternalLink, Edit2, Trash2,
  Key, RefreshCw, CheckCheck, RotateCcw, UserPlus, UserX,
} from "lucide-react";
import { Badge, Button, Card, Input, Modal, Select, Toast } from "./components/ui";
import { api, clearSession, fallbackData, login, googleLogin } from "./lib/api";

/* ------------------------------------------------------------------ */
/* Vietnamese normalization helper for deep search                     */
/* ------------------------------------------------------------------ */
function removeVietnameseTones(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
}

/* ------------------------------------------------------------------ */
/* Report export utilities                                             */
/* ------------------------------------------------------------------ */
function downloadReportTXT(stats, devices = [], requests = [], maintenance = []) {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN");

  let content = `=====================================================\n`;
  content += `           BÁO CÁO VẬN HÀNH PHÒNG THÍ NGHIỆM LYXLAB\n`;
  content += `=====================================================\n`;
  content += `Thời gian xuất báo cáo : ${timeStr} - ${dateStr}\n`;
  content += `Hệ thống                : LyxLab Enterprise AI-LEMS\n`;
  content += `Phân loại              : Báo cáo quản lý thiết bị định kỳ\n\n`;

  content += `--- 1. CHỈ SỐ VẬN HÀNH CHÍNH (KPI) ---\n`;
  content += `* Tổng số thiết bị trong hệ thống : ${stats?.devices ?? devices.length}\n`;
  content += `* Tổng số lượt yêu cầu mượn       : ${stats?.requests ?? requests.length}\n`;
  content += `* Bản ghi bảo trì đang mở         : ${stats?.maintenance_open ?? maintenance.filter((m) => m.status !== "completed").length}\n`;
  content += `* Tổng số tài khoản người dùng    : ${stats?.users ?? "—"}\n\n`;

  content += `--- 2. TẦN SUẤT SỬ DỤNG THEO THAO TÁC ---\n`;
  if (stats?.usage_by_action && Object.keys(stats.usage_by_action).length > 0) {
    const actionLabels = { pending: "Chờ duyệt", approved: "Đã duyệt", borrowed: "Đang mượn", returned: "Đã trả", rejected: "Từ chối" };
    Object.entries(stats.usage_by_action).forEach(([key, val]) => {
      content += `* ${actionLabels[key] || key}: ${val} lượt\n`;
    });
  } else {
    content += `Chưa có bản ghi thống kê hành động.\n`;
  }

  content += `\n--- 3. DANH SÁCH THIẾT BỊ PHÒNG LAB ---\n`;
  devices.forEach((d, i) => {
    content += `${i + 1}. [${d.asset_code}] ${d.name} | Nhóm: ${d.category} | Trạng thái: ${d.status}\n`;
  });

  content += `\n=====================================================\n`;
  content += `      BÁO CÁO XUẤT TỰ ĐỘNG TỪ HỆ THỐNG QUẢN LÝ LYXLAB\n`;
  content += `=====================================================\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Bao_cao_van_hanh_LyxLab_${now.toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printReportPDF() {
  window.print();
}

/* ------------------------------------------------------------------ */
/* Theme context & provider                                            */
/* ------------------------------------------------------------------ */
const ThemeContext = createContext({
  theme: "light",
  setTheme: () => {},
  toggleTheme: () => {},
  isDark: false,
});
export const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("lyxlab_theme") || "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("lyxlab_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

function ThemeToggle({ className = "", compact = false }) {
  const { theme, setTheme } = useTheme();

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className={`inline-flex items-center justify-center h-9 w-9 rounded-xl border border-border bg-surface text-foreground hover:bg-surface-elevated transition shadow-sm ${className}`}
        aria-label={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
        title={theme === "dark" ? "Chuyển sang chế độ Sáng" : "Chuyển sang chế độ Tối"}
      >
        {theme === "dark" ? (
          <Sun size={16} className="text-amber-400" />
        ) : (
          <Moon size={16} className="text-slate-600" />
        )}
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Chọn giao diện sáng hoặc tối"
      className={`inline-flex items-center p-1 rounded-xl border border-border bg-surface shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        aria-pressed={theme === "light"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
          theme === "light"
            ? "bg-blue-600 text-white shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Bật giao diện sáng"
      >
        <Sun size={13} className={theme === "light" ? "text-amber-200" : "text-slate-400"} />
        <span>Sáng</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        aria-pressed={theme === "dark"}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
          theme === "dark"
            ? "bg-slate-800 text-slate-100 shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Bật giao diện tối"
      >
        <Moon size={13} className={theme === "dark" ? "text-amber-300" : "text-slate-400"} />
        <span>Tối</span>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Brand Logo component (Prominent & readable)                          */
/* ------------------------------------------------------------------ */
function BrandLogo({ variant, compact = false, className = "" }) {
  const { isDark } = useTheme();
  
  const getSrc = () => {
    if (compact) return "/brand/lyxlab-icon.svg";
    if (variant === "dark") return "/brand/lyxlab-horizontal-dark.svg";
    if (variant === "light") return "/brand/lyxlab-horizontal-light.svg";
    if (variant === "monochrome") return "/brand/lyxlab-horizontal-monochrome.svg";
    return isDark ? "/brand/lyxlab-horizontal-dark.svg" : "/brand/lyxlab-horizontal-light.svg";
  };
  
  return (
    <div className="flex items-center">
      <img 
        src={getSrc()} 
        alt="LyxLab Logo" 
        className={`object-contain transition-all duration-200 shrink-0 ${className}`} 
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Roles & navigation                                                  */
/* ------------------------------------------------------------------ */
const roles = {
  admin: { label: "Quản lý phòng lab", initials: "QL", name: "Quản lý phòng lab", path: "/admin" },
  user: { label: "Người sử dụng", initials: "NS", name: "Người dùng", path: "/user" },
  technician: { label: "Kỹ thuật viên", initials: "KT", name: "Kỹ thuật viên", path: "/technician" },
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
  reserved: { label: "Đã duyệt / Chờ nhận", tone: "blue" },
  borrowed: { label: "Đang mượn", tone: "amber" },
  maintenance: { label: "Đang bảo trì", tone: "red" },
  pending: { label: "Chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "blue" },
  rejected: { label: "Từ chối", tone: "red" },
  returned: { label: "Đã hoàn trả", tone: "green" },
  open: { label: "Đang mở", tone: "amber" },
  completed: { label: "Hoàn thành", tone: "green" },
  replace_full: { label: "Phải thay thế mới", tone: "red" },
  replace_partial: { label: "Thay thế một phần", tone: "amber" },
};

export const RESEARCH_CATEGORIES = [
  { value: "Mạch nhúng & Vi điều khiển", label: "Mạch nhúng & Vi điều khiển (ESP32, STM32, Arduino, Pi...)" },
  { value: "Thiết bị đo lường & Cấp nguồn", label: "Thiết bị đo lường & Cấp nguồn (Oscilloscope, VOM, Nguồn DC...)" },
  { value: "Thiết bị hàn khò & Sửa chữa", label: "Thiết bị hàn khò & Sửa chữa (Trạm hàn, Máy khò, Kính hiển vi...)" },
  { value: "Linh kiện thụ động (Capacitor, Resistor)", label: "Linh kiện thụ động (Tụ điện, Điện trở, Cuộn cảm...)" },
  { value: "Bán dẫn & Quang điện tử (Diode, LED, IC)", label: "Bán dẫn & Quang điện tử (Diode, LED, Transistor, IC...)" },
  { value: "Cảm biến & Module chức năng", label: "Cảm biến & Module chức năng (Cảm biến nhiệt/ẩm, Relay, LoRa...)" },
  { value: "Dụng cụ cơ khí & Phụ trợ Lab", label: "Dụng cụ cơ khí & Phụ trợ Lab (Breadboard, Kìm bấm cos, Que đo...)" },
  { value: "Khác", label: "Khác (Nhập tùy chỉnh...)" },
];

export const DEVICE_CONDITIONS = [
  { value: "Mới nguyên hộp", label: "Mới nguyên hộp (Brand New / In-box)", tone: "green" },
  { value: "Đã qua sử dụng - Hoạt động tốt", label: "Đã qua sử dụng - Hoạt động tốt (Used - Good)", tone: "blue" },
  { value: "Cũ - Cần bảo dưỡng định kỳ", label: "Cũ - Cần bảo dưỡng định kỳ (Fair - Needs Maintenance)", tone: "amber" },
  { value: "Hỏng hóc / Lỗi phần cứng", label: "Hỏng hóc / Lỗi phần cứng (Damaged / Faulty)", tone: "red" },
];

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

/* ------------------------------------------------------------------ */
/* Auth provider                                                       */
/* ------------------------------------------------------------------ */
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("lab_user") || "null"));

  async function signIn(identifier, password) {
    const loggedIn = await login(identifier, password);
    setUser(loggedIn);
    localStorage.setItem("lab_user", JSON.stringify(loggedIn));
    localStorage.setItem("lab_role", loggedIn.role);
    return loggedIn;
  }

  async function signInWithGoogle(idToken) {
    const loggedIn = await googleLogin(idToken);
    setUser(loggedIn);
    localStorage.setItem("lab_user", JSON.stringify(loggedIn));
    localStorage.setItem("lab_role", loggedIn.role);
    return loggedIn;
  }

  function updateUser(updated) {
    setUser(updated);
    localStorage.setItem("lab_user", JSON.stringify(updated));
  }

  function signOut() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, signIn, signInWithGoogle, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/:role" element={<Protected />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

function Protected() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user || !roles[user.role]) return <Navigate to="/login" replace />;

  const expectedPath = roles[user.role]?.path;
  if (location.pathname !== expectedPath) {
    return <Navigate to={expectedPath} replace />;
  }

  return <DashboardLayout role={user.role} />;
}

/* ------------------------------------------------------------------ */
/* Production Login Page                                               */
/* ------------------------------------------------------------------ */
function Login() {
  const navigate = useNavigate();
  const { user, signIn, signInWithGoogle } = useAuth();
  const { isDark } = useTheme();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (user && roles[user.role]) {
      navigate(roles[user.role].path, { replace: true });
    }
  }, [user, navigate]);

  // Load and initialize real Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    function handleGoogleCallback(response) {
      if (!response?.credential) return;
      setGoogleBusy(true);
      setNotice("");
      signInWithGoogle(response.credential)
        .then((account) => {
          navigate(roles[account.role].path);
        })
        .catch((err) => {
          setNotice(err.message || "Tài khoản Google chưa được cấp phép trong hệ thống phòng lab.");
        })
        .finally(() => {
          setGoogleBusy(false);
        });
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCallback,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script tag if unmounted
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId, navigate, signInWithGoogle]);

  function triggerGoogleLogin() {
    setNotice("");
    if (!googleClientId) {
      setNotice(
        "Chưa cấu hình Google Client ID (VITE_GOOGLE_CLIENT_ID). Vui lòng thêm Client ID từ Google Cloud Console vào biến môi trường để kích hoạt đăng nhập Google Workspace."
      );
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    } else {
      setNotice("Đang tải dịch vụ xác thực Google, vui lòng thử lại sau vài giây...");
    }
  }

  async function submit(event) {
    if (event) event.preventDefault();
    setNotice("");

    if (!identifier.trim()) {
      setNotice("Vui lòng nhập tên đăng nhập hoặc email.");
      return;
    }
    if (!password) {
      setNotice("Vui lòng nhập mật khẩu.");
      return;
    }

    setBusy(true);
    try {
      const account = await signIn(identifier.trim(), password);
      navigate(roles[account.role].path);
    } catch (error) {
      if (error.status === 403) {
        setNotice(error.message || "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Người quản lý phòng lab.");
      } else {
        setNotice("Tên đăng nhập hoặc mật khẩu không chính xác.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1.1fr_.9fr] relative overflow-hidden font-sans transition-colors duration-200 bg-background text-foreground">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top right theme toggle */}
      <div className="absolute top-5 right-5 z-20">
        <ThemeToggle className="shadow-lg border-border" />
      </div>

      {/* Left brand panel */}
      <section className="relative hidden flex-col justify-between p-14 backdrop-blur-xl lg:flex overflow-hidden border-r border-border bg-slate-900 text-white">
        <BrandLogo variant="dark" className="h-16 w-auto" />

        <div className="mt-16 max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-950/60 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-blue-400 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span>AI-Augmented Lab Equipment System</span>
          </div>

          <h1 className="text-5xl font-black leading-[1.12] tracking-tight text-white break-words">
            Quản lý vòng đời thiết bị phòng Lab chính xác.
          </h1>

          <p className="max-w-md text-sm leading-relaxed text-slate-300 break-words">
            Hệ thống quản lý chuẩn hóa tài sản phòng thí nghiệm, kiểm soát mượn trả, phân công bảo trì định kỳ và trợ lý AI tra cứu SOP.
          </p>
        </div>

        <div className="max-w-md border-l-2 border-blue-500/80 pl-4 text-xs leading-relaxed text-slate-400 break-words">
          <p className="font-semibold text-slate-300">Bảo mật & Giám sát dữ liệu:</p>
          <p>Xác thực tập trung phía máy chủ (Server-side Authentication), phân quyền RBAC và kiểm soát truy cập nghiêm ngặt.</p>
        </div>
      </section>

      {/* Right login form */}
      <section className="flex min-h-[100dvh] items-center justify-center p-5 sm:p-8 relative z-10 overflow-y-auto">
        <div className="w-full max-w-md my-auto">
          <div className="rounded-3xl border border-border p-7 sm:p-9 shadow-2xl backdrop-blur-xl transition-colors bg-surface text-foreground">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <BrandLogo className="h-14 w-auto" />
            </div>

            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">XÁC THỰC TRUY CẬP</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">Đăng nhập hệ thống</h2>
            <p className="mt-1 text-xs text-muted-foreground">Vui lòng đăng nhập để truy cập tài nguyên phòng lab.</p>

            {/* Real Google Workspace SSO Button */}
            <div className="mt-5">
              <button
                type="button"
                onClick={triggerGoogleLogin}
                disabled={googleBusy || busy}
                className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface-elevated hover:bg-muted text-foreground text-xs font-semibold transition-all flex items-center justify-center gap-2.5 shadow-sm disabled:opacity-50"
              >
                {googleBusy ? (
                  <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin text-blue-600" /> Đang xác thực với Google...</span>
                ) : (
                  <>
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Đăng nhập với Google Workspace</span>
                  </>
                )}
              </button>
            </div>

            <div className="relative my-5 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
              <span className="relative bg-surface px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Hoặc tài khoản phòng lab</span>
            </div>

            {/* Standard Credential Form */}
            <form className="space-y-4" onSubmit={submit}>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Tên đăng nhập hoặc Email</label>
                <div className="relative">
                  <UserIcon size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none transition-all"
                    placeholder="Nhập username hoặc email..."
                    required
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-foreground mb-1.5">Mật khẩu</label>
                <div className="relative">
                  <Lock size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:border-blue-600 focus:outline-none transition-all"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu..."
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {notice && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-3 text-xs break-words">
                  {notice}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {busy ? (
                  <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin" /> Đang xác thực...</span>
                ) : (
                  <>
                    <span>Đăng nhập hệ thống</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>

            <p className="mt-5 text-center text-[10px] text-muted-foreground">
              LyxLab Enterprise System • Bảo mật RBAC & Xác thực tập trung
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */
function DashboardLayout({ role }) {
  const { signOut, user, updateUser } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [active, setActive] = useState("Tổng quan");
  const [passwordModal, setPasswordModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [toast, setToast] = useState(null);
  const profile = roles[role] || roles.admin;

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-border bg-surface p-5 transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <BrandLogo className="h-12 w-auto" />
          <button className="text-muted-foreground hover:text-foreground lg:hidden" onClick={() => setMobileOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 flex-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-[.18em] text-muted-foreground">Khu vực làm việc</p>
          <nav className="mt-3 space-y-1">
            {navItems[role].map(([label, Icon]) => (
              <button
                key={label}
                type="button"
                onClick={() => { setActive(label); setMobileOpen(false); }}
                className={`side-link w-full ${active === label ? "active" : ""}`}
              >
                <Icon size={17} className="shrink-0" />
                <span className="truncate">{label}</span>
                {label.includes("AI") && <span className="ml-auto h-2 w-2 rounded-full bg-blue-500 animate-pulse shrink-0" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-4">
          <div className="rounded-xl border border-border bg-surface-elevated p-3 overflow-hidden">
            <button 
              type="button" 
              onClick={() => setProfileModal(true)}
              className="flex items-center gap-3 w-full text-left transition hover:opacity-80"
              title="Xem và chỉnh sửa hồ sơ cá nhân"
            >
              <div className="avatar shrink-0">{profile.initials}</div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-bold text-foreground">{user?.full_name || profile.name}</p>
                <p className="truncate text-xs text-muted-foreground">{profile.label}</p>
              </div>
            </button>
            <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5 text-xs">
              <button 
                type="button"
                onClick={() => setPasswordModal(true)} 
                className="flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition truncate"
              >
                <KeyRound size={13} className="shrink-0" /> Đổi MK
              </button>
              <button 
                type="button"
                onClick={signOut} 
                className="flex items-center gap-1 font-semibold text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 transition shrink-0"
              >
                <LogOut size={13} className="shrink-0" /> Thoát
              </button>
            </div>
          </div>
        </div>
      </aside>

      {mobileOpen && <button className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}

      {/* Main Content Area */}
      <div className="lg:pl-64 min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-surface/90 px-4 sm:px-8 backdrop-blur">
          <button className="rounded-lg p-2 text-muted-foreground hover:bg-surface-elevated hover:text-foreground lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="lg:hidden"><BrandLogo compact /></div>
          <div className="hidden text-sm sm:block truncate">
            <span className="font-bold text-foreground">{new Date().toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}</span>
            <span className="mx-2 text-muted-foreground font-bold">/</span>
            <span className="font-semibold text-foreground">Tổng quan vận hành phòng lab</span>
          </div>
          <div className="ml-auto flex items-center gap-2.5 sm:gap-3">
            <ThemeToggle />
            <button className="relative rounded-lg p-2 text-muted-foreground transition hover:bg-surface-elevated hover:text-foreground" aria-label="Thông báo">
              <Bell size={19} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600" />
            </button>
            <button 
              type="button"
              onClick={() => setProfileModal(true)} 
              className="avatar cursor-pointer hover:ring-2 hover:ring-blue-500/40 transition shrink-0"
              title="Hồ sơ cá nhân"
            >
              {profile.initials}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1440px] p-4 sm:p-7 overflow-x-hidden">
          {role === "admin" ? <AdminDashboard section={active} onNavigate={setActive} /> : role === "user" ? <UserDashboard section={active} onNavigate={setActive} /> : <TechnicianDashboard section={active} onNavigate={setActive} />}
        </main>
      </div>

      <PasswordModal 
        open={passwordModal} 
        onClose={() => setPasswordModal(false)} 
        onSuccess={(msg) => setToast({ message: msg, type: "success" })} 
      />

      <ProfileModal
        open={profileModal}
        onClose={() => setProfileModal(false)}
        user={user}
        onUpdateUser={(updated) => {
          updateUser(updated);
          setToast({ message: "Đã cập nhật hồ sơ cá nhân!", type: "success" });
        }}
        onOpenPasswordModal={() => setPasswordModal(true)}
      />

      <FloatingAssistant />
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  );
}

function PageHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="min-w-0 flex-1">
        <p className="page-eyebrow">{eyebrow}</p>
        <h1 className="page-title truncate">{title}</h1>
        <p className="page-desc break-words">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function KPICard({ label, value, icon: Icon, tone = "blue", hint }) {
  const tones = {
    red: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
  };
  return (
    <Card hover className="p-5 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${tones[tone] || tones.blue}`}><Icon size={19} /></div>
        {hint && <span className="text-[11px] font-semibold text-muted-foreground truncate">{hint}</span>}
      </div>
      <p className="mt-4 text-3xl font-extrabold tracking-tight text-foreground truncate">{value ?? "—"}</p>
      <p className="mt-1 text-sm font-semibold text-muted-foreground truncate">{label}</p>
    </Card>
  );
}

function SectionTitle({ title, action }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-2">
      <h2 className="text-base font-bold text-foreground truncate">{title}</h2>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

function OfflineNotice() {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300 break-words">
      <AlertTriangle size={16} className="shrink-0" />
      <span>API tạm thời không khả dụng. Đang hiển thị dữ liệu mẫu; thao tác nghiệp vụ mới sẽ không được ghi nhận.</span>
    </div>
  );
}

function Empty({ text }) {
  return <p className="empty-state">{text}</p>;
}

function StatusBadge({ status }) {
  const meta = statusMeta[status] || { label: status, tone: "slate" };
  return <Badge tone={meta.tone} dot className="whitespace-nowrap shrink-0">{meta.label}</Badge>;
}

function ConditionBadge({ condition }) {
  const meta = {
    "Mới nguyên hộp": { tone: "green", label: "Mới nguyên hộp" },
    "Đã qua sử dụng - Hoạt động tốt": { tone: "blue", label: "Hoạt động tốt" },
    "Cũ - Cần bảo dưỡng định kỳ": { tone: "amber", label: "Cần bảo dưỡng" },
    "Hỏng hóc / Lỗi phần cứng": { tone: "red", label: "Hỏng hóc" },
  };
  const item = meta[condition] || { tone: "slate", label: condition || "Bình thường" };
  return <Badge tone={item.tone} dot className="whitespace-nowrap shrink-0">{item.label}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Workspace Section                                                   */
/* ------------------------------------------------------------------ */
function WorkspaceSection({ section, role, data, onBorrow, onComplete, onSchedule, onDownloadReportTXT, onPrintReportPDF, onNavigate }) {
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
    <Card className="p-5 sm:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <SectionTitle title={title} />
          <p className="-mt-2 text-sm text-slate-500 dark:text-slate-400 break-words">{description}</p>
        </div>
        {(section === "Báo cáo" || (role === "technician" && section === "Lịch sử")) && (
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDownloadReportTXT(data.stats, data.devices, data.requests, data.maintenance)}>
              <FileDown size={14} /> Xuất .TXT
            </Button>
            <Button size="sm" variant="outline" onClick={onPrintReportPDF}>
              <Printer size={14} /> In / Xuất PDF
            </Button>
          </div>
        )}
        {section === "Bảo trì" && role === "technician" && onSchedule && (
          <Button size="sm" onClick={onSchedule}>+ Lên lịch / Thêm tác vụ</Button>
        )}
      </div>

      {section === "Thiết bị" && (
        data.devices.length ? <div className="grid gap-3 md:grid-cols-2">{data.devices.map((item) => (
          <div key={item.id} className="flex items-center gap-3 rounded-xl border border-border p-3.5 bg-surface hover:bg-surface-elevated/40 transition min-w-0">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Cpu size={17} /></div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-foreground">{item.name}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-mono">{item.asset_code}</span>
                <span>•</span>
                <span className="truncate max-w-[120px]">{item.category}</span>
                <span>•</span>
                <ConditionBadge condition={item.condition} />
                <StatusBadge status={item.status} />
              </div>
            </div>
            {role === "user" && item.status === "available" && <Button size="sm" onClick={() => onBorrow(item)} className="shrink-0">Mượn</Button>}
          </div>
        ))}</div> : <Empty text="Chưa có thiết bị từ API." />
      )}
      {(section === "Yêu cầu mượn" || section === "Lượt mượn của tôi") && (data.requests.length ? <RequestList items={data.requests} role={role} onReturn={role === "user" ? data.onReturn : undefined} onHandover={data.onHandover} /> : <Empty text="Chưa có yêu cầu mượn." />)}
      {(section === "Bảo trì" || section === "Lịch sử") && (maintenanceItems.length ? maintenanceItems.map((item) => (
        <div key={item.id} className="flex flex-wrap items-center gap-3 border-b border-border py-4 last:border-0 min-w-0">
          <Settings2 size={17} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-foreground truncate">Thiết bị #{item.device_id} • {item.kind}</span>
          <StatusBadge status={item.status} />
          {role === "technician" && item.status !== "completed" && <Button size="sm" variant="outline" onClick={() => onComplete(item)} className="shrink-0">Cập nhật</Button>}
        </div>
      )) : <Empty text="Chưa có bản ghi bảo trì từ API." />)}
      {(section === "Báo cáo" || (role === "technician" && section === "Lịch sử")) && (
        <>
          <UsageChart usage={data.stats.usage_by_action} />
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col">
              <KPICard label="Thiết bị" value={data.stats.devices} icon={Cpu} />
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("Thiết bị")}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  Xem chi tiết thiết bị <ArrowRight size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-col">
              <KPICard label="Yêu cầu" value={data.stats.requests} icon={Package} tone="blue" />
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate(role === "user" ? "Lượt mượn của tôi" : "Yêu cầu mượn")}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                >
                  Xem chi tiết yêu cầu <ArrowRight size={13} />
                </button>
              )}
            </div>
            <div className="flex flex-col">
              <KPICard label="Bảo trì mở" value={data.stats.maintenance_open} icon={Wrench} tone="amber" />
              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate("Bảo trì")}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
                >
                  Xem chi tiết bảo trì <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </>
      )}
      {section === "Người dùng" && <Empty text="Chưa có dữ liệu người dùng từ API." />}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Section (Full User CRUD: Add, Edit, Reset, Lock, Delete)     */
/* ------------------------------------------------------------------ */
function AdminSection({ 
  section, 
  data, 
  onRequestStatus, 
  onHandover,
  onReturnDevice,
  onRecallDevice,
  onOpenDeviceForm, 
  onDeviceStatus, 
  onOpenUserForm,
  onOpenEditUser,
  onOpenResetPassword,
  onToggleUserActive,
  onDeleteUser,
  deviceSearch,
  setDeviceSearch,
  deviceStatusFilter,
  setDeviceStatusFilter,
  onDownloadReportTXT,
  onPrintReportPDF,
  onNavigate,
}) {
  if (section === "Trợ lý AI") return <AIChatPanel title="Trợ lý AI" mode="summary" starter="Tôi có thể tóm tắt tình trạng thiết bị, yêu cầu mượn và bảo trì từ dữ liệu hiện có." />;
  
  if (section === "Người dùng") return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <SectionTitle title="Quản lý tài khoản người dùng" />
          <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400">Thêm, sửa, xóa, khóa tài khoản và đặt lại mật khẩu cho thành viên.</p>
        </div>
        <Button size="sm" onClick={onOpenUserForm} className="shrink-0">
          <UserPlus size={15} /> Thêm tài khoản mới
        </Button>
      </div>

      {data.users?.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[760px]">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Họ tên</th>
                <th className="px-5 py-3">Tên đăng nhập</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Vai trò</th>
                <th className="px-5 py-3">Trạng thái</th>
                <th className="px-5 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((item) => (
                <tr className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/40" key={item.id}>
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{item.full_name}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 font-mono text-xs truncate max-w-[140px]">{item.username}</td>
                  <td className="px-5 py-3.5 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[180px]">{item.email || "—"}</td>
                  <td className="px-5 py-3.5">{roles[item.role]?.label || item.role}</td>
                  <td className="px-5 py-3.5">
                    <Badge tone={item.is_active ? "green" : "red"} dot>
                      {item.is_active ? "Đang hoạt động" : "Đã khóa"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenEditUser(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800 dark:hover:text-blue-400 transition"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenResetPassword(item)}
                        className="p-1.5 rounded-lg text-slate-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-slate-800 dark:hover:text-amber-400 transition"
                        title="Đặt lại mật khẩu"
                      >
                        <Key size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onToggleUserActive(item)}
                        className={`p-1.5 rounded-lg transition ${
                          item.is_active 
                            ? "text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400" 
                            : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800"
                        }`}
                        title={item.is_active ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                      >
                        <UserX size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUser(item)}
                        className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-slate-800 dark:hover:text-rose-400 transition"
                        title="Xóa tài khoản"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="Chưa có người dùng từ API." />
      )}
    </Card>
  );

  if (section === "Thiết bị") {
    const filteredDevices = data.devices.filter((item) => {
      const matchSearch = removeVietnameseTones(`${item.name} ${item.asset_code} ${item.category}`).includes(removeVietnameseTones(deviceSearch));
      const matchStatus = deviceStatusFilter === "all" || item.status === deviceStatusFilter;
      return matchSearch && matchStatus;
    });

    return (
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <SectionTitle title="Danh sách thiết bị" />
            <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400">Quản lý trạng thái và thông tin thiết bị trong phòng thí nghiệm.</p>
          </div>
          <Button size="sm" onClick={onOpenDeviceForm} className="shrink-0"><Package size={15} /> Thêm thiết bị</Button>
        </div>

        {/* Enhanced Search & Filter Bar */}
        <div className="p-4 border-b border-border bg-surface-elevated flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={deviceSearch}
              onChange={(e) => setDeviceSearch(e.target.value)}
              placeholder="Tìm theo tên máy, mã EQ-xxx, nhóm thiết bị..."
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 flex items-center gap-1 shrink-0"><Filter size={13} /> Trạng thái:</span>
            <Select 
              value={deviceStatusFilter} 
              onChange={(e) => setDeviceStatusFilter(e.target.value)} 
              className="h-10 w-36 text-xs"
            >
              <option value="all">Tất cả</option>
              <option value="available">Sẵn sàng</option>
              <option value="borrowed">Đang mượn</option>
              <option value="maintenance">Đang bảo trì</option>
              <option value="reserved">Đã duyệt / Chờ nhận</option>
            </Select>
          </div>
          <Badge tone="slate" className="shrink-0">{filteredDevices.length} kết quả</Badge>
        </div>

        {filteredDevices.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface-elevated text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Thiết bị</th>
                  <th className="px-5 py-3">Mã tài sản</th>
                  <th className="px-5 py-3">Nhóm thiết bị</th>
                  <th className="px-5 py-3">Tình trạng</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map((item) => (
                  <tr className="hover:bg-surface-elevated/50 transition" key={item.id}>
                    <td className="px-5 py-3.5 font-semibold text-foreground truncate max-w-[240px]">{item.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{item.asset_code}</td>
                    <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[160px]">{item.category}</td>
                    <td className="px-5 py-3.5">
                      <ConditionBadge condition={item.condition} />
                    </td>
                    <td className="px-5 py-3">
                      <Select value={item.status} onChange={(event) => onDeviceStatus(item, event.target.value)} className="h-9 min-w-36 text-xs">
                        {["available", "reserved", "borrowed", "maintenance"].map((status) => (
                          <option value={status} key={status}>{statusMeta[status].label}</option>
                        ))}
                      </Select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Không tìm thấy thiết bị phù hợp với điều kiện lọc." />
        )}
      </Card>
    );
  }

  if (section === "Yêu cầu mượn") return (
    <Card className="p-5 sm:p-6 overflow-hidden">
      <SectionTitle title="Quản lý duyệt & Bàn giao mượn trả" />
      {data.requests.length ? (
        <RequestList 
          items={data.requests} 
          role="admin"
          onApprove={(item) => onRequestStatus(item, "approved")} 
          onReject={(item) => onRequestStatus(item, "rejected")} 
          onHandover={onHandover}
          onReturn={onReturnDevice}
          onRecall={onRecallDevice}
        />
      ) : (
        <Empty text="Chưa có yêu cầu mượn." />
      )}
    </Card>
  );
  
  if (section === "Báo cáo") {
    return (
      <Card className="p-5 sm:p-6 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <SectionTitle title="Báo cáo vận hành phòng thí nghiệm" />
            <p className="-mt-3 text-sm text-slate-500 dark:text-slate-400">Số liệu được đồng bộ từ cơ sở dữ liệu và hoạt động mượn trả.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onDownloadReportTXT(data.stats, data.devices, data.requests, data.maintenance)}>
              <FileDown size={14} /> Xuất .TXT
            </Button>
            <Button size="sm" variant="outline" onClick={onPrintReportPDF}>
              <Printer size={14} /> In / Xuất PDF
            </Button>
          </div>
        </div>

        <UsageChart usage={data.stats.usage_by_action} />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col">
            <KPICard label="Tổng thiết bị" value={data.stats.devices} icon={Cpu} />
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("Thiết bị")}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
              >
                Xem chi tiết thiết bị <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <KPICard label="Yêu cầu mượn" value={data.stats.requests} icon={Package} tone="blue" />
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("Yêu cầu mượn")}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
              >
                Xem chi tiết yêu cầu <ArrowRight size={13} />
              </button>
            )}
          </div>
          <div className="flex flex-col">
            <KPICard label="Bảo trì đang mở" value={data.stats.maintenance_open} icon={Wrench} tone="amber" />
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate("Bảo trì")}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 transition"
              >
                Xem chi tiết bảo trì <ArrowRight size={13} />
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <WorkspaceSection 
      section={section} 
      role="admin" 
      data={data} 
      onDownloadReportTXT={onDownloadReportTXT}
      onPrintReportPDF={onPrintReportPDF}
      onNavigate={onNavigate}
    />
  );
}

function DeviceModal({ open, form, setForm, onClose, onSubmit }) {
  const [isCustomCategory, setIsCustomCategory] = useState(false);

  useEffect(() => {
    if (open) {
      const match = RESEARCH_CATEGORIES.some((c) => c.value === form.category);
      if (!form.category) {
        setForm((prev) => ({ ...prev, category: RESEARCH_CATEGORIES[0].value, condition: prev.condition || "Mới nguyên hộp" }));
        setIsCustomCategory(false);
      } else if (!match) {
        setIsCustomCategory(true);
      } else {
        setIsCustomCategory(false);
      }
    }
  }, [open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm thiết bị phòng thí nghiệm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={onSubmit} disabled={!form.asset_code || !form.name || !form.category}>
            Lưu thiết bị
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-foreground">
          Mã tài sản / Mã thiết bị
          <Input
            value={form.asset_code}
            onChange={(e) => setForm({ ...form, asset_code: e.target.value })}
            placeholder="Ví dụ: EQ-025, EMB-001..."
            className="mt-1.5"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Tên thiết bị
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Tên hiển thị của thiết bị (Model, thông số)"
            className="mt-1.5"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Nhóm thiết bị chuẩn nghiên cứu (Research Group)
          <Select
            value={isCustomCategory ? "Khác" : form.category}
            onChange={(e) => {
              if (e.target.value === "Khác") {
                setIsCustomCategory(true);
                setForm({ ...form, category: "" });
              } else {
                setIsCustomCategory(false);
                setForm({ ...form, category: e.target.value });
              }
            }}
            className="mt-1.5"
          >
            {RESEARCH_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </label>

        {isCustomCategory && (
          <label className="block text-sm font-semibold text-blue-600 dark:text-blue-400">
            Tên nhóm thiết bị tùy chỉnh
            <Input
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Nhập tên phân nhóm phòng lab..."
              className="mt-1.5"
              required
            />
          </label>
        )}

        <label className="block text-sm font-semibold text-foreground">
          Tình trạng ban đầu khi nhập kho
          <Select
            value={form.condition || "Mới nguyên hộp"}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
            className="mt-1.5"
          >
            {DEVICE_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
        </label>

        <label className="block text-sm font-semibold text-foreground">
          Số Serial / Mã nhà sản xuất
          <Input
            value={form.serial_number || ""}
            onChange={(e) => setForm({ ...form, serial_number: e.target.value })}
            placeholder="Có thể bỏ trống nếu không có serial"
            className="mt-1.5"
          />
        </label>
      </div>
    </Modal>
  );
}

function UserCreateModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!form.username || !form.password || !form.full_name) return;
    setBusy(true);
    setError("");
    try {
      await onSubmit(form);
      setForm({ username: "", full_name: "", email: "", password: "", role: "user" });
      onClose();
    } catch (err) {
      setError(err.message || "Không thể tạo tài khoản. Vui lòng kiểm tra lại thông tin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm tài khoản người dùng"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy || !form.username || !form.password || !form.full_name}>
            {busy ? "Đang tạo..." : "Tạo tài khoản"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-3 text-xs break-words">
            {error}
          </div>
        )}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Họ và tên
          <Input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            placeholder="Ví dụ: Lê Minh Trí"
            className="mt-1.5"
            required
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tên đăng nhập
            <Input
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().trim() })}
              placeholder="ví dụ: user_k23"
              className="mt-1.5"
              required
            />
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Vai trò cấp
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="mt-1.5"
            >
              <option value="user">Người sử dụng</option>
              <option value="technician">Kỹ thuật viên</option>
            </Select>
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value.trim() })}
            placeholder="ví dụ: user2@lab.local"
            className="mt-1.5"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu khởi tạo
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Nhập mật khẩu cho tài khoản"
            className="mt-1.5"
            required
          />
        </label>
      </form>
    </Modal>
  );
}

function UserEditModal({ open, user, onClose, onSave }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setIsActive(user.is_active ?? true);
      setError("");
    }
  }, [user, open]);

  async function submit(e) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setBusy(true);
    try {
      await onSave(user.id, { full_name: fullName.trim(), email: email.trim(), role, is_active: isActive });
      onClose();
    } catch (err) {
      setError(err.message || "Không thể cập nhật tài khoản.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Chỉnh sửa tài khoản: @${user?.username || ""}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy || !fullName.trim()}>
            {busy ? "Đang lưu..." : "Cập nhật tài khoản"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-3 text-xs break-words">
            {error}
          </div>
        )}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Họ và tên
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1.5"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Email
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Vai trò
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1.5"
            >
              <option value="user">Người sử dụng</option>
              <option value="technician">Kỹ thuật viên</option>
              <option value="admin">Quản lý phòng lab</option>
            </Select>
          </label>
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Trạng thái hoạt động
            <Select
              value={isActive ? "active" : "locked"}
              onChange={(e) => setIsActive(e.target.value === "active")}
              className="mt-1.5"
            >
              <option value="active">Đang hoạt động</option>
              <option value="locked">Đã khóa</option>
            </Select>
          </label>
        </div>
      </form>
    </Modal>
  );
}

function AdminResetPasswordModal({ open, user, onClose, onReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNewPassword("");
    setError("");
  }, [user, open]);

  async function submit(e) {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    setBusy(true);
    try {
      await onReset(user.id, newPassword);
      onClose();
    } catch (err) {
      setError(err.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Đặt lại mật khẩu cho: ${user?.full_name || ""}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy || newPassword.length < 8}>
            {busy ? "Đang xử lý..." : "Xác nhận đặt lại"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-3 text-xs break-words">
            {error}
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Bạn đang sử dụng quyền Quản lý phòng lab để đổi mật khẩu cho tài khoản <strong className="text-slate-800 dark:text-slate-200">@{user?.username}</strong>. Mật khẩu mới sẽ có hiệu lực ngay lập tức.
        </p>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu mới (tối thiểu 8 ký tự)
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Nhập mật khẩu mới..."
            className="mt-1.5"
            required
          />
        </label>
      </form>
    </Modal>
  );
}

function PasswordModal({ open, onClose, onSuccess }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Mật khẩu mới phải khác mật khẩu hiện tại.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await api.changePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      onSuccess("Đã đổi mật khẩu thành công!");
      onClose();
    } catch (err) {
      setError(err.message || "Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Đổi mật khẩu tài khoản"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Hủy</Button>
          <Button onClick={submit} disabled={busy || !currentPassword || !newPassword || !confirmPassword}>
            {busy ? "Đang lưu..." : "Cập nhật mật khẩu"}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 p-3 text-xs break-words">
            {error}
          </div>
        )}
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu hiện tại
          <Input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Nhập mật khẩu đang sử dụng"
            className="mt-1.5"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu mới
          <Input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Tối thiểu 8 ký tự"
            className="mt-1.5"
            required
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Xác nhận mật khẩu mới
          <Input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Nhập lại mật khẩu mới"
            className="mt-1.5"
            required
          />
        </label>
      </form>
    </Modal>
  );
}

function ProfileModal({ open, onClose, user, onUpdateUser, onOpenPasswordModal }) {
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setSaved(false);
    }
  }, [user, open]);

  function handleSave(e) {
    e.preventDefault();
    if (!fullName.trim()) return;
    const updated = { ...user, full_name: fullName.trim(), email: email.trim() };
    onUpdateUser(updated);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Hồ sơ tài khoản cá nhân"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
          <Button onClick={handleSave}>{saved ? "Đã lưu!" : "Lưu thay đổi"}</Button>
        </>
      }
    >
      <form onSubmit={handleSave} className="space-y-4">
        {saved && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 p-2.5 text-xs">
            Thông tin hồ sơ đã được cập nhật thành công!
          </div>
        )}
        <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-800/60 overflow-hidden">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-blue-600 text-base font-bold text-white shadow-md shadow-blue-500/20">
            {fullName ? fullName.slice(0, 2).toUpperCase() : "LX"}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <h4 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{fullName || "Người dùng"}</h4>
            <p className="font-mono text-xs text-slate-400 truncate">@{user?.username || "user"}</p>
            <div className="mt-1 flex items-center gap-2">
              <Badge tone="blue">{roles[user?.role]?.label || user?.role || "Thành viên"}</Badge>
              <Badge tone="green" dot>Hoạt động</Badge>
            </div>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Họ và tên hiển thị
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nhập họ và tên"
            className="mt-1.5"
            required
          />
        </label>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Địa chỉ Email
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@lab.local"
            className="mt-1.5"
          />
        </label>

        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/60 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">Bảo mật tài khoản</p>
            <p className="text-[11px] text-slate-400 truncate">Đổi mật khẩu bảo vệ quyền truy cập</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              onClose();
              onOpenPasswordModal();
            }}
            className="shrink-0"
          >
            <KeyRound size={13} /> Đổi mật khẩu
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Data hook                                                           */
/* ------------------------------------------------------------------ */
function useDashboardData(includeUsers = false) {
  const [data, setData] = useState(fallbackData);
  const [offline, setOffline] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    Promise.allSettled([api.devices(), api.requests(), api.maintenance(), api.stats(), includeUsers ? api.users() : Promise.resolve([])]).then((results) => {
      const next = { ...fallbackData };
      ["devices", "requests", "maintenance", "stats", "users"].forEach((key, i) => {
        if (results[i].status === "fulfilled") next[key] = results[i].value;
      });
      setOffline(results.slice(0, 4).some((result) => result.status === "rejected") || (includeUsers && results[4].status === "rejected"));
      setData(next);
      setLoading(false);
    });
  };

  useEffect(() => {
    refresh();
  }, []);

  return { data, offline, loading, setData, refresh };
}

/* ------------------------------------------------------------------ */
/* Real-time Equipment Quick Control Board (Đề tài 23)                */
/* ------------------------------------------------------------------ */
function EquipmentQuickControlBoard({ devices = [], onUpdateStatus, onNavigate }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const counts = useMemo(() => {
    return {
      all: devices.length,
      available: devices.filter((d) => d.status === "available").length,
      borrowed: devices.filter((d) => d.status === "borrowed").length,
      maintenance: devices.filter((d) => d.status === "maintenance" || (d.condition && (d.condition.includes("bảo dưỡng") || d.condition.includes("Hỏng")))).length,
    };
  }, [devices]);

  const filtered = useMemo(() => {
    return devices.filter((d) => {
      const matchFilter =
        filter === "all" ? true :
        filter === "available" ? d.status === "available" :
        filter === "borrowed" ? d.status === "borrowed" :
        filter === "maintenance" ? (d.status === "maintenance" || (d.condition && (d.condition.includes("bảo dưỡng") || d.condition.includes("Hỏng")))) : true;
      const matchSearch = removeVietnameseTones(`${d.name} ${d.asset_code} ${d.category} ${d.condition || ""}`).includes(removeVietnameseTones(search));
      return matchFilter && matchSearch;
    });
  }, [devices, filter, search]);

  return (
    <Card className="p-5 sm:p-6 overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-foreground">Bảng kiểm soát nhanh thiết bị hiện hành</h2>
            <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-0.5 text-xs font-semibold border border-blue-200/60 dark:border-blue-900/60">
              Đề tài 23 • Real-time
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Theo dõi tức thời tình trạng thiết bị sẵn sàng, đang mượn và thiết bị cảnh báo cần kiểm tra trong lab.
          </p>
        </div>
        {onNavigate && (
          <Button size="sm" variant="outline" onClick={() => onNavigate("Thiết bị")} className="shrink-0 text-xs">
            Quản lý toàn bộ kho máy <ArrowRight size={13} />
          </Button>
        )}
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4">
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-surface-elevated border border-border">
          <button
            type="button"
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${filter === "all" ? "bg-surface text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground"}`}
          >
            Tất cả ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setFilter("available")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${filter === "available" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 shadow-sm border border-emerald-300/50" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Sẵn sàng ({counts.available})
          </button>
          <button
            type="button"
            onClick={() => setFilter("borrowed")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${filter === "borrowed" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 shadow-sm border border-amber-300/50" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="h-2 w-2 rounded-full bg-amber-500" /> Đang mượn ({counts.borrowed})
          </button>
          <button
            type="button"
            onClick={() => setFilter("maintenance")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${filter === "maintenance" ? "bg-rose-50 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 shadow-sm border border-rose-300/50" : "text-muted-foreground hover:text-foreground"}`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Cảnh báo / Bảo dưỡng ({counts.maintenance})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tra cứu nhanh thiết bị..."
            className="pl-8 h-9 text-xs"
          />
        </div>
      </div>

      {/* Equipment Table */}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-left text-xs min-w-[700px]">
          <thead className="bg-surface-elevated text-muted-foreground uppercase tracking-wide">
            <tr>
              <th className="px-4 py-3 font-semibold">Mã thiết bị</th>
              <th className="px-4 py-3 font-semibold">Tên thiết bị</th>
              <th className="px-4 py-3 font-semibold">Nhóm thiết bị</th>
              <th className="px-4 py-3 font-semibold">Tình trạng máy</th>
              <th className="px-4 py-3 font-semibold">Trạng thái kho</th>
              <th className="px-4 py-3 text-right font-semibold">Chuyển trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {filtered.slice(0, 8).map((d) => (
              <tr key={d.id} className="hover:bg-surface-elevated/60 transition">
                <td className="px-4 py-3 font-mono font-bold text-foreground">{d.asset_code}</td>
                <td className="px-4 py-3 font-semibold text-foreground truncate max-w-[200px]" title={d.name}>{d.name}</td>
                <td className="px-4 py-3 text-muted-foreground truncate max-w-[160px]" title={d.category}>{d.category}</td>
                <td className="px-4 py-3">
                  <ConditionBadge condition={d.condition} />
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={d.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <Select
                    value={d.status}
                    onChange={(e) => onUpdateStatus && onUpdateStatus(d, e.target.value)}
                    className="h-8 text-[11px] min-w-32 py-0 inline-block"
                  >
                    {["available", "reserved", "borrowed", "maintenance"].map((st) => (
                      <option key={st} value={st}>{statusMeta[st]?.label || st}</option>
                    ))}
                  </Select>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                  Không có thiết bị nào theo điều kiện tìm kiếm.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Admin dashboard                                                     */
/* ------------------------------------------------------------------ */
function AdminDashboard({ section = "Tổng quan", onNavigate }) {
  const { data, offline, setData, refresh } = useDashboardData(true);
  const { user } = useAuth();
  const [toast, setToast] = useState(null);

  // Modals
  const [deviceModal, setDeviceModal] = useState(false);
  const [deviceForm, setDeviceForm] = useState({ 
    asset_code: "", 
    name: "", 
    category: RESEARCH_CATEGORIES[0].value, 
    condition: "Mới nguyên hộp", 
    serial_number: "" 
  });
  const [userModal, setUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [resetPwdModal, setResetPwdModal] = useState(false);

  // Filters
  const [deviceSearch, setDeviceSearch] = useState("");
  const [deviceStatusFilter, setDeviceStatusFilter] = useState("all");

  async function updateRequest(item, status) {
    try {
      const updated = await api.approveRequest(item.id, status);
      setData((current) => ({ ...current, requests: current.requests.map((row) => row.id === item.id ? updated : row) }));
      setToast({ message: status === "approved" ? "Đã duyệt yêu cầu mượn." : "Đã từ chối yêu cầu mượn.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật yêu cầu.", type: "error" });
    }
  }

  async function handoverRequest(item) {
    try {
      const updated = await api.handoverRequest(item.id);
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? { ...d, status: "borrowed" } : d),
      }));
      setToast({ message: "Đã xác nhận bàn giao thiết bị cho người mượn.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể bàn giao thiết bị.", type: "error" });
    }
  }

  async function returnDevice(item) {
    try {
      const updated = await api.returnRequest(item.id);
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? { ...d, status: "available" } : d),
      }));
      setToast({ message: "Đã xác nhận nhận trả và kiểm tra thiết bị thành công.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể xác nhận trả thiết bị.", type: "error" });
    }
  }

  async function recallDevice(item) {
    if (!window.confirm(`Bạn có chắc chắn muốn gửi yêu cầu thu hồi thiết bị #${item.device_id} ngay lập tức?`)) return;
    setToast({ message: `Đã phát yêu cầu thu hồi đối với thiết bị #${item.device_id}.`, type: "info" });
  }

  async function createDevice() {
    try {
      const created = await api.createDevice(deviceForm);
      setData((current) => ({ ...current, devices: [...current.devices, created] }));
      setDeviceForm({ asset_code: "", name: "", category: RESEARCH_CATEGORIES[0].value, condition: "Mới nguyên hộp", serial_number: "" });
      setDeviceModal(false);
      setToast({ message: "Đã thêm thiết bị mới vào kho.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể thêm thiết bị.", type: "error" });
    }
  }

  async function createUser(userPayload) {
    try {
      const created = await api.createUser(userPayload);
      setData((current) => ({ ...current, users: [...current.users, created] }));
      setToast({ message: `Đã tạo tài khoản cho ${created.full_name}`, type: "success" });
    } catch (error) {
      throw error;
    }
  }

  async function handleUpdateUser(userId, payload) {
    try {
      const updated = await api.updateUser(userId, payload);
      setData((current) => ({ ...current, users: current.users.map((u) => u.id === userId ? updated : u) }));
      setToast({ message: `Đã cập nhật thông tin cho ${updated.full_name}`, type: "success" });
    } catch (error) {
      throw error;
    }
  }

  async function handleResetPassword(userId, newPassword) {
    try {
      await api.resetUserPassword(userId, newPassword);
      setToast({ message: "Đã đặt lại mật khẩu mới cho thành viên thành công!", type: "success" });
    } catch (error) {
      throw error;
    }
  }

  async function handleToggleUserActive(targetUser) {
    try {
      const updated = await api.updateUser(targetUser.id, { is_active: !targetUser.is_active });
      setData((current) => ({ ...current, users: current.users.map((u) => u.id === targetUser.id ? updated : u) }));
      setToast({ message: updated.is_active ? `Đã mở khóa tài khoản @${updated.username}` : `Đã khóa tài khoản @${updated.username}`, type: "info" });
    } catch (error) {
      setToast({ message: error.message || "Không thể thay đổi trạng thái tài khoản.", type: "error" });
    }
  }

  async function handleDeleteUser(targetUser) {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản "${targetUser.full_name}" (@${targetUser.username}) không?`)) {
      return;
    }
    try {
      await api.deleteUser(targetUser.id);
      setData((current) => ({ ...current, users: current.users.filter((u) => u.id !== targetUser.id) }));
      setToast({ message: `Đã xóa tài khoản @${targetUser.username}`, type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể xóa tài khoản này.", type: "error" });
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

  const adminSection = section !== "Tổng quan" ? (
    <AdminSection 
      section={section} 
      data={data} 
      onRequestStatus={updateRequest} 
      onHandover={handoverRequest}
      onReturnDevice={returnDevice}
      onRecallDevice={recallDevice}
      onOpenDeviceForm={() => setDeviceModal(true)} 
      onDeviceStatus={updateDeviceStatus}
      onOpenUserForm={() => setUserModal(true)}
      onOpenEditUser={(target) => { setSelectedUser(target); setEditUserModal(true); }}
      onOpenResetPassword={(target) => { setSelectedUser(target); setResetPwdModal(true); }}
      onToggleUserActive={handleToggleUserActive}
      onDeleteUser={handleDeleteUser}
      deviceSearch={deviceSearch}
      setDeviceSearch={setDeviceSearch}
      deviceStatusFilter={deviceStatusFilter}
      setDeviceStatusFilter={setDeviceStatusFilter}
      onDownloadReportTXT={downloadReportTXT}
      onPrintReportPDF={printReportPDF}
      onNavigate={onNavigate}
    />
  ) : null;

  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực quản lý" title={section} description="Quản lý thiết bị, người dùng, yêu cầu và báo cáo kiểm toán." />
      {offline && <OfflineNotice />}
      {adminSection}
      <DeviceModal open={deviceModal} form={deviceForm} setForm={setDeviceForm} onClose={() => setDeviceModal(false)} onSubmit={createDevice} />
      <UserCreateModal open={userModal} onClose={() => setUserModal(false)} onSubmit={createUser} />
      <UserEditModal open={editUserModal} user={selectedUser} onClose={() => setEditUserModal(false)} onSave={handleUpdateUser} />
      <AdminResetPasswordModal open={resetPwdModal} user={selectedUser} onClose={() => setResetPwdModal(false)} onReset={handleResetPassword} />
      <Toast message={toast?.message} type={toast?.type} />
    </>
  );

  const pendingCount = data.requests.filter((r) => r.status === "pending").length;
  const availableCount = data.devices.filter((d) => d.status === "available").length;

  const currentRole = localStorage.getItem("lab_role") || "admin";
  const profileName = roles[currentRole]?.name || "Quản lý phòng lab";

  return (
    <>
      <PageHeader
        eyebrow="Khu vực quản lý"
        title={`Xin chào, ${user?.full_name || profileName}`}
        description="Tổng quan vận hành và thống kê tài nguyên phòng thí nghiệm."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Tổng thiết bị" value={data.stats.devices} icon={Cpu} hint={`${availableCount} sẵn sàng`} />
        <KPICard label="Yêu cầu mượn" value={data.stats.requests} icon={Package} tone="blue" hint={`${pendingCount} chờ duyệt`} />
        <KPICard label="Cần kiểm tra" value={data.stats.maintenance_open} icon={AlertTriangle} tone="amber" />
        <KPICard label="Người dùng" value={data.stats.users} icon={Users} tone="green" />
      </div>

      {/* Bảng kiểm soát nhanh thiết bị hiện hành (Đặc tả Đề tài 23) */}
      <div className="mt-6">
        <EquipmentQuickControlBoard 
          devices={data.devices} 
          onUpdateStatus={updateDeviceStatus} 
          onNavigate={onNavigate} 
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6 overflow-hidden">
          <SectionTitle title="Yêu cầu cần xử lý & Bàn giao" />
          {data.requests.length ? (
            <RequestList 
              items={data.requests} 
              role="admin"
              onApprove={(item) => updateRequest(item, "approved")} 
              onReject={(item) => updateRequest(item, "rejected")} 
              onHandover={handoverRequest}
              onReturn={returnDevice}
              onRecall={recallDevice}
            />
          ) : (
            <Empty text="Chưa có yêu cầu mượn." />
          )}
        </Card>
        <Card className="p-5 sm:p-6 overflow-hidden">
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
/* User dashboard (Clear Borrow & Return Flow)                         */
/* ------------------------------------------------------------------ */
function UserDashboard({ section = "Tổng quan", onNavigate }) {
  const { data, offline, setData } = useDashboardData();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState(null);

  const categories = useMemo(() => {
    const set = new Set(data.devices.map((d) => d.category).filter(Boolean));
    return ["all", ...Array.from(set)];
  }, [data.devices]);

  const filteredDevices = data.devices
    .filter((item) => item.status === "available")
    .filter((item) => {
      const matchSearch = removeVietnameseTones(`${item.name} ${item.asset_code} ${item.category}`).includes(removeVietnameseTones(search));
      const matchCategory = categoryFilter === "all" || item.category === categoryFilter;
      return matchSearch && matchCategory;
    });

  // Active loans for the current user
  const myActiveLoans = data.requests.filter((r) => r.status === "borrowed" || r.status === "approved");

  async function borrow(device) {
    const purpose = window.prompt("Mục đích mượn thiết bị:", "Thực hành phòng thí nghiệm");
    if (!purpose) return;
    try {
      const item = await api.borrow(device.id, purpose);
      setData((current) => ({ ...current, requests: [...current.requests, item] }));
      setToast({ message: "Đã gửi yêu cầu mượn thành công. Vui lòng chờ Quản lý duyệt.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu mượn khi API chưa khả dụng", type: "error" });
    }
  }

  async function handover(item) {
    try {
      const updated = await api.handoverRequest(item.id);
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? { ...d, status: "borrowed" } : d),
      }));
      setToast({ message: "Đã xác nhận nhận thiết bị thành công!", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể nhận thiết bị.", type: "error" });
    }
  }

  async function returnBorrow(item) {
    try {
      const updated = await api.returnRequest(item.id);
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? { ...d, status: "available" } : d),
      }));
      setToast({ message: "Đã ghi nhận hoàn trả thiết bị về kho an toàn.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể ghi nhận trả thiết bị.", type: "error" });
    }
  }

  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực người sử dụng" title={section} description="Tra cứu thiết bị và theo dõi các lượt mượn của bạn." />
      {offline && <OfflineNotice />}
      <WorkspaceSection 
        section={section} 
        role="user" 
        data={{ ...data, onReturn: returnBorrow, onHandover: handover }} 
        onBorrow={borrow} 
        onDownloadReportTXT={downloadReportTXT} 
        onPrintReportPDF={printReportPDF} 
        onNavigate={onNavigate}
      />
    </>
  );

  const myPending = data.requests.filter((r) => r.status === "pending").length;
  const myBorrowed = data.requests.filter((r) => r.status === "borrowed").length;
  const myReturned = data.requests.filter((r) => r.status === "returned").length;

  return (
    <>
      <PageHeader
        eyebrow="Khu vực người sử dụng"
        title={`Xin chào, ${user?.full_name || "người dùng phòng lab"}`}
        description="Theo dõi thiết bị đang giữ và đăng ký mượn thiết bị phục vụ thực hành."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang giữ / Sử dụng" value={myBorrowed} icon={Package} />
        <KPICard label="Chờ duyệt" value={myPending} icon={ClipboardCheck} tone="amber" />
        <KPICard label="Đã hoàn trả" value={myReturned} icon={CheckCircle2} tone="green" />
        <KPICard label="Thiết bị khả dụng" value={data.devices.filter((item) => item.status === "available").length} icon={Cpu} tone="blue" />
      </div>

      {/* PROMINENT: My Current Borrowed Devices Block with Return Action */}
      <Card className="mt-6 p-5 sm:p-6 border-2 border-blue-500/30 dark:border-blue-500/20 overflow-hidden">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
              <Package size={17} />
            </div>
            <h3 className="text-base font-bold text-foreground">Thiết bị tôi đang mượn & Chờ nhận</h3>
          </div>
          <Badge tone={myActiveLoans.length ? "blue" : "slate"}>{myActiveLoans.length} thiết bị</Badge>
        </div>

        {myActiveLoans.length ? (
          <div className="divide-y divide-border">
            {myActiveLoans.map((item) => {
              const dev = data.devices.find((d) => d.id === item.device_id) || {};
              return (
                <div key={item.id} className="py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-foreground truncate">
                      {dev.name || `Thiết bị #${item.device_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      Mã: {dev.asset_code || "—"} • Mục đích: {item.purpose}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={item.status} />
                    {item.status === "approved" && (
                      <Button size="sm" onClick={() => handover(item)}>
                        <CheckCheck size={14} /> Nhận máy
                      </Button>
                    )}
                    {item.status === "borrowed" && (
                      <Button size="sm" variant="outline" onClick={() => returnBorrow(item)} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60" title="Bấm để xác nhận hoàn trả thiết bị về phòng thí nghiệm">
                        <RotateCcw size={14} /> Hoàn trả thiết bị
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3">Bạn hiện không giữ hoặc chờ nhận thiết bị nào. Hãy chọn thiết bị khả dụng bên dưới để mượn.</p>
        )}
      </Card>

      {/* Enhanced Multi-criteria Search */}
      <Card className="mt-6 p-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm thiết bị theo tên, mã tài sản, nhóm..."
              className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0"><Filter size={13} /> Nhóm:</span>
            <Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="h-10 w-36 text-xs"
            >
              {categories.map((cat) => (
                <option value={cat} key={cat}>{cat === "all" ? "Tất cả nhóm" : cat}</option>
              ))}
            </Select>
          </div>
          <Badge tone="slate" className="shrink-0">{filteredDevices.length} thiết bị sẵn sàng</Badge>
        </div>
      </Card>

      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <SectionTitle title="Kho thiết bị sẵn sàng mượn" />
        {filteredDevices.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredDevices.map((device) => (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 min-w-0" key={device.id}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0"><Cpu size={17} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{device.name}</p>
                  <p className="mt-1 text-xs text-slate-400 truncate">{device.asset_code} • {device.category} • <StatusBadge status={device.status} /></p>
                </div>
                <Button size="sm" onClick={() => borrow(device)} className="shrink-0">Mượn</Button>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="Không tìm thấy thiết bị khả dụng phù hợp." />
        )}
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

function MaintenanceModal({ open, mode, item, devices, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({ device_id: "", notes: "", status: "open", kind: "inspection" });
  
  useEffect(() => {
    if (open) {
      if (mode === "create") {
        setForm({ device_id: devices[0]?.id || "", notes: "", status: "open", kind: "inspection" });
      } else if (item) {
        setForm({ device_id: item.device_id, notes: item.notes || "", status: item.status, kind: item.kind });
      }
    }
  }, [open, mode, item, devices]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {mode === "create" ? "Thêm mới / Lên lịch bảo trì" : "Cập nhật công việc bảo trì"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Thiết bị</label>
            <select
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={mode === "update"}
            >
              {devices.map(d => <option key={d.id} value={d.id}>#{d.id} - {d.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Trạng thái / Tác vụ</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="open">Lên lịch bảo trì (Đang mở)</option>
              <option value="replace_full">Phải thay thế mới</option>
              <option value="replace_partial">Thay thế một phần</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Nhập ghi chú chi tiết..."
            />
          </div>
          <div className="mt-6 flex justify-between gap-3">
            {mode === "update" ? (
              <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>Xóa</Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
              <Button size="sm" onClick={() => onSubmit(form)}>Lưu</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechnicianDashboard({ section = "Tổng quan", onNavigate }) {
  const { data, offline, setData } = useDashboardData();
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });

  async function handleSubmit(form) {
    try {
      if (modal.mode === "create") {
        await api.createMaintenance(form.device_id, form.notes, form.status, form.kind);
        setToast({ message: "Đã lưu tác vụ bảo trì", type: "success" });
      } else {
        await api.updateMaintenance(modal.item.id, { status: form.status, notes: form.notes });
        setToast({ message: "Đã cập nhật bảo trì", type: "success" });
      }
      const [devices, maintenance] = await Promise.all([api.devices(), api.maintenance()]);
      setData(current => ({ ...current, devices, maintenance }));
      setModal({ open: false, mode: 'create', item: null });
    } catch {
      setToast({ message: "Không thể cập nhật qua API", type: "error" });
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMaintenance(id);
      setToast({ message: "Đã xóa bản ghi", type: "success" });
      const maintenance = await api.maintenance();
      setData(current => ({ ...current, maintenance }));
      setModal({ open: false, mode: 'create', item: null });
    } catch {
      setToast({ message: "Không thể xóa qua API", type: "error" });
    }
  }

  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />
      {offline && <OfflineNotice />}
      <WorkspaceSection section={section} role="technician" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onSchedule={() => setModal({ open: true, mode: 'create', item: null })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />
      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
    </>
  );

  const openItems = data.maintenance.filter((item) => !["completed", "replace_full"].includes(item.status));
  const completedItems = data.maintenance.filter((item) => item.status === "completed");
  const replaceFullItems = data.maintenance.filter((item) => item.status === "replace_full");
  const replacePartialItems = data.maintenance.filter((item) => item.status === "replace_partial");
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
        <KPICard label="Đang bảo trì" value={openItems.length} icon={Wrench} tone="blue" />
        <KPICard label="Thay thế 1 phần" value={replacePartialItems.length} icon={Wrench} tone="amber" />
        <KPICard label="Phải thay thế mới" value={replaceFullItems.length} icon={AlertTriangle} tone="red" />
        <KPICard label="Đã hoàn thành" value={completedItems.length} icon={CheckCircle2} tone="green" />
      </div>

      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Danh sách công việc cần làm (Chỉ xem / Cập nhật nhanh)" />
        </div>
        {openItems.length ? (
          openItems.map((item) => (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800 min-w-0" key={item.id}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Settings2 size={17} /></div>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Thiết bị #{item.device_id} • {item.kind}</span>
              <StatusBadge status={item.status} />
              <Button size="sm" variant="outline" onClick={() => setModal({ open: true, mode: 'update', item })} className="shrink-0">Cập nhật</Button>
            </div>
          ))
        ) : (
          <Empty text="Không có công việc bảo trì từ API." />
        )}
      </Card>

      <div className="mt-6">
        <AIChatPanel title="AI Inspection Alert" mode="inspection_alert" starter="Bạn có thể hỏi về đề xuất kiểm tra. Tôi sẽ nêu rõ giới hạn nếu dữ liệu chưa đủ." />
      </div>

      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Request List                                                 */
/* ------------------------------------------------------------------ */
function RequestList({ items, onApprove, onReject, onHandover, onReturn, onRecall, role = "user" }) {
  const isManager = role === "admin" || role === "technician";
  return (
    <div className="space-y-3">
      {items.slice(0, 10).map((item) => (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3.5 min-w-0" key={item.id}>
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
              <ClipboardCheck size={16} />
            </div>
            <div className="min-w-0 flex-1 text-sm truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Thiết bị #{item.device_id}</span>
                <StatusBadge status={item.status} />
              </div>
              <span className="mt-1 block truncate text-xs font-medium text-muted-foreground">
                {item.purpose || `Yêu cầu #${item.id}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Action buttons matching exact business states */}
            {item.status === "pending" && onApprove && (
              <Button size="sm" onClick={() => onApprove(item)} className="shrink-0">Duyệt</Button>
            )}
            {item.status === "pending" && onReject && (
              <Button size="sm" variant="danger" onClick={() => onReject(item)} className="shrink-0">Từ chối</Button>
            )}
            {item.status === "approved" && onHandover && (
              <Button size="sm" onClick={() => onHandover(item)} className="shrink-0 bg-blue-600 text-white hover:bg-blue-500">
                <CheckCheck size={14} /> Bàn giao máy
              </Button>
            )}
            {item.status === "borrowed" && !isManager && onReturn && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => onReturn(item)} 
                className="shrink-0 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                title="Bấm để xác nhận hoàn trả thiết bị về phòng thí nghiệm"
              >
                <RotateCcw size={14} /> Hoàn trả thiết bị
              </Button>
            )}
            {item.status === "borrowed" && isManager && onReturn && (
              <Button 
                size="sm" 
                onClick={() => onReturn(item)} 
                className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm"
                title="Quản lý xác nhận nhận lại và kiểm tra tình trạng máy"
              >
                <CheckCircle2 size={14} /> Xác nhận nhận trả & Kiểm tra
              </Button>
            )}
            {item.status === "borrowed" && isManager && onRecall && (
              <Button 
                size="sm" 
                variant="danger" 
                onClick={() => onRecall(item)} 
                className="shrink-0"
                title="Gửi yêu cầu thu hồi thiết bị về lab"
              >
                <AlertTriangle size={14} /> Thu hồi
              </Button>
            )}
          </div>
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
    <div className="space-y-4">
      {data.map(([name, count]) => (
        <div key={name}>
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="font-semibold text-foreground truncate">{actionLabels[name] || name}</span>
            <span className="font-medium text-muted-foreground shrink-0">{count} lượt</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div className="h-full rounded-full bg-blue-600 dark:bg-blue-500 transition-all duration-700" style={{ width: `${(Number(count) / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition shrink-0"
      title="Sao chép nội dung"
    >
      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
    </button>
  );
}

function AIChatPanel({ title, starter, mode = "chat" }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: starter, grounded: false, sources: [] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);

  const promptSuggestions = [
    { label: "⚡ An toàn điện SOP-01", text: "Quy trình xử lý sự cố rò rỉ điện hoặc chập cháy trong phòng lab?" },
    { label: "🔍 Máy hiện sóng SOP-02", text: "Hướng dẫn vận hành và cài đặt que đo máy hiện sóng Tektronix TBS1102B?" },
    { label: "🔋 Nguồn DC SOP-03", text: "Cách thiết lập giới hạn dòng Current Limit trên nguồn DC Keysight E3631A?" },
    { label: "📋 Quy định mượn trả SOP-04", text: "Quy định bàn giao và kiểm tra hoàn trả thiết bị phòng lab?" },
  ];

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  function stopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  function resetChat() {
    stopGeneration();
    setMessages([{ role: "assistant", content: starter, grounded: false, sources: [] }]);
  }

  async function send(queryText) {
    const message = (typeof queryText === "string" ? queryText : input).trim();
    if (!message || loading) return;
    const next = [...messages, { role: "user", content: message }];
    setMessages(next);
    setInput("");
    setLoading(true);
    abortControllerRef.current = new AbortController();
    try {
      const cleanHistory = messages
        .filter((m) => m && m.content && String(m.content).trim() && (m.role === "user" || m.role === "assistant"))
        .map((m) => ({ role: m.role, content: String(m.content).trim() }))
        .slice(-10);
      const result = await api.chat(message, cleanHistory, mode, abortControllerRef.current.signal);
      setMessages([...next, { 
        role: "assistant", 
        content: result.answer, 
        grounded: result.grounded, 
        sources: result.sources || [] 
      }]);
    } catch (err) {
      console.error("AIChat error:", err);
      if (err.name === "AbortError") {
        setMessages([...next, { role: "assistant", content: "Đã dừng tạo phản hồi theo yêu cầu của bạn.", grounded: false, sources: [] }]);
      } else {
        const errorDetail = err.status === 401 
          ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại để sử dụng AI."
          : (err.message || "AI hiện không kết nối được. Hãy thử lại sau hoặc dùng tài liệu vận hành nội bộ.");
        setMessages([...next, { role: "assistant", content: `⚠️ ${errorDetail}`, grounded: false, sources: [] }]);
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  }

  return (
    <Card className="overflow-hidden bg-surface border border-border shadow-card">
      <div className="flex items-center justify-between border-b border-border p-4 sm:p-5 bg-surface">
        <div className="flex items-center gap-3 min-w-0">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Bot size={19} /></div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">{title}</h2>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 truncate">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" /> Trực tuyến • Local Ollama
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={resetChat}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-elevated transition"
            title="Làm mới / Bắt đầu lại cuộc trò chuyện"
          >
            <RotateCcw size={14} />
          </button>
          <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200/50 dark:border-blue-900/50">
            <ShieldCheck size={13} /> RAG Grounded
          </span>
        </div>
      </div>

      {/* Quick Prompt Chips */}
      <div className="px-4 py-2.5 bg-surface-elevated border-b border-border flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-semibold text-muted-foreground shrink-0 flex items-center gap-1"><Sparkles size={12} /> Hỏi nhanh:</span>
        {promptSuggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => send(item.text)}
            className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated text-foreground border border-border transition text-[11px] font-medium shrink-0 shadow-sm"
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="max-h-80 space-y-3.5 overflow-y-auto bg-surface-elevated p-4 sm:p-5">
        {messages.map((item, index) => (
          <div
            key={index}
            className={item.role === "user"
              ? "ml-auto max-w-[85%] rounded-xl bg-blue-600 px-4 py-3 text-sm leading-6 text-white shadow-sm break-words"
              : "max-w-[92%] whitespace-pre-line rounded-xl bg-surface px-4 py-3.5 text-sm leading-6 text-foreground shadow-sm border border-border break-words"}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">{item.content}</div>
              {item.role === "assistant" && <CopyButton text={item.content} />}
            </div>
            {item.sources && item.sources.length > 0 && (
              <div className="mt-2.5 pt-2 border-t border-border flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="font-semibold text-muted-foreground">Nguồn trích dẫn:</span>
                {item.sources.map((src, i) => (
                  <span key={i} className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 font-medium text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:border-blue-900/60 dark:text-blue-300 truncate max-w-[280px]">
                    <FileText size={11} className="shrink-0" /> <span className="truncate">{src}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="flex items-center justify-between gap-2 rounded-xl bg-surface px-4 py-3 text-sm text-muted-foreground border border-border">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="animate-spin text-blue-500" /> AI đang phân tích dữ liệu & trích xuất SOP...
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={stopGeneration}
              className="text-xs border-rose-300 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 h-7 px-2.5 shrink-0"
            >
              <X size={12} /> Dừng phản hồi
            </Button>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="flex gap-2 border-t border-border bg-surface p-3.5 sm:p-4" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về thiết bị, quy trình an toàn SOP..." disabled={loading} className="flex-1" />
        {loading ? (
          <Button type="button" variant="outline" onClick={stopGeneration} className="shrink-0 border-rose-400 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-xs">
            <X size={14} /> Dừng
          </Button>
        ) : (
          <Button type="submit" disabled={!input.trim()} aria-label="Gửi câu hỏi" className="shrink-0"><ArrowRight size={16} /></Button>
        )}
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
    dragging.current = true;
    moved.current = false;
    const origin = { x: event.clientX, y: event.clientY };
    const initial = position;
    function move(next) {
      if (!dragging.current) return;
      const deltaX = next.clientX - origin.x;
      const deltaY = next.clientY - origin.y;
      if (Math.abs(deltaX) > 6 || Math.abs(deltaY) > 6) moved.current = true;
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

  function handleToggle() {
    if (!moved.current) {
      setOpen((value) => !value);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-40" style={{ transform: `translate(${position.x}px, ${position.y}px)` }}>
      {open && (
        <div className="mb-3 w-[min(400px,calc(100vw-2rem))] shadow-2xl rounded-2xl bg-surface border border-border overflow-hidden">
          <AIChatPanel title="Trợ lý AI LyxLab" starter="Tôi đang ở đây để hỗ trợ tra cứu quy trình và thiết bị phòng lab." />
        </div>
      )}
      <button
        type="button"
        onPointerDown={start}
        onClick={handleToggle}
        className="grid h-14 w-14 touch-none cursor-pointer place-items-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-500 active:cursor-grabbing focus:outline-none"
        aria-label="Mở trợ lý AI"
      >
        <Bot size={24} />
      </button>
    </div>
  );
}

export default App;

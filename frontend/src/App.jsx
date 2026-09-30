import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate, useLocation } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, Bell, Bot, CheckCircle2, ClipboardCheck, Cpu,
  LayoutDashboard, LogOut, Menu, Package, Search, Settings2, Users, Wrench, X, Zap,
  Eye, EyeOff, Loader2, Lock, User as UserIcon, Sun, Moon, KeyRound, ShieldCheck, FileText,
  FileDown, Printer, Copy, Check, Filter, Sparkles, QrCode, ExternalLink, Edit2, Trash2,
  Key, RefreshCw, CheckCheck, RotateCcw, UserPlus, UserX,
  Activity, TrendingUp, Clock, ArrowUpRight, PieChart, Calendar,
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

function downloadAuditLogsTXT(logs = [], title = "NHẬT KÝ KIỂM TOÁN HỆ THỐNG", filename = "Nhat_ky_kiem_toan") {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN");

  let content = `=====================================================\n`;
  content += `           ${title.toUpperCase()}\n`;
  content += `=====================================================\n`;
  content += `Thời gian xuất : ${timeStr} - ${dateStr}\n`;
  content += `Tổng số bản ghi: ${logs.length}\n\n`;

  if (!logs.length) {
    content += `Chưa có bản ghi nhật ký nào.\n`;
  } else {
    logs.forEach((log, i) => {
      const d = new Date(log.created_at).toLocaleString("vi-VN");
      content += `[${i + 1}] ${d} | @${log.username} (${log.user_role}) | ${log.action} | ${log.target_type}\n`;
      content += `    Đối tượng: ${log.target_name || "—"}\n`;
      if (log.details) content += `    Chi tiết : ${log.details}\n`;
      content += `-----------------------------------------------------\n`;
    });
  }
  content += `\n=====================================================\n`;
  content += `      XUẤT TỰ ĐỘNG TỪ HỆ THỐNG KIỂM TOÁN LYXLAB\n`;
  content += `=====================================================\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${now.toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
  manager: { label: "Quản lý phòng lab", initials: "QL", name: "Quản lý phòng lab", path: "/admin" },
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
    ["Nhật ký hệ thống", FileText],
    ["Báo cáo", BarChart3],
    ["Trợ lý AI", Bot],
  ],
  manager: [
    ["Tổng quan", LayoutDashboard],
    ["Người dùng", Users],
    ["Thiết bị", Cpu],
    ["Bảo trì", Wrench],
    ["Yêu cầu mượn", ClipboardCheck],
    ["Nhật ký hệ thống", FileText],
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
    ["Thiết bị", Cpu],
    ["Bảo trì", Wrench],
    ["Lịch sử", ClipboardCheck],
    ["Cảnh báo AI", AlertTriangle],
  ],
};

const statusMeta = {
  available: { label: "Sẵn sàng", tone: "green" },
  reserved: { label: "Đã duyệt / Chờ nhận", tone: "blue" },
  borrowed: { label: "Đang mượn", tone: "amber" },
  return_pending: { label: "Chờ kiểm tra & nhận trả", tone: "amber" },
  returning: { label: "Đang kiểm tra trả", tone: "amber" },
  pending_inspection: { label: "Chờ tiếp nhận sự cố", tone: "orange" },
  in_progress: { label: "Đang kiểm tra sự cố", tone: "blue" },
  replace_partial: { label: "Sửa chữa 1 phần", tone: "amber" },
  replace_full: { label: "Phải thay thế mới", tone: "red" },
  maintenance: { label: "Đang bảo trì", tone: "red" },
  pending: { label: "Chờ duyệt", tone: "amber" },
  approved: { label: "Đã duyệt", tone: "blue" },
  rejected: { label: "Từ chối", tone: "red" },
  returned: { label: "Đã hoàn trả", tone: "green" },
  open: { label: "Chờ xử lý", tone: "orange" },
  completed: { label: "Hoàn thành", tone: "green" },
};

export const CATEGORY_LABEL_MAP = {
  measurement: "Đo lường & Phân tích tín hiệu",
  electronics: "Thiết bị Điện tử & Nguồn công suất",
  embedded: "Hệ thống Nhúng & Vi điều khiển",
  iot: "Mạng & IoT Không dây",
  IoT: "Mạng & IoT Không dây",
  robotics: "Robot & Tự động hóa",
  safety: "An toàn & Phụ trợ Lab",
  repair: "Thiết bị hàn khò & Sửa chữa",
  passive: "Linh kiện thụ động",
  semiconductor: "Bán dẫn & Quang điện tử",
  sensor: "Cảm biến & Module chức năng",
  tools: "Dụng cụ cơ khí & Phụ trợ Lab",
};

export function getCategoryLabel(val) {
  if (!val) return "Chưa phân loại";
  return CATEGORY_LABEL_MAP[val] || val;
}

export function formatHanoiDateTime(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function formatOverdueDuration(diffMs) {
  if (diffMs <= 0) return "vài giây";
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    const remHours = diffHours % 24;
    return remHours > 0 ? `${diffDays} ngày ${remHours} giờ` : `${diffDays} ngày`;
  }
  if (diffHours > 0) {
    const remMin = diffMin % 60;
    return remMin > 0 ? `${diffHours} giờ ${remMin} phút` : `${diffHours} giờ`;
  }
  return `${Math.max(1, diffMin)} phút`;
}

export function useRealtimeClock(intervalMs = 3000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}

export const RESEARCH_CATEGORIES = [
  { value: "Đo lường & Phân tích tín hiệu", label: "Đo lường & Phân tích tín hiệu (Oscilloscope, VOM, Máy phát xung...)" },
  { value: "Hệ thống Nhúng & Vi điều khiển", label: "Hệ thống Nhúng & Vi điều khiển (STM32, ESP32, Raspberry Pi, Jetson Nano, FPGA...)" },
  { value: "Thiết bị Điện tử & Nguồn công suất", label: "Thiết bị Điện tử & Nguồn công suất (Nguồn DC, Tải điện tử, Cầu đo LCR...)" },
  { value: "Thiết bị hàn khò & Sửa chữa", label: "Thiết bị hàn khò & Sửa chữa (Trạm hàn Quick/Hakko, Máy khò nhiệt...)" },
  { value: "Mạng & IoT Không dây", label: "Mạng & IoT Không dây (LoRa Gateway, SDR HackRF, Zigbee, Anten...)" },
  { value: "Robot & Tự động hóa", label: "Robot & Tự động hóa (Cánh tay robot, Xe tự hành AGV, Động cơ bước...)" },
  { value: "Cảm biến & Module chức năng", label: "Cảm biến & Module chức năng (Cảm biến nhiệt ẩm, Relay, Mạch logic...)" },
  { value: "An toàn & Phụ trợ Lab", label: "An toàn & Phụ trợ Lab (Kiểm tra rò điện ESD, Bình chữa cháy, Dụng cụ...)" },
  { value: "Khác", label: "Khác (Nhập phân nhóm tùy chỉnh...)" },
];

export const DEVICE_CONDITIONS = [
  { value: "Mới nguyên hộp", label: "Mới nguyên hộp (Brand New / In-box)", tone: "green" },
  { value: "Đã qua sử dụng - Hoạt động tốt", label: "Đã qua sử dụng - Hoạt động tốt (Used - Good)", tone: "blue" },
  { value: "Đã sửa chữa / Thay thế 1 phần linh kiện - Hoạt động tốt", label: "Đã sửa chữa / Thay thế 1 phần linh kiện - Hoạt động tốt", tone: "blue" },
  { value: "Bảo dưỡng xong - Hoạt động tốt", label: "Bảo dưỡng xong - Hoạt động tốt", tone: "blue" },
  { value: "Cũ - Cần bảo dưỡng định kỳ", label: "Cũ - Cần bảo dưỡng định kỳ (Fair - Needs Maintenance)", tone: "amber" },
  { value: "Đang sửa chữa / Thay thế một phần", label: "Đang sửa chữa / Thay thế một phần (Repairing / Partial Replace)", tone: "amber" },
  { value: "Hỏng hóc / Báo lỗi sự cố", label: "Hỏng hóc / Báo lỗi sự cố (Reported Fault)", tone: "red" },
  { value: "Hỏng hóc nặng / Chờ thanh lý hoặc thay mới", label: "Hỏng hóc nặng / Chờ thanh lý hoặc thay mới (Broken / Replace Full)", tone: "red" },
  { value: "Hỏng hóc / Lỗi phần cứng", label: "Hỏng hóc / Lỗi phần cứng (Damaged / Faulty)", tone: "red" },
];

const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

/* ------------------------------------------------------------------ */
/* Auth provider                                                       */
/* ------------------------------------------------------------------ */
function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem("lab_user") || "null"));

  async function signIn(identifier, password) {
    const loggedIn = await login(identifier, password);
    setUser(loggedIn);
    sessionStorage.setItem("lab_user", JSON.stringify(loggedIn));
    sessionStorage.setItem("lab_role", loggedIn.role);
    localStorage.removeItem("lab_user");
    localStorage.removeItem("lab_role");
    return loggedIn;
  }

  async function signInWithGoogle(idToken) {
    const loggedIn = await googleLogin(idToken);
    setUser(loggedIn);
    sessionStorage.setItem("lab_user", JSON.stringify(loggedIn));
    sessionStorage.setItem("lab_role", loggedIn.role);
    localStorage.removeItem("lab_user");
    localStorage.removeItem("lab_role");
    return loggedIn;
  }

  function updateUser(updated) {
    setUser(updated);
    sessionStorage.setItem("lab_user", JSON.stringify(updated));
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
  const gsiBtnRef = useRef(null);
  const googleBusyRef = useRef(false);

  useEffect(() => {
    if (user && roles[user.role]) {
      navigate(roles[user.role].path, { replace: true });
    }
  }, [user, navigate]);

  // Load and initialize real Google Identity Services SDK if Client ID is configured
  useEffect(() => {
    if (!googleClientId) return;

    function handleGoogleCallback(response) {
      if (!response?.credential || googleBusyRef.current) return;
      googleBusyRef.current = true;
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
          googleBusyRef.current = false;
          setGoogleBusy(false);
        });
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCallback,
      });
      // Render nut Google chuan (khong phu thuoc One Tap prompt - avoid cooldown)
      if (gsiBtnRef.current) {
        window.google.accounts.id.renderButton(gsiBtnRef.current, {
          theme: isDark ? "filled_black" : "outline",
          size: "large",
          width: 320,
          text: "signin_with",
          locale: "vi",
        });
      }
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
        if (gsiBtnRef.current) {
          window.google.accounts.id.renderButton(gsiBtnRef.current, {
            theme: isDark ? "filled_black" : "outline",
            size: "large",
            width: 320,
            text: "signin_with",
            locale: "vi",
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup script tag if unmounted
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [googleClientId, navigate, signInWithGoogle, isDark]);



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
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[1.1fr_.9fr] relative overflow-hidden font-jetbrains font-mono transition-colors duration-200 bg-background text-foreground" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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

            {/* Google Workspace SSO — nut chuan do Google render (tin cay hon One Tap prompt) */}
            <div className="mt-5">
              {googleBusy && (
                <div className="w-full py-2.5 px-4 rounded-xl border border-border bg-surface-elevated text-xs font-semibold flex items-center justify-center gap-2.5">
                  <span className="inline-flex items-center gap-2"><Loader2 size={15} className="animate-spin text-blue-600" /> Đang xác thực với Google...</span>
                </div>
              )}
              <div ref={gsiBtnRef} className={`flex justify-center min-h-[44px] ${googleBusy ? "hidden" : ""}`}></div>
              {!googleClientId && (
                <p className="text-[11px] text-center text-amber-600 dark:text-amber-400">
                  Chưa cấu hình VITE_GOOGLE_CLIENT_ID — nút đăng nhập Google sẽ hiện khi có Client ID.
                </p>
              )}
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
  const [focusTarget, setFocusTarget] = useState(null);
  const navigateWithFocus = (section, focus) => { setActive(section); setFocusTarget(focus || null); };
  const [passwordModal, setPasswordModal] = useState(false);
  const [profileModal, setProfileModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [borrowModal, setBorrowModal] = useState({ open: false, device: null });
  const [incidentModal, setIncidentModal] = useState({ open: false, item: null });
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
            <NotificationDropdown onNavigate={navigateWithFocus} role={role} />
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
          {role === "admin" ? <AdminDashboard section={active} onNavigate={navigateWithFocus} focusTarget={focusTarget} /> : role === "user" ? <UserDashboard section={active} onNavigate={navigateWithFocus} focusTarget={focusTarget} /> : <TechnicianDashboard section={active} onNavigate={navigateWithFocus} focusTarget={focusTarget} />}
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
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
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
    danger: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    green: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400",
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  };
  const isUrgent = (tone === "red" || tone === "danger" || tone === "rose") && Number(value) > 0;
  return (
    <Card hover className={`p-5 overflow-hidden transition ${isUrgent ? "border-rose-400 dark:border-rose-700 bg-rose-50/20 dark:bg-rose-950/20 ring-1 ring-rose-500/20" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className={`grid h-10 w-10 place-items-center rounded-xl shrink-0 ${tones[tone] || tones.blue} ${isUrgent ? "animate-pulse" : ""}`}><Icon size={19} /></div>
        {hint && <span className={`text-[11px] font-semibold truncate ${isUrgent ? "text-rose-600 dark:text-rose-400 font-bold" : "text-muted-foreground"}`}>{hint}</span>}
      </div>
      <p className={`mt-4 text-3xl font-extrabold tracking-tight truncate ${isUrgent ? "text-rose-600 dark:text-rose-400" : "text-foreground"}`}>{value ?? "—"}</p>
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

function StatusBadge({ status, role }) {
  // Với vai trò User: tất cả các trạng thái sự cố/bảo dưỡng/sửa chữa kỹ thuật nội bộ hiển thị thống nhất là "Đang bảo trì"
  if (role === "user" && ["pending_inspection", "in_progress", "replace_partial", "replace_full", "maintenance"].includes(status)) {
    return <Badge tone="red" dot className="whitespace-nowrap shrink-0">Đang bảo trì</Badge>;
  }
  const meta = statusMeta[status] || { label: status, tone: "slate" };
  return <Badge tone={meta.tone} dot className="whitespace-nowrap shrink-0">{meta.label}</Badge>;
}

function ConditionBadge({ condition }) {
  const meta = {
    "Mới nguyên hộp": { tone: "green", label: "Mới nguyên hộp" },
    "Đã qua sử dụng - Hoạt động tốt": { tone: "blue", label: "Hoạt động tốt" },
    "Cũ - Cần bảo dưỡng định kỳ": { tone: "amber", label: "Cần bảo dưỡng" },
    "Đang sửa chữa / Thay thế một phần": { tone: "amber", label: "Sửa chữa 1 phần" },
    "Hỏng hóc / Báo lỗi sự cố": { tone: "red", label: "Báo lỗi sự cố" },
    "Hỏng hóc nặng / Chờ thanh lý hoặc thay mới": { tone: "red", label: "Chờ thay mới" },
    "Hỏng hóc / Lỗi phần cứng": { tone: "red", label: "Hỏng hóc" },
  };
  const item = meta[condition] || { tone: "slate", label: condition || "Bình thường" };
  return <Badge tone={item.tone} dot className="whitespace-nowrap shrink-0">{item.label}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Workspace Section                                                   */
/* ------------------------------------------------------------------ */
function WorkspaceSection({ section, role, data, onBorrow, onComplete, onSchedule, onDownloadReportTXT, onPrintReportPDF, onNavigate, onUpdateDeviceStatus, onOpenMaintenanceForDevice, focusId = null }) {
  useEffect(() => {
    if (!focusId || !focusId.maintenanceId) return;
    const t = setTimeout(() => {
      const el = document.getElementById(`mt-row-${focusId.maintenanceId}`);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("flash-focus"); void el.offsetWidth; el.classList.add("flash-focus");
      setTimeout(() => el.classList.remove("flash-focus"), 2600);
    }, 180);
    return () => clearTimeout(t);
  }, [focusId]);
  const titles = {
    "Người dùng": ["Người dùng", "Danh sách người dùng hiện có trong hệ thống."],
    "Thiết bị": ["Thiết bị", "Tra cứu trạng thái thiết bị từ dữ liệu hiện tại."],
    "Bảo trì": ["Bảo trì", "Các bản ghi bảo trì đang được theo dõi."],
    "Lịch sử": ["Lịch sử bảo trì", "Các bản ghi đã hoàn thành và đang xử lý."],
    "Yêu cầu mượn": ["Yêu cầu mượn", "Theo dõi các yêu cầu mượn thiết bị."],
    "Lượt mượn của tôi": ["Lượt mượn của tôi", "Các yêu cầu mượn gắn với tài khoản hiện tại."],
    "Nhật ký hệ thống": ["Nhật ký hệ thống & Kiểm toán", "Truy vết toàn diện lịch sử mượn trả, bảo trì và thay đổi cấu hình."],
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
        {(section === "Báo cáo" || (role === "technician" && section === "Lịch sử") || (role === "user" && section === "Lượt mượn của tôi")) && (
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
                <span className="truncate max-w-[150px]">{getCategoryLabel(item.category)}</span>
                <span>•</span>
                <ConditionBadge condition={item.condition} />
                <StatusBadge status={item.status} role={role} />
              </div>
            </div>
            {role === "user" && item.status === "available" && <Button size="sm" onClick={() => onBorrow(item)} className="shrink-0">Mượn</Button>}
            {role === "technician" && (
              <div className="flex items-center gap-1.5 shrink-0">
                <Select
                  value={item.status}
                  onChange={(e) => onUpdateDeviceStatus && onUpdateDeviceStatus(item, e.target.value)}
                  className="h-8 text-[11px] min-w-32 py-0"
                >
                  {[
                    "available",
                    "in_progress",
                    "replace_partial",
                    "replace_full",
                    "maintenance",
                    "pending_inspection",
                    "reserved",
                    "borrowed"
                  ].map((st) => (
                    <option key={st} value={st} className="bg-surface text-foreground">{statusMeta[st]?.label || st}</option>
                  ))}
                </Select>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onOpenMaintenanceForDevice && onOpenMaintenanceForDevice(item)}
                  className="text-xs px-2.5 py-1 gap-1"
                  title="Cập nhật tình trạng & Bảo trì kỹ thuật"
                >
                  <Wrench size={12} /> Đánh giá
                </Button>
              </div>
            )}
          </div>
        ))}</div> : <Empty text="Chưa có thiết bị từ API." />
      )}
      {(section === "Yêu cầu mượn" || section === "Lượt mượn của tôi") && (data.requests.length ? <RequestList items={data.requests} devices={data.devices} users={data.users} role={role} focusId={focusId} onReturn={role === "user" ? data.onReturn : undefined} onHandover={data.onHandover} /> : <Empty text="Chưa có yêu cầu mượn." />)}
      {(section === "Bảo trì" || section === "Lịch sử") && (maintenanceItems.length ? maintenanceItems.map((item) => {
        const dev = data.devices.find((d) => d.id === item.device_id) || {};
        const devName = dev.name ? `${dev.name} (${dev.asset_code})` : `Thiết bị #${item.device_id}`;
        const kindLabel = item.kind === "incident" ? "Báo cáo sự cố" : (item.kind === "inspection" ? "Kiểm tra định kỳ" : item.kind);
        return (
        <div key={item.id} id={`mt-row-${item.id}`} className="flex flex-wrap items-center gap-3 border-b border-border py-4 last:border-0 min-w-0">
          <Settings2 size={17} className="text-blue-600 dark:text-blue-400 shrink-0" />
          <span className="flex-1 text-sm font-semibold text-foreground truncate">{devName} • {kindLabel}</span>
          <StatusBadge status={item.status} />
          {role === "technician" && item.status !== "completed" && <Button size="sm" variant="outline" onClick={() => onComplete(item)} className="shrink-0">Cập nhật</Button>}
        </div>
      );
      }) : <Empty text="Chưa có bản ghi bảo trì từ API." />)}
      {section === "Báo cáo" && (
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
          <div className="mt-6">
            <AuditLogViewer title="Nhật ký kiểm toán toàn diện (Audit Trail)" />
          </div>
        </>
      )}
      {role === "technician" && (section === "Lịch sử" || section === "Bảo trì") && (
        <div className="mt-6">
          <AuditLogViewer targetType="MAINTENANCE" title="Nhật ký bảo trì & Kiểm toán thiết bị" />
        </div>
      )}
      {role === "user" && section === "Lượt mượn của tôi" && (
        <div className="mt-6">
          <AuditLogViewer targetType="REQUEST" title="Lịch sử mượn trả & Sự cố cá nhân" />
        </div>
      )}
      {section === "Người dùng" && <Empty text="Chưa có dữ liệu người dùng từ API." />}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Admin Section (Full User CRUD: Add, Edit, Reset, Lock, Delete)     */
/* ------------------------------------------------------------------ */

function NotificationDropdown({ onNavigate, role }) {
  const { data } = useDashboardData();
  const { user } = useAuth();
  const now = useRealtimeClock(3000);
  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("lab_read_notifs") || "[]");
    } catch {
      return [];
    }
  });

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const notifications = useMemo(() => {
    const list = [];

    // 1. Quá hạn mượn thiết bị
    (data.requests || []).forEach((r) => {
      if (r.status === "borrowed" && r.requested_to) {
        const dueDate = new Date(r.requested_to);
        if (dueDate < now) {
          const diffMs = now - dueDate;
          const timeText = formatOverdueDuration(diffMs);
          
          if (role === "user" && r.user_id !== user?.id) return;

          const dev = (data.devices || []).find(d => d.id === r.device_id) || {};
          const borrower = (data.users || []).find(u => u.id === r.user_id);
          const borrowerStr = borrower ? ` của ${borrower.full_name} (@${borrower.username})` : "";

          list.push({
            id: `overdue-${r.id}`,
            title: `CẢNH BÁO QUÁ HẠN: ${dev.name || `Thiết bị #${r.device_id}`}`,
            message: `Thiết bị [${dev.name || `Thiết bị #${r.device_id}`}] (${dev.asset_code || `ID #${r.device_id}`})${role !== "user" ? borrowerStr : ""} đã quá hạn trả ${timeText} (Hạn trả: ${dueDate.toLocaleString("vi-VN")}). Vui lòng kiểm tra hoàn trả ngay.`,
            time: `Quá hạn ${timeText}`,
            type: "danger",
            targetSection: role === "user" ? "Lượt mượn của tôi" : "Yêu cầu mượn",
            focus: { requestId: r.id },
            icon: AlertTriangle,
          });
        }
      }
    });

    // 2. Chờ duyệt (Admin / Manager)
    if (role === "admin") {
      const pending = (data.requests || []).filter(r => r.status === "pending");
      if (pending.length > 0) {
        list.push({
          id: `pending-${pending.length}`,
          title: `Yêu cầu mượn chờ duyệt (${pending.length})`,
          message: `Hiện có ${pending.length} yêu cầu mượn thiết bị mới đang chờ Quản lý phê duyệt.`,
          time: "Chờ xử lý",
          type: "warning",
          targetSection: "Yêu cầu mượn",
          icon: ClipboardCheck,
        });
      }
    }

    // 3. Đã duyệt sẵn sàng nhận máy (User)
    if (role === "user") {
      (data.requests || []).filter(r => r.status === "approved" && r.user_id === user?.id).forEach((r) => {
        const dev = (data.devices || []).find(d => d.id === r.device_id) || {};
        list.push({
          id: `approved-${r.id}`,
          title: `Đã duyệt mượn: ${dev.name || `Thiết bị #${r.device_id}`}`,
          message: `Yêu cầu mượn đã được phê duyệt. Vui lòng đến phòng lab để nhận bàn giao thiết bị.`,
          time: new Date(r.created_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }),
          type: "success",
          targetSection: "Lượt mượn của tôi",
          focus: { requestId: r.id },
          icon: CheckCircle2,
        });
      });
    }

    // 4. Sự cố khẩn cấp (Technician & Admin)
    if (role === "technician" || role === "admin") {
      (data.maintenance || []).filter(m => m.kind === "incident" && m.status === "open").forEach((m) => {
        const dev = (data.devices || []).find(d => d.id === m.device_id) || {};
        list.push({
          id: `incident-${m.id}`,
          title: `Báo cáo sự cố: ${dev.name || `Thiết bị #${m.device_id}`}`,
          message: m.notes || "Thiết bị được báo sự cố khẩn cấp từ người dùng.",
          time: "Cần kiểm tra gấp",
          type: "danger",
          targetSection: "Bảo trì",
          focus: { maintenanceId: m.id },
          icon: AlertTriangle,
        });
      });
    }

    return list;
  }, [data, role, user, now]);

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length;
  const hasOverdue = notifications.some(n => n.type === "danger");

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadIds(allIds);
    localStorage.setItem("lab_read_notifs", JSON.stringify(allIds));
  };

  const handleSelect = (n) => {
    if (!readIds.includes(n.id)) {
      const next = [...readIds, n.id];
      setReadIds(next);
      localStorage.setItem("lab_read_notifs", JSON.stringify(next));
    }
    setOpen(false);
    if (onNavigate && n.targetSection) {
      onNavigate(n.targetSection, n.focus || null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`relative rounded-xl p-2 transition focus:outline-none ${
          hasOverdue 
            ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/40 animate-pulse" 
            : "text-muted-foreground hover:bg-surface-elevated hover:text-foreground"
        }`}
        aria-label="Thông báo"
        title={hasOverdue ? "CẢNH BÁO: Có thiết bị quá hạn hoàn trả!" : "Xem thông báo hệ thống"}
      >
        <Bell size={19} className={hasOverdue ? "text-rose-600 dark:text-rose-400" : ""} />
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white shadow-sm ${
            hasOverdue ? "bg-rose-600 animate-bounce ring-2 ring-rose-300" : "bg-blue-600 animate-pulse"
          }`}>
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-border bg-surface p-3 shadow-2xl z-50 animate-slide-up text-foreground">
          <div className="flex items-center justify-between px-2 py-1.5 border-b border-border mb-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Thông báo hệ thống</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-bold text-[11px] px-2 py-0.5">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold"
              >
                Đã đọc tất cả
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1.5 pr-1">
            {notifications.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                <CheckCircle2 size={24} className="mx-auto text-emerald-500 mb-1.5 opacity-60" />
                Không có cảnh báo hoặc thông báo mới nào.
              </div>
            ) : (
              notifications.map((n) => {
                const isRead = readIds.includes(n.id);
                const Icon = n.icon || Bell;
                const toneBg = n.type === "danger" 
                  ? "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400" 
                  : n.type === "warning" 
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400" 
                  : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400";

                return (
                  <div
                    key={n.id}
                    onClick={() => handleSelect(n)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl cursor-pointer transition hover:bg-surface-elevated ${isRead ? "opacity-60" : "bg-surface-elevated/40"}`}
                  >
                    <div className={`grid h-8 w-8 place-items-center rounded-lg shrink-0 mt-0.5 ${toneBg}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-xs truncate text-foreground">{n.title}</p>
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{n.time}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}


function AdminAuditCenter({ onPrintReportPDF }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [targetTypeFilter, setTargetTypeFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");

  const [refreshing, setRefreshing] = useState(false);

  const fetchLogs = (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    api.auditLogs({ target_type: targetTypeFilter !== "all" ? targetTypeFilter : undefined })
      .then(res => { setLogs(res); setLoading(false); setRefreshing(false); })
      .catch(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => {
    fetchLogs();
    // Tự động đồng bộ nhật ký mỗi 10 giây để ghi nhận sự kiện real-time
    const timer = setInterval(() => {
      fetchLogs(true);
    }, 10000);
    return () => clearInterval(timer);
  }, [targetTypeFilter]);

  const filteredLogs = useMemo(() => {
    const now = new Date();
    return logs.filter(log => {
      if (actionFilter !== "all" && log.action !== actionFilter) return false;
      if (timeFilter !== "all") {
        const logDate = new Date(log.created_at);
        const diffMs = now - logDate;
        const diffHours = diffMs / (1000 * 60 * 60);
        if (timeFilter === "today" && (diffHours < -2 || diffHours > 24)) return false;
        if (timeFilter === "7days" && (diffHours < -2 || diffHours > 24 * 7)) return false;
        if (timeFilter === "30days" && (diffHours < -2 || diffHours > 24 * 30)) return false;
      }
      if (submittedSearch.trim()) {
        const q = removeVietnameseTones(submittedSearch.trim());
        const target = removeVietnameseTones(`${log.username} ${log.action} ${log.target_name} ${log.details}`);
        if (!target.includes(q)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, timeFilter, submittedSearch]);

  const stats = useMemo(() => {
    return {
      total: logs.length,
      requests: logs.filter(l => l.target_type === "REQUEST").length,
      maintenance: logs.filter(l => l.target_type === "MAINTENANCE" || l.action === "INCIDENT_REPORT").length,
      system: logs.filter(l => l.target_type === "DEVICE" || l.target_type === "USER").length,
    };
  }, [logs]);

  const actionMeta = {
    CREATE: { label: "Tạo mới", tone: "blue" },
    UPDATE: { label: "Cập nhật", tone: "blue" },
    DELETE: { label: "Xóa / Thanh lý", tone: "red" },
    STATUS_CHANGE: { label: "Đổi trạng thái", tone: "amber" },
    BORROW_REQUEST: { label: "Yêu cầu mượn", tone: "amber" },
    APPROVE: { label: "Duyệt mượn", tone: "green" },
    REJECT: { label: "Từ chối", tone: "red" },
    HANDOVER: { label: "Bàn giao máy", tone: "blue" },
    RETURN_REQUESTED: { label: "Báo trả máy", tone: "amber" },
    RETURN_CONFIRMED: { label: "Xác nhận nhận trả", tone: "green" },
    RETURN: { label: "Hoàn trả máy", tone: "green" },
    INCIDENT_REPORT: { label: "Báo sự cố", tone: "red" },
    ACCEPT_INCIDENT: { label: "Tiếp nhận sự cố", tone: "orange" },
    RESET_PASSWORD: { label: "Đặt lại MK", tone: "amber" },
    LOGIN: { label: "Đăng nhập", tone: "blue" },
    LOGIN_GOOGLE: { label: "Đăng nhập Google", tone: "blue" },
    PASSWORD_CHANGE: { label: "Đổi mật khẩu", tone: "amber" },
    REGISTER: { label: "Đăng ký mới", tone: "green" },
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Tổng lượt ghi log" value={stats.total} icon={FileText} />
        <KPICard label="Lượt mượn & trả máy" value={stats.requests} icon={ClipboardCheck} tone="blue" />
        <KPICard label="Bảo trì & Sự cố" value={stats.maintenance} icon={Wrench} tone="amber" />
        <KPICard label="Biến động Thiết bị & User" value={stats.system} icon={Users} tone="green" />
      </div>

      <Card className="p-4 sm:p-5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <SectionTitle title="Bộ lọc kiểm toán & Truy vết nhật ký" />
            <p className="-mt-3 text-xs text-muted-foreground">Theo dõi chính xác tài khoản thao tác, thời gian thực tế Hà Nội (UTC+7), sự kiện và đối tượng tác động.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => fetchLogs()} disabled={refreshing} className="gap-1.5 shrink-0">
              <RefreshCw size={14} className={refreshing ? "animate-spin text-blue-500" : ""} />
              {refreshing ? "Đang đồng bộ..." : "Làm mới"}
            </Button>
            <Button size="sm" variant="outline" onClick={() => downloadAuditLogsTXT(filteredLogs, "BÁO CÁO KIỂM TOÁN HỆ THỐNG PHÒNG LAB", "Bao_cao_kiem_toan")}>
              <FileDown size={14} /> Xuất .TXT
            </Button>
            <Button size="sm" variant="outline" onClick={onPrintReportPDF}>
              <Printer size={14} /> In / Xuất PDF
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-2 flex items-center gap-2">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tài khoản, tên thiết bị, nội dung..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Search size={14} /> Tìm kiếm
            </Button>
          </form>

          <Select
            value={targetTypeFilter}
            onChange={(e) => setTargetTypeFilter(e.target.value)}
            className="h-10 text-xs"
          >
            <option value="all">Tất cả phân loại</option>
            <option value="REQUEST">Mượn trả & Quá hạn</option>
            <option value="MAINTENANCE">Bảo trì & Sự cố</option>
            <option value="DEVICE">Quản trị Thiết bị</option>
            <option value="USER">Quản trị Người dùng</option>
          </Select>

          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-10 text-xs"
          >
            <option value="all">Tất cả hành động</option>
            {Object.entries(actionMeta).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>

          <Select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="h-10 text-xs"
          >
            <option value="all">Tất cả thời gian</option>
            <option value="today">Hôm nay (24 giờ qua)</option>
            <option value="7days">7 ngày gần nhất</option>
            <option value="30days">30 ngày gần nhất</option>
          </Select>
        </div>
      </Card>

      <Card className="p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-foreground">Bảng dữ liệu kiểm toán hệ thống</h3>
            <Badge tone="blue">{filteredLogs.length} bản ghi</Badge>
          </div>
          {submittedSearch && (
            <button
              onClick={() => { setSearch(""); setSubmittedSearch(""); }}
              className="text-xs text-blue-600 hover:underline"
            >
              Xóa bộ lọc tìm kiếm "{submittedSearch}"
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Đang tải dữ liệu kiểm toán...</p>
        ) : filteredLogs.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated uppercase text-muted-foreground font-semibold">
                <tr>
                  <th className="px-4 py-3">Thời gian chính xác</th>
                  <th className="px-4 py-3">Tài khoản thao tác</th>
                  <th className="px-4 py-3">Hành động</th>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Nội dung chi tiết / Truy vết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => {
                  const meta = actionMeta[log.action] || { label: log.action, tone: "slate" };
                  const badgeColor = meta.tone === "green" 
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                    : meta.tone === "red"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                    : meta.tone === "amber"
                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                    : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";

                  return (
                    <tr key={log.id} className="hover:bg-surface-elevated/40 transition">
                      <td className="px-4 py-3 font-mono text-muted-foreground whitespace-nowrap">
                        {formatHanoiDateTime(log.created_at)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="font-bold text-foreground">@{log.username || "system"}</span>
                        <span className="ml-1.5 text-[11px] text-muted-foreground font-medium">({log.user_role || "hệ thống"})</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-bold ${badgeColor}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground max-w-[220px] truncate" title={log.target_name}>
                        {log.target_name || `#${log.target_id || "—"}`}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground max-w-[340px] truncate font-sans" title={log.details}>
                        {log.details || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty text="Không tìm thấy bản ghi nhật ký nào phù hợp với bộ lọc." />
        )}
      </Card>
    </div>
  );
}

function AdminSection({ 
  section, 
  data, 
  focusId, 
  onRequestStatus, 
  onHandover,
  onReturnDevice,
  onRecallDevice,
  onOpenDeviceForm,
  onDeviceStatus,
  onOpenEditDevice,
  onDeleteDevice,
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
  role = "admin",
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
                <th className="px-5 py-3">Mật khẩu</th>
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
                  <td className="px-5 py-3.5">
                    <div className="inline-flex items-center gap-1.5 font-mono text-xs bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">••••••••</span>
                      <span className="text-slate-400" title="Mật khẩu được mã hóa one-way (bcrypt), không thể xem lại. Dùng chức năng đặt lại mật khẩu nếu cần.">
                        <ShieldCheck size={13} />
                      </span>
                    </div>
                  </td>
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
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                        title="Chỉnh sửa thông tin tài khoản"
                      >
                        <Edit2 size={13} />
                        <span>Sửa</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenResetPassword(item)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800/40 transition"
                        title="Đặt lại mật khẩu mới cho người dùng"
                      >
                        <Key size={13} />
                        <span>Đổi mật khẩu</span>
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
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={deviceSearch}
                onChange={(e) => setDeviceSearch(e.target.value)}
                placeholder="Tìm theo tên máy, mã EQ-xxx, nhóm thiết bị..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Search size={14} /> Tìm kiếm
            </Button>
          </form>
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
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDevices.map((item) => (
                  <tr className="hover:bg-surface-elevated/50 transition" key={item.id}>
                    <td className="px-5 py-3.5 font-semibold text-foreground truncate max-w-[240px]">{item.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{item.asset_code}</td>
                    <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[180px] font-medium" title={getCategoryLabel(item.category)}>{getCategoryLabel(item.category)}</td>
                    <td className="px-5 py-3.5">
                      <ConditionBadge condition={item.condition} />
                    </td>
                    <td className="px-5 py-3">
                      <Select value={item.status} onChange={(event) => onDeviceStatus(item, event.target.value)} className="h-9 min-w-36 text-xs">
                        {[
                          "available",
                          "in_progress",
                          "replace_partial",
                          "replace_full",
                          "maintenance",
                          "pending_inspection",
                          "reserved",
                          "borrowed"
                        ].filter(st => {
                          if (role === "technician") {
                            return ["pending_inspection", "in_progress", "replace_partial", "replace_full", "maintenance"].includes(st);
                          }
                          return true;
                        }).map((status) => (
                          <option value={status} key={status} className="bg-surface text-foreground">{statusMeta[status]?.label || status}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditDevice && onOpenEditDevice(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-slate-600 hover:border-blue-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition"
                          title="Sửa thông tin thiết bị"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDevice && onDeleteDevice(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-slate-600 hover:border-red-500 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 transition"
                          title="Thanh lý / Xóa thiết bị"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
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
          devices={data.devices}
          users={data.users}
          role="admin"
          focusId={focusId}
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

  if (section === "Nhật ký hệ thống") {
    return <AdminAuditCenter onPrintReportPDF={onPrintReportPDF} />;
  }

  return (
    <WorkspaceSection 
      section={section} 
      role="admin" 
      data={data} 
      focusId={focusId} 
      onDownloadReportTXT={onDownloadReportTXT}
      onPrintReportPDF={onPrintReportPDF}
      onNavigate={onNavigate}
    />
  );
}


/* ------------------------------------------------------------------ */
/* Audit Log & Advanced Action Modals                                  */
/* ------------------------------------------------------------------ */
function AuditLogViewer({ targetType = null, title = "Nhật ký hoạt động & Kiểm toán (Audit Trail)" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  const fetchLogs = () => {
    setLoading(true);
    api.auditLogs({ target_type: targetType || undefined })
      .then(res => { setLogs(res); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [targetType]);

  const filtered = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);

  const actionLabels = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa / Thanh lý",
    STATUS_CHANGE: "Đổi trạng thái",
    BORROW_REQUEST: "Yêu cầu mượn",
    APPROVE: "Duyệt mượn",
    REJECT: "Từ chối",
    HANDOVER: "Bàn giao",
    RETURN: "Hoàn trả",
    INCIDENT_REPORT: "Báo sự cố",
    ACCEPT_INCIDENT: "Tiếp nhận sự cố",
    RESET_PASSWORD: "Đặt lại MK",
  };

  return (
    <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <SectionTitle title={title} />
          <p className="-mt-2 text-xs text-muted-foreground">Truy vết thời gian, người thực hiện và dữ liệu biến động trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-9 text-xs w-36">
            <option value="all">Tất cả hành động</option>
            {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Button size="sm" variant="outline" onClick={() => downloadAuditLogsTXT(filtered, title, "Nhat_ky_kiem_toan")}>
            <FileDown size={14} /> Xuất Log .TXT
          </Button>
          <Button size="sm" variant="outline" onClick={printReportPDF}>
            <Printer size={14} /> In PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Đang tải dữ liệu nhật ký...</p>
      ) : filtered.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-4 py-2.5">Người thực hiện</th>
                <th className="px-4 py-2.5">Hành động</th>
                <th className="px-4 py-2.5">Đối tượng</th>
                <th className="px-4 py-2.5">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/40">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                    @{log.username} <span className="text-[10px] text-muted-foreground font-normal">({log.user_role})</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[200px]" title={log.target_name}>
                    {log.target_name || `#${log.target_id || "—"}`}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[320px] truncate" title={log.details}>
                    {log.details || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="Chưa có bản ghi nhật ký hoạt động nào." />
      )}
    </Card>
  );
}

function BorrowModal({ open, device, onClose, onSubmit }) {
  const [form, setForm] = useState({ 
    purpose: "Thực hành phòng thí nghiệm", 
    requested_from: "", 
    requested_to: "" 
  });
  const [error, setError] = useState("");
  const [minDT, setMinDT] = useState("");

  const pad = (n) => String(n).padStart(2, "0");
  const formatDT = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

  useEffect(() => {
    if (open) {
      const now = new Date();
      const current = formatDT(now);
      setMinDT(current);

      // Mặc định +2 giờ để giữ nguyên ngữ cảnh buổi Sáng/Chiều, tránh ép sang 17:00 (PM)
      const due = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      setForm({ 
        purpose: "Thực hành phòng thí nghiệm", 
        requested_from: current, 
        requested_to: formatDT(due) 
      });
      setError("");
    }
  }, [open]);

  if (!open || !device) return null;

  function applyPreset(minutes) {
    const base = form.requested_from ? new Date(form.requested_from) : new Date();
    const target = new Date(base.getTime() + minutes * 60 * 1000);
    setForm((prev) => ({ ...prev, requested_to: formatDT(target) }));
    setError("");
  }

  function toggleMeridiem() {
    if (!form.requested_to) return;
    const d = new Date(form.requested_to);
    d.setHours((d.getHours() + 12) % 24);
    setForm((prev) => ({ ...prev, requested_to: formatDT(d) }));
  }

  function handleFormSubmit(e) {
    e?.preventDefault?.();
    if (!form.purpose.trim()) {
      setError("Vui lòng nhập rõ mục đích mượn thiết bị.");
      return;
    }
    if (!form.requested_from) {
      setError("Vui lòng chọn ngày giờ bắt đầu mượn.");
      return;
    }
    if (!form.requested_to) {
      setError("Vui lòng chọn ngày giờ hẹn trả thiết bị.");
      return;
    }

    const fromDate = new Date(form.requested_from);
    const toDate = new Date(form.requested_to);
    const nowThreshold = new Date(Date.now() - 5 * 60 * 1000); // dung sai 5 phút

    if (fromDate < nowThreshold) {
      setError("Lỗi logic thời gian: Ngày giờ bắt đầu mượn không thể ở trong quá khứ! Vui lòng chọn từ thời điểm hiện tại trở đi.");
      return;
    }

    if (toDate <= fromDate) {
      setError("Lỗi logic thời gian: Ngày giờ hẹn trả máy phải sau thời gian bắt đầu mượn.");
      return;
    }

    setError("");
    onSubmit(form);
  }

  const toDateObj = form.requested_to ? new Date(form.requested_to) : null;
  const isPM = toDateObj ? toDateObj.getHours() >= 12 : false;
  const meridiemLabel = isPM ? "Chiều/Tối (PM)" : "Sáng (AM)";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl border border-border">
        <h3 className="mb-1.5 text-lg font-bold text-foreground">Đăng ký mượn thiết bị</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Thiết bị: <span className="font-semibold text-foreground">{device.name}</span> ({device.asset_code})
        </p>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mục đích sử dụng</label>
            <textarea
              value={form.purpose}
              onChange={(e) => { setForm({ ...form, purpose: e.target.value }); setError(""); }}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2.5 text-sm focus:border-blue-500 focus:outline-none"
              rows={2}
              placeholder="Nêu rõ bài thực hành, đề tài hoặc mục đích mượn..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Ngày giờ bắt đầu mượn <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                min={minDT}
                value={form.requested_from}
                onChange={(e) => { setForm({ ...form, requested_from: e.target.value }); setError(""); }}
                className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Tối thiểu từ thời điểm hiện tại</span>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">
                Ngày giờ hẹn trả máy <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                min={form.requested_from || minDT}
                value={form.requested_to}
                onChange={(e) => { setForm({ ...form, requested_to: e.target.value }); setError(""); }}
                className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-xs font-mono focus:border-blue-500 focus:outline-none"
                required
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">Sau thời gian bắt đầu mượn</span>
            </div>
          </div>

          {/* Chọn nhanh thời hạn & chuyển đổi AM/PM */}
          <div className="rounded-xl border border-border/80 bg-surface-elevated/40 p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Chọn nhanh thời hạn mượn:</span>
              <span className="text-slate-400">Tự động điền ngày giờ trả</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset(5)}
                className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 transition"
                title="Đặt hạn trả sau 5 phút để thử nghiệm cảnh báo quá hạn"
              >
                ⚡ 5 phút (Test cảnh báo)
              </button>
              <button
                type="button"
                onClick={() => applyPreset(30)}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border hover:bg-border/60 transition"
              >
                30 phút
              </button>
              <button
                type="button"
                onClick={() => applyPreset(120)}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border hover:bg-border/60 transition"
              >
                2 giờ
              </button>
              <button
                type="button"
                onClick={() => applyPreset(1440)}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border hover:bg-border/60 transition"
              >
                1 ngày
              </button>
              <button
                type="button"
                onClick={() => applyPreset(4320)}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border hover:bg-border/60 transition"
              >
                3 ngày
              </button>
              <button
                type="button"
                onClick={() => applyPreset(10080)}
                className="px-2 py-1 rounded-lg text-[11px] font-medium bg-surface-elevated border border-border hover:bg-border/60 transition"
              >
                7 ngày
              </button>
            </div>

            {toDateObj && (
              <div className="pt-2 border-t border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">
                  Hạn trả xác nhận: <strong className="text-blue-600 dark:text-blue-400 font-mono">{toDateObj.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} ({meridiemLabel})</strong>, {toDateObj.toLocaleDateString("vi-VN")}
                </span>
                <button
                  type="button"
                  onClick={toggleMeridiem}
                  className="px-2 py-0.5 rounded text-[11px] font-semibold text-blue-600 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition"
                  title="Chuyển đổi nhanh giữa giờ sáng (AM) và chiều (PM)"
                >
                  Đổi sang {isPM ? "Sáng (AM)" : "Chiều (PM)"}
                </button>
              </div>
            )}
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-700 dark:text-blue-300">
            Cam kết: Sử dụng thiết bị đúng quy trình kỹ thuật, ngắt nguồn khi không dùng và hoàn trả đúng ngày giờ hẹn.
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button type="button" size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button type="submit" size="sm">Gửi yêu cầu mượn</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function IncidentModal({ open, item, onClose, onSubmit }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) setDescription("");
  }, [open]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border-2 border-red-500/30">
        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
          <AlertTriangle size={20} />
          <h3 className="text-lg font-bold text-foreground">Báo cáo sự cố thiết bị</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Thiết bị #{item.device_id}: Hệ thống sẽ gửi cảnh báo khẩn cấp đến Kỹ thuật viên và chuyển máy sang trạng thái bảo trì.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mô tả chi tiết sự cố / lỗi hỏng</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-red-500 focus:outline-none"
              rows={4}
              placeholder="Ví dụ: Thiết bị không lên nguồn, chập que đo, cháy cầu chì, màn hình hiển thị lỗi..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button size="sm" variant="danger" onClick={() => onSubmit(description)} disabled={!description.trim()}>
              Gửi báo cáo sự cố
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfirmReturnModal({ open, item, device, onClose, onSubmit }) {
  const [condition, setCondition] = useState("Đã qua sử dụng - Hoạt động tốt");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCondition(device?.condition || "Đã qua sử dụng - Hoạt động tốt");
      setNotes("");
      setSubmitting(false);
    }
  }, [open, device]);

  if (!open || !item) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(item, { condition, notes });
    setSubmitting(false);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kiểm tra & Nghiệm thu nhận thiết bị hoàn trả"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shrink-0">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            Xác nhận nhận trả & Nhập kho
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="p-3.5 bg-surface-elevated rounded-xl border border-border space-y-1.5">
          <p className="font-bold text-sm text-foreground">{device?.name || `Thiết bị #${item.device_id}`}</p>
          <div className="grid grid-cols-2 gap-2 text-muted-foreground mt-1">
            <p>Mã tài sản: <span className="font-mono font-semibold text-foreground">{device?.asset_code || "—"}</span></p>
            <p>Người mượn: <span className="font-semibold text-foreground">User #{item.user_id}</span></p>
          </div>
          <p className="text-muted-foreground text-[11px]">Mục đích: <span className="italic text-foreground">{item.purpose}</span></p>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1.5">
            Đánh giá tình trạng thực tế khi nhận lại thiết bị:
          </label>
          <Select
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            className="w-full text-xs h-10"
          >
            {DEVICE_CONDITIONS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </Select>
          {condition.includes("Hỏng hóc") && (
            <p className="mt-1.5 text-[11px] text-rose-600 dark:text-rose-400 font-medium">
              ⚠️ Thiết bị được đánh giá hỏng hóc sẽ tự động chuyển sang trạng thái <b>Bảo trì</b> và tạo phiếu kiểm định kỹ thuật khẩn cấp.
            </p>
          )}
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1.5">
            Ghi chú biên bản kiểm tra & nghiệm thu:
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ví dụ: Đã kiểm tra đầy đủ phụ kiện, dây cáp nguồn, que đo, ngoại quan nguyên vẹn..."
            rows={3}
            className="w-full rounded-xl border border-border bg-surface p-2.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
          />
        </div>
      </form>
    </Modal>
  );
}

function DeviceEditModal({ open, device, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", category: "", condition: "", serial_number: "" });

  useEffect(() => {
    if (open && device) {
      setForm({
        name: device.name || "",
        category: device.category || RESEARCH_CATEGORIES[0].value,
        condition: device.condition || "Mới nguyên hộp",
        serial_number: device.serial_number || "",
      });
    }
  }, [open, device]);

  if (!open || !device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-foreground">Chỉnh sửa thông tin thiết bị</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mã tài sản (Cố định)</label>
            <input value={device.asset_code} disabled className="w-full rounded-lg border border-border bg-surface-elevated/50 p-2 text-sm text-muted-foreground font-mono" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Tên thiết bị</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Nhóm phân loại</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none">
              {RESEARCH_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Tình trạng vật lý</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none">
              {DEVICE_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Số Sê-ri (Serial Number)</label>
            <input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="SN-xxxxx" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button size="sm" onClick={() => onSave(device.id, form)}>Lưu thay đổi</Button>
          </div>
        </div>
      </div>
    </div>
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
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [isActive, setIsActive] = useState(true);
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      setUsername(user.username || "");
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setRole(user.role || "user");
      setIsActive(user.is_active ?? true);
      setNewPassword("");
      setShowPassword(false);
      setError("");
    }
  }, [user, open]);

  async function submit(e) {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) return;
    if (newPassword.trim() && newPassword.trim().length < 8) {
      setError("Mật khẩu mới phải có tối thiểu 8 ký tự.");
      return;
    }
    setBusy(true);
    try {
      const payload = { 
        username: username.trim(),
        full_name: fullName.trim(), 
        email: email.trim(), 
        role, 
        is_active: isActive 
      };
      if (newPassword.trim()) {
        payload.password = newPassword.trim();
      }
      await onSave(user.id, payload);
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
          <Button variant="outline" size="sm" onClick={onClose}>Đóng</Button>
          <Button size="sm" onClick={submit} disabled={busy || !fullName.trim() || !username.trim()}>
            {busy ? "Đang áp dụng..." : "Áp dụng thay đổi"}
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
          Tên đăng nhập (Username)
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1.5"
            required
          />
        </label>
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

        {/* Password Reset Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Quản lý mật khẩu tài khoản
            </span>
            <span className="text-[11px] text-slate-400 flex items-center gap-1 font-medium">
              <ShieldCheck size={13} className="text-emerald-500" /> Cán bộ quản lý
            </span>
          </div>

          {/* Mật khẩu được mã hóa one-way, không hiển thị lại được */}
          <div className="rounded-xl border border-border bg-slate-50/80 dark:bg-slate-900/60 p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mật khẩu hiện tại:
              </span>
              <span className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-border shadow-xs font-mono text-xs text-slate-400">
                •••••••• <ShieldCheck size={13} className="text-emerald-500" />
              </span>
            </div>
          </div>

          {/* Dòng dưới: Thiết lập mật khẩu mới */}
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Đặt mật khẩu mới thay thế (Dòng dưới)
            <div className="relative mt-1.5 flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới thay thế (tối thiểu 8 ký tự)..."
                className="pr-24 font-mono text-xs"
              />
              <div className="absolute right-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title={showPassword ? "Ẩn" : "Hiện"}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const generated = "Lab@" + Math.random().toString(36).slice(-6) + "!";
                    setNewPassword(generated);
                    setShowPassword(true);
                  }}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                  title="Tự động tạo mật khẩu ngẫu nhiên an toàn"
                >
                  Tạo nhanh
                </button>
              </div>
            </div>
            {newPassword && (
              <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                * Mật khẩu mới sẽ được cập nhật ngay sau khi bấm "Áp dụng thay đổi".
              </p>
            )}
          </label>
        </div>
      </form>
    </Modal>
  );
}

function AdminResetPasswordModal({ open, user, onClose, onReset }) {
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setNewPassword("");
    setShowPassword(false);
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
            {busy ? "Đang áp dụng..." : "Áp dụng thay đổi"}
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

        {/* Current password is stored as a one-way hash and cannot be displayed */}
        <div className="rounded-xl border border-border bg-slate-50/80 dark:bg-slate-900/60 p-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Mật khẩu hiện tại:
            </span>
            <span className="flex items-center gap-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-border shadow-xs font-mono text-xs text-slate-400">
              •••••••• <ShieldCheck size={13} className="text-emerald-500" />
            </span>
          </div>
        </div>

        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
          Mật khẩu mới thay thế (Dòng dưới)
          <div className="relative mt-1.5 flex items-center">
            <Input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nhập mật khẩu mới thay thế (tối thiểu 8 ký tự)..."
              className="pr-24 font-mono text-xs"
              required
            />
            <div className="absolute right-1.5 flex items-center gap-1">
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title={showPassword ? "Ẩn" : "Hiện"}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const generated = "Lab@" + Math.random().toString(36).slice(-6) + "!";
                  setNewPassword(generated);
                  setShowPassword(true);
                }}
                className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition"
                title="Tự động tạo mật khẩu ngẫu nhiên an toàn"
              >
                Tạo nhanh
              </button>
            </div>
          </div>
          {newPassword && (
            <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              * Bấm "Áp dụng thay đổi" để cập nhật mật khẩu cho tài khoản.
            </p>
          )}
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
    const interval = setInterval(refresh, 3000); // Tự động đồng bộ thời gian thực mỗi 3 giây
    const handleFocus = () => refresh();
    window.addEventListener("focus", handleFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [includeUsers]);

  return { data, offline, loading, setData, refresh };
}

/* ------------------------------------------------------------------ */
/* Real-time Equipment Quick Control Board (Đề tài 23)                */
/* ------------------------------------------------------------------ */
function EquipmentQuickControlBoard({ devices = [], onUpdateStatus, onNavigate, role = "admin" }) {
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
                <td className="px-4 py-3 text-muted-foreground truncate max-w-[180px] font-medium" title={getCategoryLabel(d.category)}>{getCategoryLabel(d.category)}</td>
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
                    {[
                      "available",
                      "in_progress",
                      "replace_partial",
                      "replace_full",
                      "maintenance",
                      "pending_inspection",
                      "reserved",
                      "borrowed"
                    ].filter(st => {
                      if (role === "technician") {
                        return ["pending_inspection", "in_progress", "replace_partial", "replace_full", "maintenance"].includes(st);
                      }
                      return true;
                    }).map((st) => (
                      <option key={st} value={st} className="bg-surface text-foreground">{statusMeta[st]?.label || st}</option>
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
function ActivityPanel({ stats, devices = [], overdueCount, pendingCount, returnPendingCount, approvedCount, onNavigate, chipFocusMap = {} }) {
  const daily = (stats && stats.daily_activity) || [];
  const usage = (stats && stats.usage_by_action) || {};
  const [hoveredDay, setHoveredDay] = useState(null);

  // Compute 7-day operational metrics
  const maxTotal = Math.max(1, ...daily.map((d) => (d.approved || 0) + (d.borrowed || 0) + (d.returned || 0) + (d.rejected || 0)));
  const totalApproved = daily.reduce((acc, d) => acc + (d.approved || 0), 0);
  const totalBorrowed = daily.reduce((acc, d) => acc + (d.borrowed || 0), 0);
  const totalReturned = daily.reduce((acc, d) => acc + (d.returned || 0), 0);
  const totalRejected = daily.reduce((acc, d) => acc + (d.rejected || 0), 0);
  const totalWeekVolume = totalApproved + totalBorrowed + totalReturned + totalRejected;

  // Peak day
  const peakDay = daily.length > 0
    ? daily.reduce((prev, curr) => {
        const pSum = (prev.approved || 0) + (prev.borrowed || 0) + (prev.returned || 0) + (prev.rejected || 0);
        const cSum = (curr.approved || 0) + (curr.borrowed || 0) + (curr.returned || 0) + (curr.rejected || 0);
        return cSum > pSum ? curr : prev;
      }, daily[0])
    : null;

  // Completion rate
  const completionRate = totalReturned + totalBorrowed > 0
    ? Math.round((totalReturned / (totalReturned + totalBorrowed)) * 100)
    : 100;

  // Cumulative usage stats
  const usageEntries = Object.entries(usage);
  const totalUsageEvents = usageEntries.reduce((sum, [, count]) => sum + Number(count), 0);
  const maxUsageCount = Math.max(1, ...usageEntries.map(([, count]) => Number(count)));

  const actionLabels = {
    returned: "Đã nhận trả kho",
    borrowed: "Đang mượn (Bàn giao)",
    approved: "Đã phê duyệt",
    pending: "Chờ xét duyệt",
    rejected: "Từ chối yêu cầu",
  };

  const actionStyles = {
    returned: {
      color: "bg-emerald-500",
      dot: "bg-emerald-500",
      badge: "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-900/60",
    },
    borrowed: {
      color: "bg-blue-600",
      dot: "bg-blue-600",
      badge: "text-blue-700 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200/60 dark:border-blue-900/60",
    },
    approved: {
      color: "bg-violet-600",
      dot: "bg-violet-600",
      badge: "text-violet-700 bg-violet-50 dark:bg-violet-950/50 dark:text-violet-300 border-violet-200/60 dark:border-violet-900/60",
    },
    pending: {
      color: "bg-amber-500",
      dot: "bg-amber-500",
      badge: "text-amber-800 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200/60 dark:border-amber-900/60",
    },
    rejected: {
      color: "bg-slate-400 dark:bg-slate-500",
      dot: "bg-slate-400 dark:bg-slate-500",
      badge: "text-slate-700 bg-slate-50 dark:bg-slate-900/50 dark:text-slate-300 border-slate-200/60 dark:border-slate-800",
    },
  };

  // Device status segregation
  const byStatus = (list) => devices.filter((d) => list.includes(d.status)).length;
  const avail = byStatus(["available"]);
  const borrowed = byStatus(["borrowed", "reserved", "returning"]);
  const maint = byStatus(["maintenance", "pending_inspection", "in_progress", "replace_partial", "replace_full"]);
  const other = Math.max(0, devices.length - avail - borrowed - maint);
  const total = devices.length || 1;

  const seg = [
    { label: "Sẵn sàng trong kho", n: avail, color: "bg-emerald-500", dot: "bg-emerald-500", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-900/60" },
    { label: "Đang mượn / bàn giao", n: borrowed, color: "bg-blue-600", dot: "bg-blue-600", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200 dark:border-blue-900/60" },
    { label: "Bảo trì / kiểm tra", n: maint, color: "bg-amber-500", dot: "bg-amber-500", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-900/60" },
    ...(other > 0 ? [{ label: "Khác", n: other, color: "bg-slate-400", dot: "bg-slate-400", text: "text-slate-700 dark:text-slate-400", border: "border-slate-200 dark:border-slate-800" }] : []),
  ];

  const chips = [
    { label: "Quá hạn", n: overdueCount, tone: overdueCount > 0 ? "border-rose-400/80 bg-rose-50/70 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800" : "border-border bg-surface text-muted-foreground", dot: "bg-rose-500 animate-pulse" },
    { label: "Chờ duyệt", n: pendingCount, tone: pendingCount > 0 ? "border-amber-400/80 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800" : "border-border bg-surface text-muted-foreground", dot: "bg-amber-500" },
    { label: "Chờ nhận trả", n: returnPendingCount, tone: returnPendingCount > 0 ? "border-blue-400/80 bg-blue-50/70 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800" : "border-border bg-surface text-muted-foreground", dot: "bg-blue-500" },
    { label: "Chờ bàn giao", n: approvedCount, tone: approvedCount > 0 ? "border-violet-400/80 bg-violet-50/70 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800" : "border-border bg-surface text-muted-foreground", dot: "bg-violet-500" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Mini KPI Metrics Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground flex items-center gap-1.5">
              <Activity size={14} className="text-blue-500" />
              Tổng tương tác 7 ngày
            </div>
            <div className="text-xl font-bold font-mono mt-0.5 text-foreground">
              {totalWeekVolume} <span className="text-xs font-normal text-muted-foreground">lượt</span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-900/50 font-mono">
            ~{(totalWeekVolume / Math.max(1, daily.length)).toFixed(1)}/ngày
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-500" />
              Ngày cao điểm nhất
            </div>
            <div className="text-xl font-bold font-mono mt-0.5 text-foreground">
              {peakDay ? peakDay.date : "—"}{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                ({peakDay ? (peakDay.approved || 0) + (peakDay.borrowed || 0) + (peakDay.returned || 0) + (peakDay.rejected || 0) : 0} lượt)
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/50 dark:border-emerald-900/50">
            Tải đỉnh
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-border/70 bg-surface-elevated/40 flex items-center justify-between shadow-xs">
          <div>
            <div className="text-[11.5px] font-medium text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 size={14} className="text-violet-500" />
              Tỷ lệ hoàn tất trả
            </div>
            <div className="text-xl font-bold font-mono mt-0.5 text-foreground">
              {completionRate}%{" "}
              <span className="text-xs font-normal text-muted-foreground font-sans">
                ({totalReturned}/{Math.max(1, totalReturned + totalBorrowed)})
              </span>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-2 py-0.5 rounded-full border border-violet-200/50 dark:border-violet-900/50">
            Luân chuyển
          </span>
        </div>
      </div>

      {/* 2. Main Analytics Section: 7-Day Timeline Chart (Left) + Cumulative Usage Frequency (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: 7-Day Stacked Activity Chart */}
        <div className="lg:col-span-7 xl:col-span-8 rounded-xl border border-border/70 bg-surface p-4 sm:p-5 relative flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <BarChart3 size={15} className="text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Dòng chảy thao tác 7 ngày qua
                </h4>
              </div>
              <span className="text-[11px] font-mono text-muted-foreground">
                Đỉnh tải: <b className="text-foreground">{maxTotal}</b> lượt/ngày
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Theo dõi biến động lượt duyệt, bàn giao, nhận trả và từ chối theo từng ngày.
            </p>
          </div>

          <div className="relative">
            {/* Subtle grid background lines */}
            <div className="absolute inset-x-2 top-4 bottom-8 flex flex-col justify-between pointer-events-none opacity-40">
              <div className="border-b border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono -mt-2">
                <span>{maxTotal}</span>
                <span>100%</span>
              </div>
              <div className="border-b border-dashed border-border flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono -mt-2">
                <span>{Math.round(maxTotal * 0.5)}</span>
                <span>50%</span>
              </div>
              <div className="border-b border-border flex items-center justify-between text-[10px] text-muted-foreground/80 font-mono -mt-2">
                <span>0</span>
                <span>0%</span>
              </div>
            </div>

            {/* Columns */}
            <div className="relative z-10 flex items-end gap-1.5 sm:gap-3 h-[155px] pt-4 px-1">
              {daily.map((d, i) => {
                const ap = d.approved || 0;
                const bo = d.borrowed || 0;
                const ret = d.returned || 0;
                const rj = d.rejected || 0;
                const sum = ap + bo + ret + rj;
                const today = i === daily.length - 1;
                const isHovered = hoveredDay?.date === d.date;

                const barH = sum > 0 ? Math.max(8, Math.round((sum / maxTotal) * 105)) : 0;
                const hPct = (n) => (sum > 0 ? `${(n / sum) * 100}%` : "0%");

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredDay(d)}
                    onMouseLeave={() => setHoveredDay(null)}
                    className={`flex-1 flex flex-col items-center justify-end h-full group cursor-pointer transition-all duration-200 rounded-lg p-1 ${
                      isHovered ? "bg-primary/5 ring-1 ring-primary/30" : "hover:bg-surface-elevated/50"
                    }`}
                  >
                    <span
                      className={`text-[11px] font-mono mb-1 transition-transform duration-200 ${
                        isHovered ? "scale-110 font-black text-primary" : today ? "font-bold text-primary" : "text-muted-foreground font-medium"
                      }`}
                    >
                      {sum > 0 ? sum : "—"}
                    </span>

                    <div className="w-full max-w-[34px] h-[110px] flex items-end justify-center rounded-md bg-slate-100/70 dark:bg-slate-800/40 p-0.5">
                      {sum > 0 ? (
                        <div
                          className={`w-full flex flex-col-reverse rounded-t-md overflow-hidden transition-all duration-300 ${
                            today ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""
                          } ${isHovered ? "shadow-md brightness-105" : ""}`}
                          style={{ height: `${barH}px` }}
                        >
                          {rj > 0 && <div style={{ height: hPct(rj) }} className="bg-slate-400 dark:bg-slate-500 w-full transition-all" title={`Từ chối: ${rj}`} />}
                          {ret > 0 && <div style={{ height: hPct(ret) }} className="bg-emerald-500 dark:bg-emerald-400 w-full transition-all" title={`Hoàn trả: ${ret}`} />}
                          {bo > 0 && <div style={{ height: hPct(bo) }} className="bg-violet-600 dark:bg-violet-500 w-full transition-all" title={`Bàn giao: ${bo}`} />}
                          {ap > 0 && <div style={{ height: hPct(ap) }} className="bg-blue-600 dark:bg-blue-500 w-full transition-all" title={`Duyệt: ${ap}`} />}
                        </div>
                      ) : (
                        <div className="w-full h-1 bg-border/60 rounded-full mb-0.5" />
                      )}
                    </div>

                    <div className="mt-2 text-center">
                      <span
                        className={`inline-block text-[11px] font-medium transition-colors ${
                          today
                            ? "px-1.5 py-0.2 rounded-sm bg-primary/10 text-primary font-bold"
                            : isHovered
                            ? "text-foreground font-semibold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {d.date}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dynamic Hover Breakdown or Legend */}
          {hoveredDay ? (
            <div className="mt-3 py-2 px-3 rounded-lg bg-surface-elevated border border-border/80 text-xs flex flex-wrap items-center justify-between gap-2 animate-in fade-in duration-150">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Calendar size={13} className="text-primary" />
                Chi tiết ngày <b className="font-mono text-primary">{hoveredDay.date}</b>:
              </span>
              <div className="flex flex-wrap items-center gap-3 font-mono text-[11.5px]">
                <span className="text-blue-600 dark:text-blue-400 font-medium">Duyệt: <b>{hoveredDay.approved || 0}</b></span>
                <span className="text-violet-600 dark:text-violet-400 font-medium">Bàn giao: <b>{hoveredDay.borrowed || 0}</b></span>
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">Hoàn trả: <b>{hoveredDay.returned || 0}</b></span>
                <span className="text-slate-500 font-medium">Từ chối: <b>{hoveredDay.rejected || 0}</b></span>
                <span className="text-foreground font-bold border-l border-border pl-2">
                  Tổng: {(hoveredDay.approved || 0) + (hoveredDay.borrowed || 0) + (hoveredDay.returned || 0) + (hoveredDay.rejected || 0)} lượt
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-border/60 text-xs text-muted-foreground">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-blue-600 dark:bg-blue-500 inline-block shadow-xs" />
                  Duyệt <b className="font-mono text-foreground">({totalApproved})</b>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-violet-600 dark:bg-violet-500 inline-block shadow-xs" />
                  Bàn giao <b className="font-mono text-foreground">({totalBorrowed})</b>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 dark:bg-emerald-400 inline-block shadow-xs" />
                  Nhận trả <b className="font-mono text-foreground">({totalReturned})</b>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-slate-400 dark:bg-slate-500 inline-block shadow-xs" />
                  Từ chối <b className="font-mono text-foreground">({totalRejected})</b>
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground italic hidden xl:inline">
                * Di chuột vào từng cột để xem chi tiết
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Cumulative Usage Frequency (Tần suất tích lũy) */}
        <div className="lg:col-span-5 xl:col-span-4 rounded-xl border border-border/70 bg-surface p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <Activity size={15} className="text-primary" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Cơ cấu tần suất thao tác
                </h4>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Tích lũy
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Tỷ trọng các hành động mượn trả từ khi khởi tạo phòng lab.
            </p>

            <div className="space-y-3">
              {["returned", "borrowed", "approved", "pending", "rejected"].map((actionKey) => {
                const count = Number(usage[actionKey] || 0);
                const pct = totalUsageEvents > 0 ? ((count / totalUsageEvents) * 100).toFixed(1) : 0;
                const barWidth = Math.max(3, Math.round((count / maxUsageCount) * 100));
                const style = actionStyles[actionKey];

                return (
                  <div key={actionKey} className="group">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${style.dot} shrink-0`} />
                        <span>{actionLabels[actionKey]}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded border ${style.badge}`}>
                          {pct}%
                        </span>
                        <span className="font-bold font-mono text-foreground shrink-0 text-right min-w-[45px]">
                          {count} <span className="text-[10.5px] font-normal text-muted-foreground font-sans">lượt</span>
                        </span>
                      </div>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800/80 ring-1 ring-border/40 p-0.5">
                      <div
                        className={`h-full rounded-full ${style.color} transition-all duration-700 ease-out group-hover:brightness-110 shadow-xs`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Tổng cộng lịch sử:</span>
            <span className="font-bold font-mono text-foreground">{totalUsageEvents} lượt thao tác</span>
          </div>
        </div>
      </div>

      {/* 3. Phân bố trạng thái kho thiết bị */}
      <div className="rounded-xl border border-border/70 bg-surface p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <PieChart size={15} className="text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Phân bố trạng thái kho thiết bị
            </h4>
          </div>
          <span className="text-xs font-mono font-semibold text-muted-foreground">
            Tổng cộng: <b className="text-foreground">{devices.length}</b> thiết bị
          </span>
        </div>

        {/* Sleek Segmented Bar */}
        <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden flex gap-0.5 p-0.5 ring-1 ring-border/50">
          {seg
            .filter((x) => x.n > 0)
            .map((x, i) => (
              <div
                key={i}
                className={`${x.color} h-full rounded-sm transition-all duration-500 hover:opacity-90`}
                style={{ width: `${(x.n / total) * 100}%` }}
                title={`${x.label}: ${x.n} máy (${((x.n / total) * 100).toFixed(1)}%)`}
              />
            ))}
        </div>

        {/* Status Breakdown Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3.5">
          {seg.map((x, i) => {
            const pct = ((x.n / total) * 100).toFixed(1);
            return (
              <div
                key={i}
                onClick={() => onNavigate?.("Thiết bị")}
                className={`p-2.5 rounded-lg border bg-surface-elevated/30 hover:bg-surface-elevated cursor-pointer transition flex flex-col justify-between ${x.border}`}
              >
                <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-muted-foreground truncate">
                  <span className={`w-2 h-2 rounded-full ${x.dot} shrink-0`} />
                  <span className="truncate">{x.label}</span>
                </div>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-base font-bold font-mono text-foreground">{x.n}</span>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Action triggers for LabManager */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2.5 flex items-center justify-between">
          <span>Tác vụ vận hành cần lưu ý</span>
          <span className="text-[11px] normal-case text-muted-foreground font-normal">Bấm để điều hướng nhanh đến danh mục</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {chips.map((c, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onNavigate("Yêu cầu mượn", chipFocusMap[c.label] ? { requestId: chipFocusMap[c.label] } : null)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ${c.tone}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`} />
              <span>{c.label}</span>
              <span className="font-mono px-1.5 py-0.5 rounded-md bg-background/80 text-foreground font-bold text-[11px] shadow-xs">
                {c.n}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => onNavigate("Bảo trì")}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 ${
              maint > 0
                ? "border-amber-400/80 bg-amber-50/70 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${maint > 0 ? "bg-amber-500 animate-pulse" : "bg-muted-foreground"}`} />
            <span>Bảo trì / Sửa chữa</span>
            <span className="font-mono px-1.5 py-0.5 rounded-md bg-background/80 text-foreground font-bold text-[11px] shadow-xs">
              {maint}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard({ section = "Tổng quan", onNavigate, focusTarget = null }) {
  const { data, offline, setData, refresh } = useDashboardData(true);
  const now = useRealtimeClock(3000);
  
  const overdueRequests = useMemo(() => {
    return (data.requests || []).filter(
      (r) => r.status === "borrowed" && r.requested_to && new Date(r.requested_to) < now
    );
  }, [data.requests, now]);

  // Tổng quan chỉ hiển thị yêu cầu cần hành động (loại returned/rejected),
  // sắp theo độ khẩn: quá hạn → chờ duyệt → chờ nhận trả → chờ bàn giao.
  const actionableRequests = useMemo(() => {
    const statusWeight = { pending: 1, return_pending: 2, approved: 3, borrowed: 4 };
    const overdueOf = (r) => (r.status === "borrowed" && r.requested_to && new Date(r.requested_to) < now ? 0 : 9);
    return (data.requests || [])
      .filter((r) => r.status in statusWeight)
      .sort(
        (a, b) =>
          overdueOf(a) - overdueOf(b) ||
          statusWeight[a.status] - statusWeight[b.status] ||
          new Date(b.created_at || 0) - new Date(a.created_at || 0)
      );
  }, [data.requests, now]);
  const reqPendingCount = actionableRequests.filter((r) => r.status === "pending").length;
  const reqReturnPendingCount = actionableRequests.filter((r) => r.status === "return_pending").length;
  const reqApprovedCount = actionableRequests.filter((r) => r.status === "approved").length;

  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [reqFilter, setReqFilter] = useState("all");
  const [borrowModal, setBorrowModal] = useState({ open: false, device: null });
  const [incidentModal, setIncidentModal] = useState({ open: false, item: null });

  // Modals
  const [deviceModal, setDeviceModal] = useState(false);
  const [editDeviceModal, setEditDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);
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

  const [confirmReturnModal, setConfirmReturnModal] = useState({ open: false, item: null });

  function returnDevice(item) {
    setConfirmReturnModal({ open: true, item });
  }

  async function handleConfirmReturn(item, { condition, notes }) {
    try {
      const updated = await api.confirmReturn(item.id, { condition, notes });
      const isFaulty = condition && (condition.toLowerCase().includes("hỏng") || condition.toLowerCase().includes("lỗi"));
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? {
          ...d,
          status: isFaulty ? "maintenance" : "available",
          condition: condition || d.condition
        } : d),
      }));
      setToast({ 
        message: isFaulty 
          ? "Đã nhận trả thiết bị. Thiết bị phát hiện lỗi, hệ thống đã chuyển sang chế độ Bảo trì." 
          : "Đã kiểm tra và hoàn tất nhận trả thiết bị vào kho an toàn.", 
        type: isFaulty ? "warning" : "success" 
      });
      setConfirmReturnModal({ open: false, item: null });
    } catch (error) {
      setToast({ message: error.message || "Không thể xác nhận trả thiết bị.", type: "error" });
    }
  }

  async function recallDevice(item) {
    if (!window.confirm(`Bạn có chắc chắn muốn gửi yêu cầu thu hồi thiết bị #${item.device_id} ngay lập tức?`)) return;
    setToast({ message: `Đã phát yêu cầu thu hồi đối với thiết bị #${item.device_id}.`, type: "info" });
  }

  async function handleUpdateDevice(id, payload) {
    try {
      const updated = await api.updateDevice(id, payload);
      setData((current) => ({ ...current, devices: current.devices.map((d) => d.id === id ? updated : d) }));
      setToast({ message: `Đã cập nhật thiết bị ${updated.name}`, type: "success" });
      setEditDeviceModal(false);
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật thiết bị.", type: "error" });
    }
  }

  async function handleDeleteDevice(item) {
    if (!window.confirm(`Bạn có chắc chắn muốn thanh lý / xóa thiết bị "${item.name}" (${item.asset_code}) không?`)) return;
    try {
      await api.deleteDevice(item.id);
      setData((current) => ({ ...current, devices: current.devices.filter((d) => d.id !== item.id) }));
      setToast({ message: `Đã thanh lý/xóa thiết bị ${item.name}`, type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể xóa thiết bị.", type: "error" });
    }
  }

  async function createDevice() {
    try {
      const created = await api.createDevice(deviceForm);
      setData((current) => ({ ...current, devices: [created, ...current.devices] }));
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
      setData((current) => ({ ...current, users: [created, ...current.users] }));
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
      focusId={focusTarget} 
      onRequestStatus={updateRequest} 
      onHandover={handoverRequest}
      onReturnDevice={returnDevice}
      onRecallDevice={recallDevice}
      onOpenDeviceForm={() => setDeviceModal(true)}
      onDeviceStatus={updateDeviceStatus}
      role="admin"
      onOpenEditDevice={(dev) => { setSelectedDevice(dev); setEditDeviceModal(true); }}
      onDeleteDevice={handleDeleteDevice}
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
      <DeviceEditModal open={editDeviceModal} device={selectedDevice} onClose={() => setEditDeviceModal(false)} onSave={handleUpdateDevice} />
      <UserCreateModal open={userModal} onClose={() => setUserModal(false)} onSubmit={createUser} />
      <UserEditModal open={editUserModal} user={selectedUser} onClose={() => setEditUserModal(false)} onSave={handleUpdateUser} />
      <AdminResetPasswordModal open={resetPwdModal} user={selectedUser} onClose={() => setResetPwdModal(false)} onReset={handleResetPassword} />
      <ConfirmReturnModal open={confirmReturnModal.open} item={confirmReturnModal.item} device={data.devices.find((d) => d.id === confirmReturnModal.item?.device_id)} onClose={() => setConfirmReturnModal({ open: false, item: null })} onSubmit={handleConfirmReturn} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );



  const pendingCount = data.requests.filter((r) => r.status === "pending").length;
  const availableCount = data.devices.filter((d) => d.status === "available").length;

  const currentRole = sessionStorage.getItem("lab_role") || localStorage.getItem("lab_role") || "admin";
  const profileName = roles[currentRole]?.name || "Quản lý phòng lab";

  return (
    <>
      <PageHeader
        eyebrow="Khu vực quản lý"
        title={`Xin chào, ${user?.full_name || profileName}`}
        description="Tổng quan vận hành và thống kê tài nguyên phòng thí nghiệm."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <KPICard label="Tổng thiết bị" value={data.stats.devices} icon={Cpu} hint={`${availableCount} sẵn sàng`} />
        <KPICard label="Yêu cầu mượn" value={data.stats.requests} icon={Package} tone="blue" hint={`${pendingCount} chờ duyệt`} />
        <KPICard 
          label="Quá hạn hoàn trả" 
          value={overdueRequests.length} 
          icon={AlertTriangle} 
          tone={overdueRequests.length > 0 ? "rose" : "slate"} 
          hint={overdueRequests.length > 0 ? "Cần thu hồi ngay!" : "0 thiết bị quá hạn"} 
        />
        <KPICard label="Cần kiểm tra" value={data.stats.maintenance_open} icon={Wrench} tone="amber" />
        <KPICard label="Người dùng" value={data.stats.users} icon={Users} tone="green" />
      </div>

      {overdueRequests.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent p-5 shadow-lg border-l-8 border-l-rose-600 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 animate-bounce">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <h4 className="text-base font-extrabold text-rose-700 dark:text-rose-400">
                  🚨 CẢNH BÁO QUẢN LÝ: CÓ {overdueRequests.length} THIẾT BỊ ĐANG MƯỢN ĐÃ QUÁ HẠN HOÀN TRẢ!
                </h4>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => onNavigate?.("Yêu cầu mượn", overdueRequests[0] ? { requestId: overdueRequests[0].id } : null)}
                  className="border-rose-400 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/60 font-bold text-xs"
                >
                  Xem danh sách chi tiết ➔
                </Button>
              </div>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-1">
                Cán bộ quản lý cần liên hệ người mượn hoặc bấm nút &quot;Thu hồi&quot; để cảnh báo yêu cầu hoàn trả thiết bị về kho lab.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {overdueRequests.map((r) => {
                  const dev = (data.devices || []).find((d) => d.id === r.device_id) || {};
                  const borrower = (data.users || []).find((u) => u.id === r.user_id) || {};
                  const diffMs = now - new Date(r.requested_to);
                  return (
                    <div key={r.id} className="p-3 rounded-xl bg-surface/90 border border-rose-300 dark:border-rose-900 shadow-sm flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-foreground truncate">{dev.name} ({dev.asset_code})</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          Người mượn: <strong className="text-blue-600 dark:text-blue-400">{borrower.full_name || `@${borrower.username || r.user_id}`}</strong>
                        </p>
                        <p className="text-[11px] font-extrabold text-rose-600 dark:text-rose-400 mt-0.5">
                          Quá hạn: {formatOverdueDuration(diffMs)} (Hạn: {new Date(r.requested_to).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {new Date(r.requested_to).toLocaleDateString("vi-VN")})
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {["pending_inspection", "in_progress", "replace_partial", "replace_full"].includes(dev.status) ? (
                          <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-950/60 px-2.5 py-1 rounded-lg border border-orange-300 dark:border-orange-800 flex items-center gap-1">
                            <AlertTriangle size={12} /> Đang báo sự cố
                          </span>
                        ) : (
                          <>
                            <Button size="sm" variant="danger" onClick={() => recallDevice(r)} className="text-xs px-2.5 py-1">
                              Thu hồi
                            </Button>
                            <Button size="sm" onClick={() => returnDevice(r)} className="text-xs px-2.5 py-1 bg-emerald-600 text-white hover:bg-emerald-500">
                              Nhận trả
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* === CẢNH BÁO SỰ CỐ KHẨN CẤP === */}
      {(() => {
        const openIncidents = (data.maintenance || []).filter(m => m.kind === "incident" && (m.status === "open" || m.status === "in_progress"));
        const pendingInspectionDevices = (data.devices || []).filter(d => d.status === "pending_inspection");
        if (openIncidents.length === 0 && pendingInspectionDevices.length === 0) return null;
        return (
          <div className="mt-6 rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-transparent p-5 shadow-lg border-l-8 border-l-orange-600">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-600 text-white shrink-0 animate-bounce">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <h4 className="text-base font-extrabold text-orange-700 dark:text-orange-400">
                    🔧 SỰ CỐ THIẾT BỊ: CÓ {openIncidents.length} BÁO CÁO SỰ CỐ ĐANG CHỜ XỬ LÝ
                  </h4>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => onNavigate?.("Bảo trì")} 
                    className="border-orange-400 text-orange-600 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-orange-950/60 font-bold text-xs"
                  >
                    Quản lý bảo trì ➔
                  </Button>
                </div>
                <p className="text-xs text-orange-600/90 dark:text-orange-300/90 mt-1">
                  Người dùng đã báo cáo sự cố thiết bị. Kĩ thuật viên cần tiếp nhận kiểm tra và xử lý khẩn cấp.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {openIncidents.map((m) => {
                    const dev = (data.devices || []).find(d => d.id === m.device_id) || {};
                    const isOpen = m.status === "open";
                    return (
                      <div key={m.id} className={`p-3 rounded-xl bg-surface/90 border shadow-sm ${isOpen ? "border-orange-400 dark:border-orange-800" : "border-blue-300 dark:border-blue-800"}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-foreground truncate">{dev.name || `Thiết bị #${m.device_id}`} ({dev.asset_code || "?"})</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.notes}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <StatusBadge status={m.status} />
                              <StatusBadge status={dev.status || "unknown"} />
                            </div>
                          </div>
                          {isOpen && (
                            <Button 
                              size="sm" 
                              className="text-xs px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-500 shrink-0 font-bold"
                              onClick={async () => {
                                try {
                                  await api.acceptIncident(m.id);
                                  refresh();
                                } catch (e) { console.error(e); }
                              }}
                            >
                              ✅ Tiếp nhận kiểm tra
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Hoạt động phòng lab: biểu đồ 7 ngày + phân bố trạng thái (thay bảng kiểm soát nhanh vốn trùng lặp mục Thiết bị) */}
      <div className="mt-6">
        <div className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <h3 className="text-[15px] font-bold">Hoạt động phòng lab — 7 ngày</h3>
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/60 dark:border-blue-900/60 rounded-md px-2 py-0.5">Đề tài 23 · Real-time</span>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Tổng hợp từ lịch sử sử dụng — thay cho bảng kiểm soát nhanh, xem/sửa chi tiết từng máy ở mục Thiết bị.</p>
          <ActivityPanel stats={data.stats} devices={data.devices} requests={data.requests}
            overdueCount={overdueRequests.length} pendingCount={reqPendingCount}
            returnPendingCount={reqReturnPendingCount} approvedCount={reqApprovedCount}
            chipFocusMap={{
              "Quá hạn": overdueRequests[0]?.id,
              "Chờ duyệt": actionableRequests.find((r) => r.status === "pending")?.id,
              "Chờ nhận trả": actionableRequests.find((r) => r.status === "return_pending")?.id,
              "Chờ bàn giao": actionableRequests.find((r) => r.status === "approved")?.id,
            }}
            onNavigate={onNavigate} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5 sm:p-6 overflow-hidden flex flex-col">
          <SectionTitle title="Yêu cầu cần xử lý & Bàn giao" />
          {actionableRequests.length ? (
            <>
              {/* Chip lọc nhanh theo nhóm cần hành động */}
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  { key: "all", label: "Tất cả", count: actionableRequests.length, tone: "border-border text-foreground" },
                  { key: "overdue", label: "Quá hạn", count: overdueRequests.length, tone: overdueRequests.length ? "border-rose-300 text-rose-600 dark:border-rose-800 dark:text-rose-300" : "border-border text-muted-foreground" },
                  { key: "pending", label: "Chờ duyệt", count: reqPendingCount, tone: reqPendingCount ? "border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-300" : "border-border text-muted-foreground" },
                  { key: "return_pending", label: "Chờ nhận trả", count: reqReturnPendingCount, tone: reqReturnPendingCount ? "border-blue-300 text-blue-700 dark:border-blue-800 dark:text-blue-300" : "border-border text-muted-foreground" },
                  { key: "approved", label: "Chờ bàn giao", count: reqApprovedCount, tone: reqApprovedCount ? "border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-300" : "border-border text-muted-foreground" },
                ].map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={() => setReqFilter(chip.key)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition ${
                      reqFilter === chip.key
                        ? "bg-primary/10 text-primary border-primary/40 ring-1 ring-primary/30"
                        : "bg-surface hover:bg-surface-elevated"
                    } ${chip.tone}`}
                  >
                    {chip.label} <span className="font-mono">{chip.count}</span>
                  </button>
                ))}
              </div>

              {/* Danh sách nén: tối đa 6 dòng theo độ khẩn, thao tác đầy đủ ở mục Yêu cầu mượn */}
              <div className="mt-4 divide-y divide-border border-y border-border">
                {(reqFilter === "all"
                  ? actionableRequests
                  : reqFilter === "overdue"
                    ? overdueRequests
                    : actionableRequests.filter((r) => r.status === reqFilter)
                )
                  .slice(0, 6)
                  .map((r) => {
                    const dev = data.devices.find((d) => d.id === r.device_id) || {};
                    const borrower = (data.users || []).find((u) => u.id === r.user_id);
                    const isOverdue = r.status === "borrowed" && r.requested_to && new Date(r.requested_to) < now;
                    const statusLabel = { pending: "Chờ duyệt", return_pending: "Chờ nhận trả", approved: "Chờ bàn giao", borrowed: "Đang mượn" }[r.status] || r.status;
                    const statusTone = isOverdue
                      ? "text-rose-600 dark:text-rose-300"
                      : { pending: "text-amber-600 dark:text-amber-300", return_pending: "text-blue-600 dark:text-blue-300", approved: "text-emerald-600 dark:text-emerald-300", borrowed: "text-muted-foreground" }[r.status];
                    return (
                      <div className="py-2.5 flex items-center gap-3" key={r.id}>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{dev.name || `Thiết bị #${r.device_id}`}</p>
                            <span className="text-[11px] font-mono text-muted-foreground shrink-0">{dev.asset_code || "?"}</span>
                            {isOverdue && (
                              <span className="shrink-0 inline-flex items-center rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 px-2 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-300 animate-pulse">
                                QUÁ HẠN · {formatOverdueDuration(now - new Date(r.requested_to))}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {borrower?.full_name || `#${r.user_id}`} · {r.purpose}
                          </p>
                        </div>
                        {r.status === "pending" ? (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={() => updateRequest(r, "approved")}>Duyệt</Button>
                            <Button size="sm" variant="outline" className="h-7 px-2.5 text-xs" onClick={() => updateRequest(r, "rejected")}>Từ chối</Button>
                          </div>
                        ) : (
                          <span className={`shrink-0 text-[11px] font-bold ${statusTone}`}>{statusLabel}</span>
                        )}
                      </div>
                    );
                  })}
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Hiển thị {Math.min(6, reqFilter === "all" ? actionableRequests.length : reqFilter === "overdue" ? overdueRequests.length : actionableRequests.filter((r) => r.status === reqFilter).length)} /{" "}
                  {reqFilter === "all" ? actionableRequests.length : reqFilter === "overdue" ? overdueRequests.length : actionableRequests.filter((r) => r.status === reqFilter).length} yêu cầu cần xử lý
                </span>
                <Button size="sm" variant="outline" onClick={() => onNavigate?.("Yêu cầu mượn")}>
                  Xem tất cả ➔
                </Button>
              </div>
            </>
          ) : (
            <Empty text="Không có yêu cầu nào cần xử lý. Tất cả đã hoàn tất." />
          )}
        </Card>
        <div className="flex flex-col gap-6 min-w-0">
          <AIChatPanel title="AI Summary" mode="summary" starter="Tôi có thể tóm tắt tình trạng thiết bị, yêu cầu và bảo trì từ dữ liệu hiện có." />
        </div>
      </div>
      <ConfirmReturnModal open={confirmReturnModal.open} item={confirmReturnModal.item} device={data.devices.find((d) => d.id === confirmReturnModal.item?.device_id)} onClose={() => setConfirmReturnModal({ open: false, item: null })} onSubmit={handleConfirmReturn} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* User dashboard (Clear Borrow & Return Flow)                         */
/* ------------------------------------------------------------------ */
function UserDashboard({ section = "Tổng quan", onNavigate, focusTarget = null }) {
  const { data, offline, setData } = useDashboardData();
  const { user } = useAuth();
  const now = useRealtimeClock(3000);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [borrowModal, setBorrowModal] = useState({ open: false, device: null });
  const [incidentModal, setIncidentModal] = useState({ open: false, item: null });

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

  // Quá hạn mượn của tài khoản hiện tại
  const myOverdueLoans = useMemo(() => {
    return (data.requests || []).filter(
      (r) => r.status === "borrowed" && r.requested_to && new Date(r.requested_to) < now
    );
  }, [data.requests, now]);

  // Active loans for the current user (borrowed, approved, or waiting for lab return inspection)
  const myActiveLoans = (data.requests || []).filter((r) => r.status === "borrowed" || r.status === "approved" || r.status === "return_pending");

  function borrow(device) {
    setBorrowModal({ open: true, device });
  }

  async function handleConfirmBorrow(form) {
    try {
      const item = await api.borrow(borrowModal.device.id, form.purpose, form.requested_to, form.requested_from);
      setData((current) => ({ ...current, requests: [item, ...current.requests] }));
      setToast({ message: "Đã gửi yêu cầu mượn thành công. Vui lòng chờ Quản lý duyệt.", type: "success" });
      setBorrowModal({ open: false, device: null });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu mượn khi API chưa khả dụng", type: "error" });
    }
  }

  async function handleReportIncident(description) {
    try {
      const updated = await api.reportIncident(incidentModal.item.id, description);
      const [devices, requests] = await Promise.all([api.devices(), api.requests()]);
      setData((current) => ({ ...current, devices, requests }));
      setToast({ message: "Đã gửi báo cáo sự cố khẩn cấp thành công. Kỹ thuật viên sẽ kiểm tra máy.", type: "success" });
      setIncidentModal({ open: false, item: null });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi báo cáo sự cố.", type: "error" });
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
      const updated = await api.requestReturn(item.id);
      setData((current) => ({
        ...current,
        requests: current.requests.map((row) => row.id === item.id ? updated : row),
        devices: current.devices.map((d) => d.id === item.device_id ? { ...d, status: "returning" } : d),
      }));
      setToast({ 
        message: "Đã gửi yêu cầu hoàn trả thiết bị! Vui lòng mang thiết bị đến bàn giao cho Cán bộ phòng lab để kiểm tra nghiệm thu.", 
        type: "success" 
      });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu trả thiết bị.", type: "error" });
    }
  }

  
  const myPending = data.requests.filter((r) => r.status === "pending").length;
  const myBorrowed = data.requests.filter((r) => r.status === "borrowed").length;
  const myReturned = data.requests.filter((r) => r.status === "returned").length;

  if (section === "Lượt mượn của tôi" || section === "Trợ lý AI") return (
    <>
      <PageHeader eyebrow="Khu vực người sử dụng" title={section} description="Theo dõi các lượt mượn của bạn và tra cứu thông tin." />
      {offline && <OfflineNotice />}
      <WorkspaceSection 
        section={section} 
        role="user" 
        data={{ ...data, onReturn: returnBorrow, onHandover: handover }} 
        onBorrow={borrow} 
        onDownloadReportTXT={downloadReportTXT} 
        onPrintReportPDF={printReportPDF} 
        onNavigate={onNavigate}
        focusId={focusTarget}
      />
      <BorrowModal open={borrowModal.open} device={borrowModal.device} onClose={() => setBorrowModal({ open: false, device: null })} onSubmit={handleConfirmBorrow} />
      <IncidentModal open={incidentModal.open} item={incidentModal.item} onClose={() => setIncidentModal({ open: false, item: null })} onSubmit={handleReportIncident} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );

  if (section === "Thiết bị") return (
    <>
      <PageHeader eyebrow="Khu vực người sử dụng" title="Tra cứu Thiết bị" description="Tìm kiếm thiết bị khả dụng trong phòng thí nghiệm để đăng ký mượn." />
      {offline && <OfflineNotice />}
      
      <Card className="mt-6 p-4 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3">
          <form onSubmit={(e) => e.preventDefault()} className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm thiết bị theo tên, mã tài sản, nhóm..."
                className="h-10 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-xs text-foreground placeholder:text-muted-foreground outline-none transition focus:border-blue-500"
              />
            </div>
            <Button type="submit" size="sm" className="gap-1.5 shrink-0">
              <Search size={14} /> Tìm kiếm
            </Button>
          </form>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0"><Filter size={13} /> Nhóm:</span>
            <Select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)} 
              className="h-10 w-36 text-xs"
            >
              {categories.map((cat) => (
                <option value={cat} key={cat}>{cat === "all" ? "Tất cả nhóm" : getCategoryLabel(cat)}</option>
              ))}
            </Select>
          </div>
          <Badge tone="slate" className="shrink-0">{filteredDevices.length} thiết bị sẵn sàng</Badge>
        </div>
      </Card>

      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <SectionTitle title="Kho thiết bị sẵn sàng mượn" />
        {filteredDevices.length ? (
          <div className="grid gap-3 md:grid-cols-2 mt-4">
            {filteredDevices.map((device) => (
              <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-slate-200 dark:border-slate-800 dark:hover:border-slate-700 min-w-0" key={device.id}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 shrink-0"><Cpu size={17} /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-800 dark:text-slate-200">{device.name}</p>
                  <p className="mt-1 text-xs text-slate-400 truncate">{device.asset_code} • {getCategoryLabel(device.category)} • <StatusBadge status={device.status} role="user" /></p>
                </div>
                {device.status === "available" ? (
                  <Button size="sm" onClick={() => borrow(device)} className="shrink-0">Mượn</Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="shrink-0 opacity-60 text-xs cursor-not-allowed">Đang bận</Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty text="Không tìm thấy thiết bị khả dụng phù hợp." />
        )}
      </Card>

      <BorrowModal open={borrowModal.open} device={borrowModal.device} onClose={() => setBorrowModal({ open: false, device: null })} onSubmit={handleConfirmBorrow} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );

  // Tổng quan
  return (
    <>
      <PageHeader
        eyebrow="Khu vực người sử dụng"
        title={`Xin chào, ${user?.full_name || "người dùng phòng lab"}`}
        description="Theo dõi thiết bị đang giữ và đăng ký mượn thiết bị phục vụ thực hành."
      />
      {offline && <OfflineNotice />}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard 
          label="Đang giữ / Sử dụng" 
          value={myBorrowed} 
          icon={Package} 
          tone={myOverdueLoans.length > 0 ? "rose" : "blue"} 
          hint={myOverdueLoans.length > 0 ? `⚠️ ${myOverdueLoans.length} thiết bị quá hạn!` : undefined} 
        />
        <KPICard label="Chờ duyệt" value={myPending} icon={ClipboardCheck} tone="amber" />
        <KPICard label="Đã hoàn trả" value={myReturned} icon={CheckCircle2} tone="green" />
        <KPICard label="Thiết bị khả dụng" value={data.devices.filter((item) => item.status === "available").length} icon={Cpu} tone="blue" />
      </div>

      {/* Cảnh báo quá hạn khẩn cấp cho người mượn */}
      {myOverdueLoans.length > 0 && (
        <div className="mt-6 rounded-2xl border-2 border-rose-500 bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent p-5 shadow-lg border-l-8 border-l-rose-600 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600 text-white shrink-0 animate-bounce">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-base font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-2">
                ⚠️ CẢNH BÁO QUÁ HẠN: BẠN CÓ {myOverdueLoans.length} THIẾT BỊ ĐÃ QUÁ THỜI GIAN HOÀN TRẢ!
              </h4>
              <p className="text-xs text-rose-600/90 dark:text-rose-300/90 mt-1">
                Quy chế phòng lab yêu cầu hoàn trả thiết bị đúng hạn để không ảnh hưởng lịch thực hành của sinh viên và nhóm nghiên cứu khác. Vui lòng mang thiết bị đến bàn giao cho Cán bộ phòng lab và nhấn &quot;Báo hoàn trả ngay&quot;.
              </p>
              <div className="mt-3 space-y-2">
                {myOverdueLoans.map((item) => {
                  const dev = data.devices.find((d) => d.id === item.device_id) || {};
                  const diffMs = now - new Date(item.requested_to);
                  return (
                    <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-surface/90 border border-rose-300 dark:border-rose-900 shadow-sm">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{dev.name}</span>
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-surface-elevated border text-muted-foreground">{dev.asset_code}</span>
                        </div>
                        <div className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                          Hạn trả: {new Date(item.requested_to).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {new Date(item.requested_to).toLocaleDateString("vi-VN")} • <span className="font-black text-rose-700 dark:text-rose-300">ĐÃ QUÁ HẠN {formatOverdueDuration(diffMs).toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" onClick={() => returnBorrow(item)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow">
                          <RotateCcw size={14} /> Báo hoàn trả ngay
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setIncidentModal({ open: true, item })}>
                          <AlertTriangle size={14} /> Báo sự cố
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

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
              const isOverdue = item.status === "borrowed" && item.requested_to && new Date(item.requested_to) < now;
              const diffMs = isOverdue ? now - new Date(item.requested_to) : 0;
              return (
                <div key={item.id} className={`py-3.5 first:pt-0 last:pb-0 flex flex-wrap items-center justify-between gap-3 rounded-xl transition ${isOverdue ? "bg-rose-50/70 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 p-3 my-1" : ""}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm text-foreground truncate">
                        {dev.name || `Thiết bị #${item.device_id}`}
                      </p>
                      {dev.asset_code && (
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                          {dev.asset_code}
                        </span>
                      )}
                      {isOverdue && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-rose-600 text-white px-2 py-0.5 text-[10px] font-extrabold shadow-sm animate-pulse">
                          <AlertTriangle size={11} /> QUÁ HẠN {formatOverdueDuration(diffMs).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Mã: {dev.asset_code || "—"} • Mục đích: {item.purpose}
                      {item.requested_to && (
                        <> • Hạn trả: <strong className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold font-mono" : "text-blue-600 dark:text-blue-400 font-mono"}>{new Date(item.requested_to).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} {new Date(item.requested_to).toLocaleDateString("vi-VN")}</strong></>
                      )}
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
                      <>
                        <Button size="sm" variant={isOverdue ? "default" : "outline"} onClick={() => returnBorrow(item)} className={isOverdue ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold gap-1.5 shadow" : "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 gap-1.5"} title="Bấm để gửi yêu cầu hoàn trả thiết bị về phòng thí nghiệm">
                          <RotateCcw size={14} /> Báo hoàn trả
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setIncidentModal({ open: true, item })} title="Báo cáo sự cố khi thiết bị gặp trục trặc, lỗi, chập cháy">
                          <AlertTriangle size={14} /> Báo sự cố
                        </Button>
                      </>
                    )}
                    {item.status === "return_pending" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        <RotateCcw size={12} className="animate-spin" /> Chờ Lab Manager nhận trả
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-3">Bạn hiện không giữ hoặc chờ nhận thiết bị nào. Hãy chọn mục Thiết bị để mượn.</p>
        )}
      </Card>

      <div className="mt-6">
        <AIChatPanel title="Trợ lý AI" starter="Xin chào! Tôi có thể giúp tra cứu hướng dẫn sử dụng, quy trình an toàn và thông tin thiết bị." />
      </div>

      <IncidentModal open={incidentModal.open} item={incidentModal.item} onClose={() => setIncidentModal({ open: false, item: null })} onSubmit={handleReportIncident} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );

}


/* ------------------------------------------------------------------ */
/* Technician dashboard                                                */
/* ------------------------------------------------------------------ */

function MaintenanceModal({ open, mode, item, devices = [], onClose, onSubmit, onDelete }) {
  const currentDevice = devices.find(d => d.id === (item?.device_id || devices[0]?.id));
  const [form, setForm] = useState({ 
    device_id: "", 
    notes: "", 
    status: "open", 
    kind: "inspection",
    device_condition: ""
  });
  
  const prevOpenRef = useRef(false);
  const prevItemIdRef = useRef(null);
  
  useEffect(() => {
    const isNewlyOpened = open && !prevOpenRef.current;
    const isItemChanged = open && (item?.id !== prevItemIdRef.current || mode !== prevItemIdRef.current_mode);

    if (isNewlyOpened || isItemChanged) {
      if (mode === "create") {
        const firstDev = devices.find(d => d.id === (item?.device_id || devices[0]?.id));
        setForm({ 
          device_id: item?.device_id || devices[0]?.id || "", 
          notes: item?.notes || "", 
          status: item?.status || "open", 
          kind: item?.kind || "inspection",
          device_condition: firstDev?.condition || "Mới nguyên hộp"
        });
      } else if (item) {
        const dev = devices.find(d => d.id === item.device_id);
        setForm({ 
          device_id: item.device_id, 
          notes: item.notes || "", 
          status: item.status || "open", 
          kind: item.kind || "inspection",
          device_condition: dev?.condition || "Đã qua sử dụng - Hoạt động tốt"
        });
      }
    }
    prevOpenRef.current = open;
    prevItemIdRef.current = item?.id;
    prevItemIdRef.current_mode = mode;
  }, [open, mode, item?.id]);

  if (!open) return null;

  const targetDev = devices.find(d => d.id === Number(form.device_id)) || currentDevice;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface border border-border p-6 shadow-2xl text-foreground">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {mode === "create" ? "Thêm mới / Lên lịch bảo trì" : "Cập nhật kết quả kiểm tra & Bảo trì"}
        </h3>
        <div className="space-y-4 text-xs">
          <div>
            <label className="mb-1.5 block font-semibold text-foreground">Thiết bị cần xử lý</label>
            <select
              value={form.device_id}
              onChange={(e) => {
                const devId = e.target.value;
                const d = devices.find(x => x.id === Number(devId));
                setForm({ ...form, device_id: devId, device_condition: d?.condition || form.device_condition });
              }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-blue-500 focus:outline-none"
              disabled={mode === "update"}
            >
              {devices.map(d => (
                <option key={d.id} value={d.id} className="bg-surface text-foreground">
                  #{d.id} - {d.name} ({d.asset_code}) [Hiện tại: {d.status}]
                </option>
              ))}
            </select>
            {targetDev && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Tình trạng hiện tại của máy: <strong className="text-foreground">{targetDev.condition || "Bình thường"}</strong> • Trạng thái kho: <strong className="text-blue-600 dark:text-blue-400">{statusMeta[targetDev.status]?.label || targetDev.status}</strong>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-foreground">1. Kết quả kiểm tra / Trạng thái thiết bị</label>
            <select
              value={form.status}
              onChange={(e) => {
                const nextStatus = e.target.value;
                if (nextStatus === "in_progress" || nextStatus === "open") {
                  setForm({ ...form, status: nextStatus, device_condition: "" });
                } else {
                  setForm({ ...form, status: nextStatus });
                }
              }}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-blue-500 focus:outline-none"
            >
              <option value="in_progress" className="bg-surface text-foreground">🔄 Đang tiến hành kiểm tra / Đang xử lý</option>
              <option value="completed" className="bg-surface text-foreground">✅ Hoàn thành / Bình thường (Đưa máy về kho Sẵn sàng)</option>
              <option value="replace_partial" className="bg-surface text-foreground">⚠️ Sửa chữa 1 phần / Thay linh kiện phụ trợ</option>
              <option value="replace_full" className="bg-surface text-foreground">❌ Phải thay thế mới / Hỏng nặng không thể phục hồi</option>
              <option value="open" className="bg-surface text-foreground">📋 Chờ tiếp nhận / Lên lịch bảo trì mới</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-foreground">2. Đánh giá tình trạng vật lý của thiết bị</label>
            <select
              value={form.device_condition || ""}
              onChange={(e) => setForm({ ...form, device_condition: e.target.value })}
              className={`w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-semibold text-foreground focus:border-blue-500 focus:outline-none ${
                (form.status === "in_progress" || form.status === "open") ? "opacity-60 cursor-not-allowed" : ""
              }`}
              disabled={form.status === "in_progress" || form.status === "open"}
            >
              <option value="">--- Chưa đánh giá / Đang tiến hành kiểm tra ---</option>
              {DEVICE_CONDITIONS.map(c => (
                <option key={c.value} value={c.value} className="bg-surface text-foreground">
                  {c.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-muted-foreground">
              { (form.status === "in_progress" || form.status === "open") 
                ? "Mục này tạm khóa vì thiết bị chưa có kết quả kiểm tra cuối cùng."
                : "Bạn có thể tự do bấm chọn bất kỳ tình trạng vật lý nào ở trên để cập nhật vào hồ sơ thiết bị." }
            </p>
          </div>

          <div>
            <label className="mb-1.5 block font-semibold text-foreground">3. Ghi chú kỹ thuật chi tiết</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Ghi rõ hiện tượng lỗi, linh kiện đã thay thế, thông số kiểm định hoặc khuyến cáo sử dụng..."
            />
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 pt-2 border-t border-border">
            {mode === "update" ? (
              <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>Xóa phiếu</Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onClose}>Đóng</Button>
              <Button size="sm" onClick={() => onSubmit(form)} className="bg-blue-600 hover:bg-blue-500 text-white font-bold">
                Lưu & Áp dụng
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TechnicianDashboard({ section = "Tổng quan", onNavigate, focusTarget = null }) {
  const { data, offline, setData, refresh } = useDashboardData();
  const { user } = useAuth();
  const [toast, setToast] = useState(null);
  const [borrowModal, setBorrowModal] = useState({ open: false, device: null });
  const [incidentModal, setIncidentModal] = useState({ open: false, item: null });
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });

  async function handleSubmit(form) {
    try {
      if (modal.mode === "create") {
        await api.createMaintenance(form.device_id, form.notes, form.status, form.kind);
        setToast({ message: "Đã lưu tác vụ bảo trì", type: "success" });
      } else {
        await api.updateMaintenance(modal.item.id, { status: form.status, notes: form.notes, device_condition: form.device_condition || undefined });
        setToast({ message: "Đã cập nhật bảo trì", type: "success" });
      }
      refresh();
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

  async function updateDeviceStatus(item, status) {
    try {
      const updated = await api.updateDeviceStatus(item.id, status);
      setData((current) => ({ ...current, devices: current.devices.map((row) => row.id === item.id ? updated : row) }));
      setToast({ message: `Đã cập nhật trạng thái thiết bị ${item.name}`, type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật thiết bị.", type: "error" });
    }
  }

  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />
      {offline && <OfflineNotice />}
      <WorkspaceSection 
        section={section} 
        role="technician" 
        data={data} 
        onComplete={(item) => setModal({ open: true, mode: 'update', item })} 
        onSchedule={() => setModal({ open: true, mode: 'create', item: null })} 
        onDownloadReportTXT={downloadReportTXT} 
        onPrintReportPDF={printReportPDF} 
        onNavigate={onNavigate} 
        focusId={focusTarget}
        onUpdateDeviceStatus={updateDeviceStatus}
        onOpenMaintenanceForDevice={(device) => setModal({ open: true, mode: 'create', item: { device_id: device.id, status: 'in_progress', kind: 'inspection', notes: '' } })}
      />
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

      {/* === CẢNH BÁO SỰ CỐ KHẨN CẤP CHO KĨ THUẬT VIÊN === */}
      {(() => {
        const openIncidents = (data.maintenance || []).filter(m => m.kind === "incident" && (m.status === "open" || m.status === "in_progress"));
        if (openIncidents.length === 0) return null;
        return (
          <div className="mb-6 rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-transparent p-5 shadow-lg border-l-8 border-l-orange-600 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-orange-600 text-white shrink-0 animate-bounce">
                <AlertTriangle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-base font-extrabold text-orange-700 dark:text-orange-400">
                  🔧 CÓ {openIncidents.length} SỰ CỐ THIẾT BỊ CẦN TIẾP NHẬN KIỂM TRA NGAY!
                </h4>
                <p className="text-xs text-orange-600/90 dark:text-orange-300/90 mt-1">
                  Người dùng đã báo cáo sự cố. Vui lòng bấm "Tiếp nhận kiểm tra" để chuyển thiết bị sang trạng thái bảo trì và bắt đầu xử lý.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {openIncidents.map((m) => {
                    const dev = (data.devices || []).find(d => d.id === m.device_id) || {};
                    const isOpen = m.status === "open";
                    return (
                      <div key={m.id} className={`p-3 rounded-xl bg-surface/90 border shadow-sm ${isOpen ? "border-orange-400 dark:border-orange-800" : "border-blue-300 dark:border-blue-800"}`}>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-foreground truncate">{dev.name || `Thiết bị #${m.device_id}`} ({dev.asset_code || "?"})</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{m.notes}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <StatusBadge status={m.status} />
                            <StatusBadge status={dev.status || "unknown"} />
                          </div>
                        </div>
                        {isOpen && (
                          <Button 
                            size="sm" 
                            className="mt-2 w-full text-xs py-1.5 bg-orange-600 text-white hover:bg-orange-500 font-bold"
                            onClick={async () => {
                              try {
                                await api.acceptIncident(m.id);
                                refresh();
                                setToast({ message: `Đã tiếp nhận sự cố thiết bị ${dev.name || m.device_id}`, type: "success" });
                              } catch (e) { 
                                setToast({ message: "Lỗi khi tiếp nhận sự cố", type: "error" });
                              }
                            }}
                          >
                            ✅ Tiếp nhận kiểm tra
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
          openItems.map((item) => {
            const dev = data.devices.find((d) => d.id === item.device_id) || {};
            const devName = dev.name ? `${dev.name} (${dev.asset_code})` : `Thiết bị #${item.device_id}`;
            const kindLabel = item.kind === "incident" ? "Báo cáo sự cố" : (item.kind === "inspection" ? "Kiểm tra định kỳ" : item.kind);
            return (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800 min-w-0" key={item.id}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Settings2 size={17} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{devName} • {kindLabel}</p>
                {item.notes && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.notes}</p>}
              </div>
              <StatusBadge status={item.status} />
              <Button size="sm" variant="outline" onClick={() => setModal({ open: true, mode: 'update', item })} className="shrink-0">Cập nhật</Button>
            </div>
            );
          })
        ) : (
          <Empty text="Không có công việc bảo trì từ API." />
        )}
      </Card>

      {/* Bảng kiểm soát nhanh kho thiết bị cho Kỹ thuật viên */}
      <div className="mt-6">
        <EquipmentQuickControlBoard 
          devices={data.devices} 
          onUpdateStatus={updateDeviceStatus} 
          onNavigate={onNavigate} 
          role="technician"
        />
      </div>

      <div className="mt-6">
        <AIChatPanel title="AI Inspection Alert" mode="inspection_alert" starter="Bạn có thể hỏi về đề xuất kiểm tra. Tôi sẽ nêu rõ giới hạn nếu dữ liệu chưa đủ." />
      </div>

      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Shared Request List                                                 */
/* ------------------------------------------------------------------ */
function RequestList({ items, devices = [], users = [], onApprove, onReject, onHandover, onReturn, onRecall, role = "user", focusId = null }) {
  const applyFlash = (id) => {
    if (!id) return;
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.remove("flash-focus"); void el.offsetWidth; el.classList.add("flash-focus");
      setTimeout(() => el.classList.remove("flash-focus"), 2600);
    }, 180);
  };
  useEffect(() => { if (focusId && focusId.requestId) applyFlash(`rq-row-${focusId.requestId}`); }, [focusId]);
  const isManager = role === "admin" || role === "technician";
  const now = useRealtimeClock(3000);

  return (
    <div className="space-y-3">
      {items.map((item) => {
        const dev = (devices || []).find((d) => d.id === item.device_id);
        const borrower = (users || []).find((u) => u.id === item.user_id);
        const isOverdue = item.status === "borrowed" && item.requested_to && new Date(item.requested_to) < now;
        let overdueBadge = null;
        if (isOverdue) {
          const diffMs = now - new Date(item.requested_to);
          const text = formatOverdueDuration(diffMs);
          overdueBadge = (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 text-white px-2.5 py-1 text-[11px] font-black shadow-md animate-pulse border border-rose-400">
              <AlertTriangle size={12} className="shrink-0 text-white" />
              QUÁ HẠN {text.toUpperCase()}
            </span>
          );
        }

        const createdAtStr = item.created_at ? new Date(item.created_at).toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        }) : null;

        const fromStr = item.requested_from ? new Date(item.requested_from).toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        }) : null;

        const dueStr = item.requested_to ? new Date(item.requested_to).toLocaleString("vi-VN", {
          day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
        }) : null;

        return (
          <div id={`rq-row-${item.id}`} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 min-w-0 transition ${isOverdue ? "border-rose-400 dark:border-rose-700 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500/30 shadow-md" : "border-border bg-surface"} ${focusId && focusId.requestId === item.id ? "flash-focus" : ""}`} key={item.id}>
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className={`grid h-11 w-11 place-items-center rounded-xl shrink-0 mt-0.5 ${isOverdue ? "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400" : "bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400"}`}>
                <ClipboardCheck size={20} />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-foreground">
                    {dev ? `${dev.name}` : `Thiết bị #${item.device_id}`}
                  </span>
                  {dev?.asset_code && (
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated text-muted-foreground border border-border">
                      {dev.asset_code}
                    </span>
                  )}
                  <StatusBadge status={item.status} />
                  {overdueBadge}
                </div>

                {/* Borrower and Purpose info */}
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  {borrower && (
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      Người mượn: {borrower.full_name} (@{borrower.username})
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    Mục đích: <strong className="text-foreground font-medium">{item.purpose || "Thực hành phòng lab"}</strong>
                  </span>
                </div>

                {/* Detailed Date and Time breakdown */}
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono bg-surface-elevated/60 dark:bg-surface-elevated/30 p-2 rounded-lg border border-border/60">
                  {createdAtStr && (
                    <span className="text-muted-foreground">
                      Gửi lúc: <strong className="text-foreground">{createdAtStr}</strong>
                    </span>
                  )}
                  {fromStr && (
                    <span className="text-muted-foreground">
                      Bắt đầu: <strong className="text-emerald-600 dark:text-emerald-400">{fromStr}</strong>
                    </span>
                  )}
                  {dueStr && (
                    <span className="text-muted-foreground">
                      Hạn trả: <strong className={isOverdue ? "text-rose-600 dark:text-rose-400 font-bold" : "text-blue-600 dark:text-blue-400"}>{dueStr}</strong>
                      {isOverdue && (
                        <span className="ml-1.5 text-rose-600 dark:text-rose-400 font-black">
                          (Đã quá hạn {formatOverdueDuration(now - new Date(item.requested_to))})
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            {/* Action buttons matching exact business states */}
            {(() => {
              const hasIncident = dev && ["pending_inspection", "in_progress", "replace_partial", "replace_full"].includes(dev.status);

              return (
                <>
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
                    hasIncident ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold text-xs border border-orange-300 dark:border-orange-800">
                        <AlertTriangle size={13} className="text-orange-600" /> Đã báo sự cố (Chờ KTV)
                      </span>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onReturn(item)} 
                        className="shrink-0 border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 gap-1.5"
                        title="Bấm để gửi yêu cầu hoàn trả thiết bị về phòng thí nghiệm"
                      >
                        <RotateCcw size={14} /> Báo hoàn trả thiết bị
                      </Button>
                    )
                  )}
                  {item.status === "return_pending" && !isManager && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 font-semibold text-xs border border-amber-200 dark:border-amber-800">
                      <RotateCcw size={13} className="animate-spin" /> Chờ Lab Manager kiểm tra & nhận trả
                    </span>
                  )}
                  {(item.status === "return_pending" || item.status === "borrowed") && isManager && onReturn && (
                    hasIncident ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold text-xs border border-orange-300 dark:border-orange-800">
                        <AlertTriangle size={13} className="text-orange-600" /> Đang có sự cố (Chờ KTV)
                      </span>
                    ) : (
                      <Button 
                        size="sm" 
                        onClick={() => onReturn(item)} 
                        className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-500 shadow-sm gap-1.5"
                        title="Kiểm tra tình trạng thiết bị và xác nhận hoàn trả vào kho"
                      >
                        <CheckCircle2 size={14} /> Kiểm tra & Xác nhận hoàn trả
                      </Button>
                    )
                  )}
                </>
              );
            })()}
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
        );
      })}
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

function AIChatPanel({ title, starter, mode = "chat", autoFocus = false }) {
  const [messages, setMessages] = useState([{ role: "assistant", content: starter, grounded: false, sources: [] }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const abortControllerRef = React.useRef(null);
  const { user } = useAuth();
  const role = user?.role || "user";

  const roleKnowledgeScope = {
    admin: { label: "Phạm vi: Quản lý phòng lab", tone: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/50 dark:border-violet-900/50 dark:text-violet-300" },
    manager: { label: "Phạm vi: Quản lý phòng lab", tone: "bg-violet-50 text-violet-700 border-violet-200/60 dark:bg-violet-950/50 dark:border-violet-900/50 dark:text-violet-300" },
    technician: { label: "Phạm vi: Kỹ thuật viên", tone: "bg-amber-50 text-amber-700 border-amber-200/60 dark:bg-amber-950/50 dark:border-amber-900/50 dark:text-amber-300" },
    user: { label: "Phạm vi: Người sử dụng", tone: "bg-blue-50 text-blue-700 border-blue-200/60 dark:bg-blue-950/50 dark:border-blue-900/50 dark:text-blue-300" },
  }[role];

  // Câu hỏi gợi ý riêng theo phạm vi tri thức của từng vai trò
  const promptSuggestions = {
    admin: [
      { label: "📦 Liệt kê thiết bị", text: "Hãy liệt kê tất cả các thiết bị trong hệ thống cho tôi" },
      { label: "📊 Tóm tắt vận hành", text: "Tóm tắt tình trạng thiết bị, yêu cầu mượn và bảo trì hiện tại" },
      { label: "⚠️ Thiết bị cần kiểm tra", text: "Những thiết bị nào đang cần kiểm tra hoặc bảo trì?" },
      { label: "📋 Quy định mượn trả SOP-04", text: "Quy định bàn giao và kiểm tra hoàn trả thiết bị phòng lab?" },
    ],
    manager: [
      { label: "📦 Liệt kê thiết bị", text: "Hãy liệt kê tất cả các thiết bị trong hệ thống cho tôi" },
      { label: "📊 Tóm tắt vận hành", text: "Tóm tắt tình trạng thiết bị, yêu cầu mượn và bảo trì hiện tại" },
      { label: "⏰ Quá hạn mượn", text: "Hiện có bao nhiêu lượt mượn đã quá hạn chưa trả?" },
      { label: "📋 Quy định mượn trả SOP-04", text: "Quy định bàn giao và kiểm tra hoàn trả thiết bị phòng lab?" },
    ],
    technician: [
      { label: "🔧 Thiết bị cần xử lý", text: "Danh sách các thiết bị đang hỏng, đang bảo trì hoặc chờ kiểm tra" },
      { label: "🔥 Chập cháy SOP-01", text: "Quy trình xử lý sự cố rò rỉ điện hoặc chập cháy trong phòng lab?" },
      { label: "🔩 Hàn SMD & ESD SOP-05", text: "Nhiệt độ hàn SMD chuẩn và quy định an toàn tĩnh điện ESD?" },
      { label: "🚨 Sự cố khẩn cấp SOP-06", text: "Quy trình xử lý sự cố thiết bị và kích hoạt bảo trì khẩn cấp?" },
    ],
    user: [
      { label: "📦 Máy sẵn sàng mượn", text: "Liệt kê các thiết bị đang sẵn sàng để tôi mượn" },
      { label: "⚡ An toàn điện SOP-01", text: "Quy trình xử lý sự cố rò rỉ điện hoặc chập cháy trong phòng lab?" },
      { label: "🔍 Máy hiện sóng SOP-02", text: "Hướng dẫn vận hành và cài đặt que đo máy hiện sóng Tektronix TBS1102B?" },
      { label: "📋 Quy định mượn trả SOP-04", text: "Quy định bàn giao và kiểm tra hoàn trả thiết bị phòng lab?" },
    ],
  }[role] || [];

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
    // Trả focus về ô nhập ngay sau khi gửi để gõ tiếp câu kế tiếp (như Messenger)
    inputRef.current?.focus();
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
        sources: result.sources || [],
        safety_note: result.safety_note || null,
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
            <span className={`mt-1 inline-flex items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold ${roleKnowledgeScope.tone}`}>
              {roleKnowledgeScope.label}
            </span>
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
            {item.safety_note && (
              <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 px-2.5 py-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {item.safety_note}
              </div>
            )}
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
        {/* Không disable khi đang loading: cho phép soạn câu tiếp theo trong lúc AI trả lời */}
        <Input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Hỏi về thiết bị, quy trình an toàn SOP..." className="flex-1" autoFocus={autoFocus} />
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
          <AIChatPanel title="Trợ lý AI LyxLab" starter="Tôi đang ở đây để hỗ trợ tra cứu quy trình và thiết bị phòng lab." autoFocus />
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

import React from "react";
import { cn } from "../lib/utils";

export function Button({ className, variant = "default", size = "default", ...props }) {
  const variants = {
    default: "bg-brand text-white shadow-glow-brand hover:bg-brand-dark",
    outline: "border border-slate-200 bg-white text-slate-700 hover:border-brand/40 hover:text-brand",
    ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    danger: "bg-red-50 text-brand hover:bg-red-100",
  };
  const sizes = {
    sm: "h-9 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-11 px-6 text-sm",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition focus:outline-none focus:ring-2 focus:ring-brand/25 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

export function Card({ className, hover = false, ...props }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white shadow-card",
        hover && "transition duration-300 hover:-translate-y-0.5 hover:shadow-card-hover",
        className,
      )}
      {...props}
    />
  );
}

export function Badge({ className, tone = "slate", dot = false, ...props }) {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    red: "bg-red-50 text-brand",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
  };
  const dots = {
    slate: "bg-slate-400",
    red: "bg-brand",
    amber: "bg-amber-500",
    green: "bg-emerald-500",
    blue: "bg-blue-500",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold", tones[tone], className)} {...props}>
      {dot && <span className={cn("h-1.5 w-1.5 rounded-full", dots[tone])} />}
      {props.children}
    </span>
  );
}

export function Input({ className, icon, ...props }) {
  if (icon) {
    return (
      <div className={cn("relative", className)}>
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10" {...props} />
      </div>
    );
  }
  return <input className={cn("h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/10", className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn("h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-800 outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/10", className)} {...props}>
      {children}
    </select>
  );
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg animate-slide-up rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

export function Toast({ message, type = "success" }) {
  if (!message) return null;
  const styles = {
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    error: "border-red-200 bg-red-50 text-red-800",
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };
  return (
    <div className={cn("fixed bottom-6 right-6 z-50 animate-slide-up rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg", styles[type])}>
      {message}
    </div>
  );
}
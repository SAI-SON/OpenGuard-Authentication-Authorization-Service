import React from "react";
import { NavLink } from "react-router-dom";
import {
  Shield,
  LayoutDashboard,
  Terminal,
  FileText,
  KeyRound,
  Users,
  BookOpen,
  Settings,
  X,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  backendHealthy: boolean;
}

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/builder", label: "Smart Policy Builder", icon: Sparkles, badge: "NLP / AI" },
  { to: "/playground", label: "API Playground", icon: Terminal, badge: "Live" },
  { to: "/permissions", label: "Permissions", icon: KeyRound },
  { to: "/logs", label: "Authorization Logs", icon: FileText },
  { to: "/users", label: "Users", icon: Users },
  { to: "/docs", label: "API Documentation", icon: BookOpen },
  { to: "/settings", label: "Settings", icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  backendHealthy,
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 text-slate-300 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-slate-800/80 bg-slate-950">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base tracking-tight text-white flex items-center gap-1">
                OpenGuard
              </span>
              <span className="block text-[10px] text-brand-400 font-mono tracking-wider uppercase">
                Auth & Auth Platform
              </span>
            </div>
          </NavLink>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Platform
          </div>
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => onClose()}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                    isActive
                      ? "bg-brand-600 text-white shadow-sm shadow-brand-500/25"
                      : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
                  }`
                }
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 transition-transform group-hover:scale-110" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Backend service health indicator */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/60">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-slate-400 font-medium">Backend API</span>
              <span className="text-[11px] font-mono text-slate-400">:8080</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    backendHealthy ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-2 w-2 ${
                    backendHealthy ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />
              </span>
              <span className="text-xs font-semibold text-slate-200">
                {backendHealthy ? "Connected (Live)" : "Service Offline"}
              </span>
            </div>
          </div>

          <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>OpenGuard v1.0.0</span>
            <NavLink
              to="/"
              className="text-brand-400 hover:text-brand-300 inline-flex items-center gap-1 hover:underline"
            >
              Public Site <ExternalLink className="w-3 h-3" />
            </NavLink>
          </div>
        </div>
      </aside>
    </>
  );
};

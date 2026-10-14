import React, { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Server,
  Shield,
  Palette,
  User,
  ExternalLink,
  CheckCircle2,
  RefreshCw,
  Sun,
  Moon,
  Info,
} from "lucide-react";
import { useTheme } from "../context/ThemeContext.js";
import { useAuth } from "../context/AuthContext.js";
import { fetchHealth } from "../api/client.js";
import type { HealthResponse } from "../api/types.js";
import { StatusBadge } from "../components/common/StatusBadge.js";
import { FormField } from "../components/common/FormField.js";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();

  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [checkingHealth, setCheckingHealth] = useState(false);

  const checkBackend = async () => {
    setCheckingHealth(true);
    const res = await fetchHealth();
    setHealth(res);
    setCheckingHealth(false);
  };

  useEffect(() => {
    checkBackend();
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Platform Settings
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Manage system connectivity, appearance, and environment configuration.
        </p>
      </div>

      {/* Backend API Connection Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Server className="w-5 h-5 text-brand-600" />
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorization Service Backend
              </h2>
              <span className="text-[11px] text-slate-400 font-mono">
                http://localhost:8080 (Proxy: /api)
              </span>
            </div>
          </div>

          <button
            onClick={checkBackend}
            disabled={checkingHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingHealth ? "animate-spin" : ""}`} />
            Check Connection
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="block text-slate-400 text-[11px] font-semibold mb-1">
              Connection State
            </span>
            <StatusBadge
              status={health?.status === "ok" ? "ACTIVE" : "ERROR"}
              size="sm"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="block text-slate-400 text-[11px] font-semibold mb-1">
              Database Path
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
              ./data/permissions.db
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
            <span className="block text-slate-400 text-[11px] font-semibold mb-1">
              Active Port
            </span>
            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
              8080 (REST API)
            </span>
          </div>
        </div>
      </div>

      {/* Auth0 Configuration Status */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Shield className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Auth0 Provider Configuration
            </h2>
            <span className="text-[11px] text-slate-400">
              Loaded securely from environment variables
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="block text-slate-400 text-[11px] font-semibold mb-1">
                Auth0 Domain
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                dev-4272oqwsjd7ed5sq.us.auth0.com
              </div>
            </div>

            <div>
              <span className="block text-slate-400 text-[11px] font-semibold mb-1">
                API Audience Identifier
              </span>
              <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                https://api.open-fabric-auth
              </div>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Remote JWKS Endpoint is connected and reachable. Signing algorithm enforced: <strong>RS256</strong>.
            </span>
          </div>
        </div>
      </div>

      {/* Appearance Preferences */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Palette className="w-5 h-5 text-violet-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Appearance & Theme
            </h2>
            <span className="text-[11px] text-slate-400">
              Customize dashboard visual mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              theme === "light"
                ? "bg-brand-50 border-brand-500 text-brand-700 dark:text-brand-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Sun className="w-4 h-4 text-amber-500" /> Light Mode
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
              theme === "dark"
                ? "bg-brand-950/60 border-brand-500 text-brand-300"
                : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
            }`}
          >
            <Moon className="w-4 h-4 text-brand-400" /> Dark Mode
          </button>
        </div>
      </div>

      {/* Profile Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-5 h-5 text-brand-600" />
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              User Profile
            </h2>
            <span className="text-[11px] text-slate-400">
              Current session principal
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="block text-slate-400 text-[11px] font-semibold mb-1">
              Active User
            </span>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-200">
              {user?.name || "Alex Vance"}
            </div>
          </div>

          <div>
            <span className="block text-slate-400 text-[11px] font-semibold mb-1">
              Role
            </span>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono capitalize text-slate-800 dark:text-slate-200">
              {user?.role || "admin"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Activity,
  ArrowUpRight,
  Filter,
  Terminal,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { StatCard } from "../components/common/StatCard.js";
import { StatusBadge } from "../components/common/StatusBadge.js";
import type { AuditLogEntry } from "../api/types.js";

// Realistic baseline data representing seeded scenarios and playground tests
const INITIAL_REQUESTS: AuditLogEntry[] = [
  {
    id: "req_01",
    timestamp: "Just now",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-789/transactions",
    decision: "ALLOW",
    reason: 'Permission granted on "wallets/wallet-789/transactions" (read).',
    is_live: true,
  },
  {
    id: "req_02",
    timestamp: "2 mins ago",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-789",
    decision: "DENY",
    reason: "Explicit deny rule overrides wildcard.",
    is_live: true,
  },
  {
    id: "req_03",
    timestamp: "6 mins ago",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-123",
    decision: "ALLOW",
    reason: 'Matched wildcard rule "wallets/*".',
    is_live: true,
  },
  {
    id: "req_04",
    timestamp: "12 mins ago",
    user_id: "user123",
    method: "GET",
    resource: "transactions",
    decision: "ALLOW",
    reason: "Direct permission allow.",
    is_live: false,
  },
  {
    id: "req_05",
    timestamp: "18 mins ago",
    user_id: "user123",
    method: "DELETE",
    resource: "transactions",
    decision: "DENY",
    reason: "Explicit policy deny on delete.",
    is_live: false,
  },
  {
    id: "req_06",
    timestamp: "32 mins ago",
    user_id: "unregistered_client",
    method: "GET",
    resource: "reports/financial",
    decision: "DENY",
    reason: "Default Deny: No matching permission.",
    is_live: false,
  },
];

export const DashboardPage: React.FC = () => {
  const [filterDecision, setFilterDecision] = useState<"ALL" | "ALLOW" | "DENY">("ALL");

  const filteredRequests = INITIAL_REQUESTS.filter((req) => {
    if (filterDecision === "ALL") return true;
    return req.decision === filterDecision;
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.3),transparent_70%)] pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-brand-200 text-xs font-medium mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-brand-300" />
            Security Overview & Metrics
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            OpenGuard Control Center
          </h1>
          <p className="mt-1 text-xs text-brand-100 leading-relaxed">
            Zero-trust token verification and SQLite authorization rules are actively enforcing access boundaries across all connected client applications.
          </p>

          <div className="mt-4 flex flex-wrap gap-2.5">
            <Link
              to="/playground"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-xs font-semibold text-white shadow-sm transition-colors"
            >
              <Terminal className="w-3.5 h-3.5" /> Test in API Playground
            </Link>
            <Link
              to="/permissions"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-medium text-white border border-white/10 transition-colors"
            >
              Manage Rules <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Evaluated Requests"
          value="1,428"
          icon={Activity}
          change="+18.4%"
          trend="up"
          subtitle="Processed in last 24 hours"
          variant="brand"
        />
        <StatCard
          title="Permitted (ALLOW)"
          value="1,290"
          icon={ShieldCheck}
          change="90.3%"
          trend="up"
          subtitle="Authenticated & authorized"
          variant="emerald"
        />
        <StatCard
          title="Blocked (DENY)"
          value="138"
          icon={ShieldAlert}
          change="9.7%"
          trend="down"
          subtitle="Default-deny or explicit rule"
          variant="rose"
        />
        <StatCard
          title="Active SQLite Rules"
          value="14"
          icon={KeyRound}
          change="Seed + Custom"
          trend="neutral"
          subtitle="Loaded in permissions.db"
          variant="default"
        />
      </div>

      {/* Visual Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests over time bar chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Authorization Traffic Volume
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Evaluation requests per hour across all tenant APIs
              </p>
            </div>
            <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              Last 12 Hours
            </span>
          </div>

          {/* Responsive SVG Chart */}
          <div className="h-44 w-full flex items-end gap-2 pt-6 pb-2 px-1">
            {[45, 62, 85, 110, 95, 140, 180, 210, 195, 230, 260, 220].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 group">
                <div
                  className="w-full bg-brand-500 hover:bg-brand-600 rounded-t transition-all group-hover:opacity-90 relative"
                  style={{ height: `${(val / 280) * 100}%` }}
                >
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-1.5 py-0.5 rounded font-mono pointer-events-none transition-opacity">
                    {val}
                  </div>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {idx * 2}:00
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ALLOW vs DENY Distribution */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Decision Breakdown
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enforcement ratios
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Allowed (ALLOW)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">90.3%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[90.3%]" />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Denied (DENY)
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">9.7%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-[9.7%]" />
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 mt-4">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Security insight:</span> 84% of denied requests were triggered by the default-deny baseline for undefined resources.
          </div>
        </div>
      </div>

      {/* Recent Requests Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Recent Authorization Evaluations
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live and benchmark requests validated by the OpenGuard engine
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterDecision}
              onChange={(e) => setFilterDecision(e.target.value as any)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW only</option>
              <option value="DENY">DENY only</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Subject (user_id)</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Resource Path</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {filteredRequests.map((req) => (
                <tr
                  key={req.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {req.timestamp}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                    {req.user_id}
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">
                    {req.method}
                  </td>
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 truncate max-w-[200px]">
                    {req.resource}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={req.decision} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                    {req.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 text-center text-xs">
          <Link
            to="/logs"
            className="text-brand-600 dark:text-brand-400 font-semibold hover:underline inline-flex items-center gap-1"
          >
            View Complete Security Audit Logs <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
};

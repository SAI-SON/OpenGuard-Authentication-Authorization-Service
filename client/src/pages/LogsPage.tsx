import React, { useState } from "react";
import {
  FileText,
  Search,
  Filter,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Shield,
  Info,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge.js";
import type { AuditLogEntry, HttpMethod, Decision } from "../api/types.js";

const AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: "log_01",
    timestamp: "2026-10-14 16:30:46",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-789",
    decision: "DENY",
    reason: 'Explicit deny rule overrides wildcard "wallets/*".',
    is_live: true,
  },
  {
    id: "log_02",
    timestamp: "2026-10-14 16:28:46",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-123",
    decision: "ALLOW",
    reason: 'Permission granted for user on "wallets/wallet-123" (action: "read").',
    is_live: true,
  },
  {
    id: "log_03",
    timestamp: "2026-10-14 16:21:46",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "DELETE",
    resource: "secret-resource-98765",
    decision: "DENY",
    reason: 'No permission rule matches resource "secret-resource-98765" with action "delete".',
    is_live: true,
  },
  {
    id: "log_04",
    timestamp: "2026-10-14 16:19:58",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "PUT",
    resource: "secret-resource-98765",
    decision: "DENY",
    reason: 'No permission rule matches resource "secret-resource-98765" with action "write".',
    is_live: true,
  },
  {
    id: "log_05",
    timestamp: "2026-10-14 16:17:41",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "POST",
    resource: "wallets/wallet-789",
    decision: "DENY",
    reason: 'No permission rule matches resource "wallets/wallet-789" with action "write".',
    is_live: true,
  },
  {
    id: "log_06",
    timestamp: "2026-10-14 16:14:30",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "secret-resource-98765",
    decision: "DENY",
    reason: 'No permission rule matches resource "secret-resource-98765" with action "read".',
    is_live: true,
  },
  {
    id: "log_07",
    timestamp: "2026-10-14 15:52:07",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    method: "GET",
    resource: "wallets/wallet-789/transactions",
    decision: "ALLOW",
    reason: 'Permission granted on "wallets/wallet-789/transactions" (action: "read").',
    is_live: true,
  },
  {
    id: "log_08",
    timestamp: "2026-10-14 15:43:37",
    user_id: "user123",
    method: "GET",
    resource: "transactions",
    decision: "ALLOW",
    reason: "Direct rule allow.",
    is_live: false,
  },
  {
    id: "log_09",
    timestamp: "2026-10-14 15:43:37",
    user_id: "user123",
    method: "DELETE",
    resource: "transactions",
    decision: "DENY",
    reason: "Explicit rule deny on delete.",
    is_live: false,
  },
  {
    id: "log_10",
    timestamp: "2026-10-14 15:43:37",
    user_id: "user456",
    method: "POST",
    resource: "wallets/wallet-789/transactions",
    decision: "DENY",
    reason: "No write permission on sub-collection.",
    is_live: false,
  },
];

export const LogsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<string>("ALL");
  const [methodFilter, setMethodFilter] = useState<string>("ALL");

  const filteredLogs = AUDIT_LOGS.filter((log) => {
    const matchesSearch =
      log.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDecision =
      decisionFilter === "ALL" || log.decision === decisionFilter;
    const matchesMethod =
      methodFilter === "ALL" || log.method === methodFilter;
    return matchesSearch && matchesDecision && matchesMethod;
  });

  const handleExportCSV = () => {
    const headers = ["Timestamp", "User ID", "Method", "Resource", "Decision", "Reason", "Live Record"];
    const rows = filteredLogs.map((l) => [
      `"${l.timestamp}"`,
      `"${l.user_id}"`,
      `"${l.method}"`,
      `"${l.resource}"`,
      `"${l.decision}"`,
      `"${l.reason.replace(/"/g, '""')}"`,
      l.is_live ? "Yes" : "No",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `openguard-audit-logs-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Security Audit Logs
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Chronological audit log of all authorization checks evaluated by the OpenGuard engine.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-slate-500" /> Export CSV
        </button>
      </div>

      {/* Security Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Privacy Compliance:
          </span>{" "}
          Raw JWT access tokens and private signature hashes are strictly redacted and never persisted into log records or exported files.
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search user, resource, or reason..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Decisions</option>
              <option value="ALLOW">ALLOW only</option>
              <option value="DENY">DENY only</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="ALL">All Methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="DELETE">DELETE</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 font-sans">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Subject (user_id)</th>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Resource</th>
                <th className="py-3 px-4">Decision</th>
                <th className="py-3 px-4">Evaluation Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                    {log.timestamp}
                    {log.is_live && (
                      <span className="ml-1.5 text-[9px] px-1 py-0.2 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 rounded border border-emerald-200 dark:border-emerald-800 font-sans font-semibold">
                        Live
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white truncate max-w-[190px]">
                    {log.user_id}
                  </td>
                  <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">
                    {log.method}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                    {log.resource}
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={log.decision} size="sm" />
                  </td>
                  <td className="py-3 px-4 font-sans text-xs text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                    {log.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Showing {filteredLogs.length} of {AUDIT_LOGS.length} records</span>
          <span>Security Audit Trail • Immutable</span>
        </div>
      </div>
    </div>
  );
};

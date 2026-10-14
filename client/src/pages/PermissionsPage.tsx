import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  KeyRound,
  Plus,
  Search,
  Filter,
  Info,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  X,
  Database,
  Trash2,
  Sparkles,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge.js";
import { FormField } from "../components/common/FormField.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import type { PermissionRule } from "../api/types.js";
import { fetchPermissions, createPermissions, deletePermission } from "../api/client.js";

export const PermissionsPage: React.FC = () => {
  const [rules, setRules] = useState<PermissionRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [effectFilter, setEffectFilter] = useState<string>("ALL");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newAction, setNewAction] = useState<"read" | "write" | "delete">("read");
  const [newResource, setNewResource] = useState("");
  const [newEffect, setNewEffect] = useState<"allow" | "deny">("allow");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PermissionRule | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadRules = async () => {
    setIsLoading(true);
    try {
      const res = await fetchPermissions();
      setRules(res.permissions);
    } catch {
      // Keep existing rules on fetch error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "ALL" || r.action === actionFilter;
    const matchesEffect = effectFilter === "ALL" || r.effect === effectFilter;
    return matchesSearch && matchesAction && matchesEffect;
  });

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newResource.trim()) {
      alert("Please enter a user ID and a resource string.");
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);
    try {
      await createPermissions([
        {
          user_id: newUserId.trim(),
          action: newAction,
          resource: newResource.trim().replace(/^\/+/, ""),
          effect: newEffect,
        },
      ]);
      setFeedback({
        type: "success",
        message: "Permission rule successfully committed to SQLite database!",
      });
      setIsModalOpen(false);
      setNewUserId("");
      setNewResource("");
      await loadRules();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to commit permission rule.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setFeedback(null);
    try {
      if (deleteTarget.id) {
        await deletePermission(deleteTarget.id);
      }
      setFeedback({
        type: "success",
        message: `Rule for '${deleteTarget.resource}' deleted from SQLite database.`,
      });
      setDeleteTarget(null);
      await loadRules();
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to delete permission rule.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Smart Policy Builder Highlight Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-600 via-indigo-600 to-purple-600 text-white shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h3 className="font-bold text-sm tracking-tight text-white flex items-center gap-2">
              Smart Policy Builder
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900 uppercase">
                Featured
              </span>
            </h3>
            <p className="text-xs text-white/90 mt-0.5">
              Type plain English: <span className="font-mono text-amber-200">"Allow user123 to read wallet-789 transactions, but deny delete access."</span>
            </p>
          </div>
        </div>
        <Link
          to="/builder"
          className="px-4 py-2 rounded-xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-bold transition-all shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-auto"
        >
          Open Policy Builder <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Permission Rules
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Fine-grained access policies evaluated in real-time by the SQLite authorization engine ({rules.length} active rules).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadRules}
            disabled={isLoading}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Reload from SQLite"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/25 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        </div>
      </div>

      {/* Notifications */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Backend API Note */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Database className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Live SQLite Database Sync:
          </p>
          <p className="text-[11px] leading-relaxed">
            The table below reflects live rules queried from <code className="font-mono text-brand-600 dark:text-brand-400">data/permissions.db</code>. Additions and deletions made here are written to SQLite immediately.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rules Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
          {/* Table Filters */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search user_id or resource..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Actions</option>
                <option value="read">read</option>
                <option value="write">write</option>
                <option value="delete">delete</option>
              </select>

              <select
                value={effectFilter}
                onChange={(e) => setEffectFilter(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <option value="ALL">All Effects</option>
                <option value="allow">allow</option>
                <option value="deny">deny</option>
              </select>
            </div>
          </div>

          {/* Table List */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 font-sans">
                <tr>
                  <th className="py-3 px-4">Subject (user_id)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource Pattern</th>
                  <th className="py-3 px-4">Effect</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRules.length > 0 ? (
                  filteredRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                        {rule.user_id}
                        {rule.is_demo && (
                          <span className="ml-1.5 px-1 py-0.2 text-[9px] bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 rounded border border-brand-200 dark:border-brand-800 font-sans">
                            Staged
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-brand-600 dark:text-brand-400">
                        {rule.action}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300">
                        <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-800 dark:text-slate-200">
                          {rule.resource}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge
                          status={rule.effect.toUpperCase() as any}
                          size="sm"
                        />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setDeleteTarget(rule)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Rule"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No permissions match your search criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-850/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Showing {filteredRules.length} of {rules.length} total rules</span>
            <span>Default policy: DENY</span>
          </div>
        </div>

        {/* Wildcard and Specificity Help Panel (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
              <BookOpen className="w-4 h-4 text-brand-600" />
              Engine Resolution Logic
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  1. Wildcard Semantics
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  <code className="font-mono text-brand-600">*</code> matches exactly one path segment.
                </p>
                <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded font-mono text-[11px] space-y-1">
                  <div>wallets/* → matches wallets/w-123</div>
                  <div className="text-slate-400">Does not match wallets/w-123/tx</div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  2. Specificity Ranking
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Exact literal segments have a higher specificity score than wildcard segments.
                </p>
                <div className="mt-1.5 p-2 bg-slate-50 dark:bg-slate-800/80 rounded font-mono text-[11px]">
                  wallets/w-789 (Specific) &gt; wallets/* (General)
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  3. Conflict Resolution
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  If both an <code className="font-mono text-emerald-600">allow</code> and a <code className="font-mono text-rose-600">deny</code> rule tie on specificity, <strong>DENY always wins</strong>.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                  4. Default-Deny
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  If no rules match the subject and resource, access is rejected immediately with <strong>DENY</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Permission Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-brand-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Add Permission Rule
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="p-4 space-y-3.5">
              <FormField id="newUserId" label="User ID (Subject claim)" required>
                <input
                  id="newUserId"
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="e.g. user123 or client_id@clients"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField id="newAction" label="Action" required>
                  <select
                    id="newAction"
                    value={newAction}
                    onChange={(e) => setNewAction(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono font-bold"
                  >
                    <option value="read">read</option>
                    <option value="write">write</option>
                    <option value="delete">delete</option>
                  </select>
                </FormField>

                <FormField id="newEffect" label="Effect" required>
                  <select
                    id="newEffect"
                    value={newEffect}
                    onChange={(e) => setNewEffect(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 font-mono font-bold"
                  >
                    <option value="allow">allow</option>
                    <option value="deny">deny</option>
                  </select>
                </FormField>
              </div>

              <FormField
                id="newResource"
                label="Resource Path Pattern"
                hint="e.g. wallets/* or wallets/wallet-789"
                required
              >
                <input
                  id="newResource"
                  type="text"
                  value={newResource}
                  onChange={(e) => setNewResource(e.target.value)}
                  placeholder="wallets/wallet-789/transactions"
                  className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                  required
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Remove Permission Rule"
        message={`Are you sure you want to remove rule "${deleteTarget?.action} on ${deleteTarget?.resource}" for user "${deleteTarget?.user_id}"?`}
        confirmLabel="Remove Rule"
        isDestructive={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

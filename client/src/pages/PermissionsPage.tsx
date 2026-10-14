import React, { useState } from "react";
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
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge.js";
import { FormField } from "../components/common/FormField.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";
import type { PermissionRule } from "../api/types.js";

// Active permissions mirroring data/permissions.db seed and test rules
const INITIAL_RULES: PermissionRule[] = [
  {
    id: "perm_01",
    user_id: "user123",
    action: "read",
    resource: "transactions",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_02",
    user_id: "user123",
    action: "write",
    resource: "transactions",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_03",
    user_id: "user123",
    action: "delete",
    resource: "transactions",
    effect: "deny",
    is_demo: false,
  },
  {
    id: "perm_04",
    user_id: "user123",
    action: "read",
    resource: "accounts",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_05",
    user_id: "user456",
    action: "read",
    resource: "wallets/*",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_06",
    user_id: "user456",
    action: "write",
    resource: "wallets/wallet-789",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_07",
    user_id: "user456",
    action: "read",
    resource: "wallets/wallet-789/transactions",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_08",
    user_id: "user789",
    action: "write",
    resource: "wallets/*/transactions",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_09",
    user_id: "user789",
    action: "write",
    resource: "wallets/*/transactions/*",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_10",
    user_id: "admin789",
    action: "*",
    resource: "*",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_11",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    action: "read",
    resource: "wallets/wallet-789/transactions",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_12",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    action: "delete",
    resource: "wallets/wallet-789/transactions",
    effect: "deny",
    is_demo: false,
  },
  {
    id: "perm_13",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    action: "read",
    resource: "wallets/*",
    effect: "allow",
    is_demo: false,
  },
  {
    id: "perm_14",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    action: "read",
    resource: "wallets/wallet-789",
    effect: "deny",
    is_demo: false,
  },
];

export const PermissionsPage: React.FC = () => {
  const [rules, setRules] = useState<PermissionRule[]>(INITIAL_RULES);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("ALL");
  const [effectFilter, setEffectFilter] = useState<string>("ALL");

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newAction, setNewAction] = useState<"read" | "write" | "delete">("read");
  const [newResource, setNewResource] = useState("");
  const [newEffect, setNewEffect] = useState<"allow" | "deny">("allow");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PermissionRule | null>(null);

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.resource.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAction = actionFilter === "ALL" || r.action === actionFilter;
    const matchesEffect = effectFilter === "ALL" || r.effect === effectFilter;
    return matchesSearch && matchesAction && matchesEffect;
  });

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserId.trim() || !newResource.trim()) {
      alert("Please enter a user ID and a resource string.");
      return;
    }

    const created: PermissionRule = {
      id: `perm_staged_${Date.now()}`,
      user_id: newUserId.trim(),
      action: newAction,
      resource: newResource.trim().replace(/^\/+/, ""),
      effect: newEffect,
      is_demo: true,
    };

    setRules([created, ...rules]);
    setIsModalOpen(false);
    setNewUserId("");
    setNewResource("");
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      setRules(rules.filter((r) => r.id !== deleteTarget.id));
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Permission Rules
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Define fine-grained access policies evaluated by the SQLite authorization engine.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/25 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Permission Rule
        </button>
      </div>

      {/* Backend API Note */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Database className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            SQLite Database View:
          </p>
          <p className="text-[11px] leading-relaxed">
            The table below reflects the live rules loaded in <code className="font-mono text-brand-600 dark:text-brand-400">data/permissions.db</code>. Permanent additions can also be seeded via <code className="font-mono text-slate-700 dark:text-slate-300">npm run db:seed</code>.
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

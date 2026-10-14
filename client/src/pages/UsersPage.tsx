import React, { useState } from "react";
import {
  Users as UsersIcon,
  Search,
  KeyRound,
  Shield,
  X,
  ExternalLink,
  ChevronRight,
  Info,
} from "lucide-react";
import { StatusBadge } from "../components/common/StatusBadge.js";
import type { UserSummary } from "../api/types.js";

const DIRECTORY_USERS: UserSummary[] = [
  {
    id: "u_01",
    user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
    name: "Open Fabric Auth API Client",
    email: "m2m-auth0-client@open-fabric.auth0.com",
    type: "machine",
    permission_count: 4,
    status: "active",
    last_active: "Just now",
  },
  {
    id: "u_02",
    user_id: "user123",
    name: "Standard Application User",
    email: "user123@openfabric.io",
    type: "user",
    permission_count: 4,
    status: "active",
    last_active: "12 mins ago",
  },
  {
    id: "u_03",
    user_id: "user456",
    name: "Wallet Operator",
    email: "user456@wallets.openfabric.io",
    type: "user",
    permission_count: 3,
    status: "active",
    last_active: "1 hour ago",
  },
  {
    id: "u_04",
    user_id: "user789",
    name: "Transactions Processor",
    email: "user789@processor.openfabric.io",
    type: "user",
    permission_count: 2,
    status: "active",
    last_active: "3 hours ago",
  },
  {
    id: "u_05",
    user_id: "admin789",
    name: "System Super Admin",
    email: "security.admin@openfabric.io",
    type: "admin",
    permission_count: 3,
    status: "active",
    last_active: "Yesterday",
  },
];

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  const filteredUsers = DIRECTORY_USERS.filter((u) => {
    return (
      u.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Client & User Directory
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Identities recognized by the OpenGuard authentication and SQLite policy store.
        </p>
      </div>

      {/* Directory Notice */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Identity Source Notice:
          </span>{" "}
          User identities in OpenGuard are extracted dynamically from verified Auth0 token{" "}
          <code className="font-mono text-brand-600 dark:text-brand-400">sub</code> claims.
          Passwords and user profiles are stored in Auth0, never locally in SQLite.
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID or name..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {filteredUsers.length} Principals
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Subject ID</th>
                <th className="py-3 px-4">Identity / Label</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Policy Rules</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                    {user.user_id}
                  </td>
                  <td className="py-3 px-4">
                    <span className="block font-medium text-slate-800 dark:text-slate-200">
                      {user.name}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {user.email}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {user.type}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400">
                      <KeyRound className="w-3.5 h-3.5" />
                      {user.permission_count} rules
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={user.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <span className="text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-400 inline-flex items-center text-xs font-medium">
                      Details <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/40 backdrop-blur-sm animate-fade-in flex justify-end">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 flex items-center justify-center font-bold text-sm">
                    {selectedUser.name ? selectedUser.name.charAt(0) : "U"}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedUser.name}
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {selectedUser.type} principal
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Identity Details */}
              <div className="space-y-3 text-xs">
                <div>
                  <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-1">
                    Subject Claim (user_id)
                  </span>
                  <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-mono break-all text-slate-800 dark:text-slate-200 font-medium">
                    {selectedUser.user_id}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-1">
                      Account Status
                    </span>
                    <StatusBadge status={selectedUser.status} size="sm" />
                  </div>
                  <div>
                    <span className="block text-slate-400 text-[11px] uppercase tracking-wider font-semibold mb-1">
                      Active Rules
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {selectedUser.permission_count} rules in SQLite
                    </span>
                  </div>
                </div>
              </div>

              {/* Sample test tip */}
              <div className="p-3.5 rounded-xl bg-brand-50/60 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/50 text-xs text-brand-900 dark:text-brand-200 leading-relaxed space-y-1.5">
                <span className="font-bold flex items-center gap-1.5 text-brand-700 dark:text-brand-300">
                  <Shield className="w-3.5 h-3.5" /> Playground Testing
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  When testing this user in the API Playground, ensure your Auth0 access token contains <code className="font-mono text-brand-600 dark:text-brand-400">{selectedUser.user_id}</code> in its <code className="font-mono">sub</code> claim.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

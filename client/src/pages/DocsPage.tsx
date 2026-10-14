import React from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Code2,
  Terminal,
  Shield,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { JsonViewer } from "../components/common/JsonViewer.js";

export const DocsPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-[11px] font-semibold mb-2">
          REST API Reference v1.0
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          API Documentation
        </h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Complete guide to integrating with the OpenGuard OAuth2 JWT verification and fine-grained authorization REST service.
        </p>
      </div>

      {/* Main Endpoint Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 text-xs font-bold rounded-md bg-brand-600 text-white font-mono">
              POST
            </span>
            <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
              /authorize
            </span>
          </div>
          <Link
            to="/playground"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 hover:bg-brand-100 rounded-lg transition-colors"
          >
            <Terminal className="w-3.5 h-3.5" /> Test in Live Playground
          </Link>
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Description
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Evaluates whether an authenticated principal (identified cryptographically by their verified OAuth2 access token) is permitted to perform a specified action on a requested resource path.
          </p>
        </div>

        {/* Request Specifications */}
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            Request Body (JSON)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Field</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Required</th>
                  <th className="py-2.5 px-3">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-brand-600">access_token</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-500 font-bold">Yes</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    Signed OAuth2 JWT Bearer token. Verified against Auth0 JWKS endpoint.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-brand-600">method</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-500 font-bold">Yes</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    HTTP method: <code className="font-mono text-xs">GET</code>, <code className="font-mono text-xs">POST</code>, <code className="font-mono text-xs">PUT</code>, <code className="font-mono text-xs">PATCH</code>, <code className="font-mono text-xs">DELETE</code>.
                  </td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 font-mono font-bold text-brand-600">path</td>
                  <td className="py-2.5 px-3 font-mono text-slate-500">string</td>
                  <td className="py-2.5 px-3 text-rose-500 font-bold">Yes</td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    API resource path to access (e.g. <code className="font-mono text-xs">/wallets/wallet-789/transactions</code>).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Example Request & Response */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Example Request:
            </span>
            <JsonViewer
              title="POST /authorize Body"
              data={{
                access_token: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwczovL2Rldi00Mjcyb3F3c2pkN2VkNXNxLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJRMU9jWWhSOWhvZDVPU1NycnhEQ1lJSmZLbUl6WVNhZkBjbGllbnRzIiwiYXVkIjoiaHR0cHM6Ly9hcGkub3Blbi1mYWJyaWMtYXV0aCJ9...",
                method: "GET",
                path: "/wallets/wallet-789/transactions",
              }}
              maxHeight="max-h-56"
            />
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
              Example Response (200 OK):
            </span>
            <JsonViewer
              title="200 OK Response"
              data={{
                decision: "ALLOW",
                user_id: "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients",
                reason: 'Permission granted for user on "wallets/wallet-789/transactions" (action: "read").',
                matched_permissions: [
                  {
                    action: "read",
                    resource: "wallets/wallet-789/transactions",
                    effect: "allow",
                  },
                ],
              }}
              maxHeight="max-h-56"
            />
          </div>
        </div>
      </div>

      {/* HTTP Method to Action Mapping Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          HTTP Method to Canonical Action Mapping
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          The authorization engine normalizes all HTTP verbs into three canonical database actions:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">HTTP Verb</span>
            <span className="block text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">GET</span>
            <span className="text-xs text-slate-400">maps to</span>
            <span className="block text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 bg-white dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700">read</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">HTTP Verbs</span>
            <span className="block text-base font-bold font-mono text-brand-600 dark:text-brand-400 mt-1">POST, PUT, PATCH</span>
            <span className="text-xs text-slate-400">maps to</span>
            <span className="block text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 bg-white dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700">write</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <span className="text-xs font-mono font-bold text-slate-500 uppercase">HTTP Verb</span>
            <span className="block text-base font-bold font-mono text-rose-600 dark:text-rose-400 mt-1">DELETE</span>
            <span className="text-xs text-slate-400">maps to</span>
            <span className="block text-sm font-bold font-mono text-slate-900 dark:text-white mt-1 bg-white dark:bg-slate-900 py-1 rounded border border-slate-200 dark:border-slate-700">delete</span>
          </div>
        </div>
      </div>

      {/* Wildcard & Specificity Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Wildcards and Specificity Priority
        </h2>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">
              Segment-Based Matching (Not Substring)
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Each <code className="font-mono text-brand-600 dark:text-brand-400">*</code> matches exactly one URL segment. For instance:
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 font-mono text-[11px]">
              <li><code className="text-slate-900 dark:text-white font-bold">wallets/*</code> matches <code className="text-emerald-600">wallets/wallet-123</code> (2 segments)</li>
              <li><code className="text-slate-900 dark:text-white font-bold">wallets/*</code> does NOT match <code className="text-rose-600">wallets/wallet-123/transactions</code> (3 segments)</li>
              <li><code className="text-slate-900 dark:text-white font-bold">*</code> matches any resource depth (global admin rule)</li>
            </ul>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">
              Specificity Tie-Breaking & Deny-Wins
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              When multiple rules match a request, the rule with the most exact literal segments wins. If an allow and a deny rule tie at the same specificity level, <strong>DENY always overrides ALLOW</strong> (Principle of Least Privilege).
            </p>
          </div>
        </div>
      </div>

      {/* HTTP Error Status Codes Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          HTTP Status Codes
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800 rounded-lg">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Meaning</th>
                <th className="py-2.5 px-3">Typical Cause</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-emerald-600">200 OK</td>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">Decision Evaluated</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  Token is valid and permissions were checked (decision can be ALLOW or DENY).
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-amber-600">400 Bad Request</td>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">Malformed Body</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  Missing required fields or unsupported HTTP method specified in payload.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-rose-600">401 Unauthorized</td>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">Invalid or Expired JWT</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  Signature verification failure, expired token, or mismatch in issuer/audience.
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-mono font-bold text-rose-600">500 Server Error</td>
                <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white">Internal Exception</td>
                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                  Uncaught server exception or database initialization error.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

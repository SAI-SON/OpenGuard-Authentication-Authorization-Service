import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Terminal,
  Send,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Info,
  ShieldAlert,
} from "lucide-react";
import { authorizeRequest } from "../api/client.js";
import type { HttpMethod, AuthorizationResponse } from "../api/types.js";
import { StatusBadge } from "../components/common/StatusBadge.js";
import { JsonViewer } from "../components/common/JsonViewer.js";
import { LoadingSpinner } from "../components/common/LoadingSpinner.js";

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export const PlaygroundPage: React.FC = () => {
  const location = useLocation();
  const navState = location.state as {
    presetPath?: string;
    presetMethod?: HttpMethod;
    presetUserId?: string;
  } | null;

  const [token, setToken] = useState("");
  const [showToken, setShowToken] = useState(false);
  const [method, setMethod] = useState<HttpMethod>(navState?.presetMethod || "GET");
  const [path, setPath] = useState(navState?.presetPath || "/wallets/wallet-789/transactions");

  useEffect(() => {
    if (navState?.presetPath) {
      setPath(navState.presetPath);
    }
    if (navState?.presetMethod) {
      setMethod(navState.presetMethod);
    }
  }, [navState]);

  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AuthorizationResponse | null>(null);

  const handleSend = async () => {
    if (!token.trim()) {
      alert("Please provide an OAuth2 access token to verify.");
      return;
    }

    setLoading(true);
    setResponse(null);

    const res = await authorizeRequest({
      access_token: token.trim(),
      method,
      path: path.trim(),
    });

    setResponse(res);
    setLoading(false);
  };

  const handleClearToken = () => {
    setToken("");
    setResponse(null);
  };

  // Preset buttons
  const applyPreset = (m: HttpMethod, p: string, dummyToken?: string) => {
    setMethod(m);
    setPath(p);
    if (dummyToken) {
      setToken(dummyToken);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Backend Connected on Port 8080
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          API Authorization Playground
        </h1>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          Execute live <code className="font-mono text-brand-600 dark:text-brand-400">POST /authorize</code> requests directly against the OpenGuard backend.
        </p>
      </div>

      {/* Security alert callout */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-300">
        <Info className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Security Guarantee:
          </p>
          <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
            Access tokens entered here are never stored in localStorage, sessionStorage, or client logs. Tokens are transmitted over HTTP solely to evaluate permissions against Auth0 and SQLite.
          </p>
        </div>
      </div>

      {/* Preset buttons */}
      <div>
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
          Quick Request Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyPreset("GET", "/wallets/wallet-789/transactions")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            GET /wallets/wallet-789/transactions (Allow)
          </button>
          <button
            onClick={() => applyPreset("DELETE", "/wallets/wallet-789/transactions")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            DELETE /wallets/wallet-789/transactions (Deny)
          </button>
          <button
            onClick={() => applyPreset("GET", "/wallets/wallet-123")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            GET /wallets/wallet-123 (Wildcard)
          </button>
          <button
            onClick={() => applyPreset("GET", "/wallets/wallet-789")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            GET /wallets/wallet-789 (Specific Deny)
          </button>
          <button
            onClick={() => applyPreset("GET", "/secret-resource-98765")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:border-brand-500 text-slate-700 dark:text-slate-300 transition-colors shadow-sm"
          >
            GET /secret-resource-98765 (Default Deny)
          </button>
          <button
            onClick={() => applyPreset("GET", "/wallets/wallet-789", "invalid-token-tampered")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
          >
            Invalid Token (401 Test)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Request Composer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              Request Payload
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              POST http://localhost:8080/authorize
            </span>
          </div>

          {/* Access Token Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                OAuth2 Access Token (JWT) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  {showToken ? "Mask" : "Reveal"}
                </button>
                {token && (
                  <button
                    type="button"
                    onClick={handleClearToken}
                    className="text-[11px] text-rose-500 hover:text-rose-700 flex items-center gap-1"
                    title="Clear token"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear
                  </button>
                )}
              </div>
            </div>

            <textarea
              rows={4}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Auth0 Access Token here (eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...)"
              className="w-full p-2.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              style={{
                WebkitTextSecurity: showToken ? "none" : "disc",
              } as any}
            />
          </div>

          {/* Method and Resource Path */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                HTTP Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Resource Path
              </label>
              <input
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder="/wallets/wallet-789/transactions"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm shadow-brand-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" label="Evaluating Permissions..." />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send Authorization Request
              </>
            )}
          </button>
        </div>

        {/* Right column: Response View */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Engine Verdict
              </h2>
              {response?.durationMs !== undefined && (
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {response.durationMs}ms
                </span>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center">
                <LoadingSpinner size="lg" label="Validating JWT Signature with Auth0 & Querying SQLite..." />
              </div>
            ) : response ? (
              <div className="space-y-4">
                {/* Decision Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-start gap-3 ${
                    response.decision === "ALLOW"
                      ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50"
                      : "bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50"
                  }`}
                >
                  {response.decision === "ALLOW" ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={response.decision} />
                      {response.user_id && (
                        <span className="text-xs font-mono text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-slate-900/60 px-2 py-0.5 rounded border border-slate-200/60 dark:border-slate-800/60">
                          {response.user_id}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-xs font-medium leading-relaxed ${
                        response.decision === "ALLOW"
                          ? "text-emerald-900 dark:text-emerald-200"
                          : "text-rose-900 dark:text-rose-200"
                      }`}
                    >
                      {response.reason || response.error}
                    </p>
                  </div>
                </div>

                {/* Matched Permissions List */}
                {response.matched_permissions && response.matched_permissions.length > 0 && (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                      Matched Policy Rules:
                    </span>
                    <div className="space-y-1.5">
                      {response.matched_permissions.map((rule, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                        >
                          <span className="text-brand-600 dark:text-brand-400 font-bold">
                            {rule.action.toUpperCase()}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {rule.resource}
                          </span>
                          <StatusBadge status={rule.effect.toUpperCase() as any} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Raw JSON viewer */}
                <div>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                    Raw JSON Output:
                  </span>
                  <JsonViewer data={response} maxHeight="max-h-60" />
                </div>
              </div>
            ) : (
              <div className="py-14 text-center text-slate-400 dark:text-slate-500">
                <Terminal className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Ready to test</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Select a preset or paste your token and click Send
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

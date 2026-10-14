import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Database,
  Play,
  RotateCcw,
  ShieldAlert,
  HelpCircle,
  Code2,
  Lock,
} from "lucide-react";
import { parsePolicy, createPermissions } from "../api/client.js";
import type { ParsedRule, AmbiguityIssue } from "../api/types.js";
import { ConfirmDialog } from "../components/common/ConfirmDialog.js";

const PRESET_EXAMPLES = [
  {
    label: "Read vs Deny Delete",
    text: "Allow user123 to read wallet-789 transactions, but deny delete access.",
    desc: "Compound rule: Grants read access while explicitly denying deletion",
  },
  {
    label: "Client Wildcard Deny",
    text: "Deny Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients delete on wallets/*",
    desc: "Security guardrail: Blocks all wallet delete operations across client",
  },
  {
    label: "Write Permission",
    text: "Allow user456 to write to wallets/wallet-123",
    desc: "Single specific wallet write authorization",
  },
  {
    label: "Ambiguity Test Case",
    text: "Allow user123 access to wallet-789",
    desc: "Demonstrates ambiguity detection when action is unspecified",
  },
];

export const PolicyBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const [statement, setStatement] = useState(
    "Allow user123 to read wallet-789 transactions, but deny delete access."
  );
  const [targetUser, setTargetUser] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [rules, setRules] = useState<ParsedRule[]>([]);
  const [ambiguities, setAmbiguities] = useState<AmbiguityIssue[]>([]);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [hasParsed, setHasParsed] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [parserEngine, setParserEngine] = useState<"rule" | "ai">("rule");

  const handleParse = async (inputStatement?: string) => {
    const text = inputStatement !== undefined ? inputStatement : statement;
    if (!text.trim()) return;

    setIsParsing(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      const res = await parsePolicy(text, targetUser || undefined);
      setRules(res.rules);
      setAmbiguities(res.ambiguities);
      setConfidence(res.confidence);
      setHasParsed(true);
    } catch (err: any) {
      setSaveError(err.message || "Failed to parse natural language statement");
    } finally {
      setIsParsing(false);
    }
  };

  const handleApplySuggestion = (suggestion: string) => {
    // Replace "access" with specific action
    if (statement.toLowerCase().includes("access")) {
      const updated = statement.replace(/access/gi, `${suggestion} access`);
      setStatement(updated);
      handleParse(updated);
    }
  };

  const handleConfirmSave = async () => {
    if (rules.length === 0) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);

    try {
      const res = await createPermissions(
        rules.map((r) => ({
          user_id: r.user_id,
          action: r.action,
          resource: r.resource,
          effect: r.effect,
        }))
      );

      setSaveSuccess(
        `Successfully saved ${res.count} rule(s) to SQLite database! (IDs: ${res.inserted_ids.join(", ")})`
      );
      setShowConfirmModal(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to commit rules to SQLite");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestInPlayground = (rule: ParsedRule) => {
    // Map action to HTTP method
    const methodMap: Record<string, string> = {
      read: "GET",
      write: "POST",
      delete: "DELETE",
    };
    const method = methodMap[rule.action] || "GET";

    navigate("/playground", {
      state: {
        presetPath: "/" + rule.resource.replace(/^\//, ""),
        presetMethod: method,
        presetUserId: rule.user_id,
      },
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 border border-brand-200 dark:border-brand-800">
              <Sparkles className="w-3.5 h-3.5" />
              Core Flagship Feature
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Smart Policy Builder
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Translate plain English statements into fine-grained, verifiable SQLite permission rules with ambiguity detection.
          </p>
        </div>

        {/* Engine Mode Toggle */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-medium">
          <button
            onClick={() => setParserEngine("rule")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              parserEngine === "rule"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Deterministic Engine (Active)
          </button>
          <button
            onClick={() => setParserEngine("ai")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              parserEngine === "ai"
                ? "bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-sm font-semibold"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
            title="Gemini AI Enhancement Hook"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            AI Enhanced
          </button>
        </div>
      </div>

      {/* Preset Example Chips */}
      <div>
        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
          Quick Try Examples
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => {
                setStatement(ex.text);
                handleParse(ex.text);
              }}
              className="p-3 text-left bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-brand-500/50 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
                  {ex.label}
                </span>
                <ArrowRight className="w-3 h-3 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 transition-all" />
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 font-mono line-clamp-2">
                "{ex.text}"
              </p>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                {ex.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Statement Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-semibold text-slate-900 dark:text-white mb-1.5">
            Describe Authorization Policy in Natural Language
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={3}
            placeholder="e.g., Allow user123 to read wallet-789 transactions, but deny delete access."
            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white font-sans text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white dark:focus:bg-slate-800 transition-all"
          />
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Default Identity override:
            </span>
            <input
              type="text"
              value={targetUser}
              onChange={(e) => setTargetUser(e.target.value)}
              placeholder="e.g., Q1OcYhR9... (optional)"
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-brand-500 w-52"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setStatement("");
                setRules([]);
                setAmbiguities([]);
                setHasParsed(false);
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>

            <button
              onClick={() => handleParse()}
              disabled={isParsing || !statement.trim()}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              {isParsing ? "Analyzing Statement..." : "Generate Permission Rules"}
            </button>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3 text-emerald-800 dark:text-emerald-300 text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{saveSuccess}</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-3 text-rose-800 dark:text-rose-300 text-sm">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Ambiguity Resolution Panel */}
      {ambiguities.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 rounded-2xl border border-amber-200/80 dark:border-amber-800/80 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            <h3 className="font-semibold text-sm">
              Ambiguity Clarification Required
            </h3>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
            The policy builder detected an underspecified requirement. To preserve default-deny security, please clarify before saving:
          </p>

          <div className="space-y-2 mt-2">
            {ambiguities.map((amb, idx) => (
              <div
                key={idx}
                className="bg-white/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-amber-200 dark:border-amber-800/60"
              >
                <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Field: <span className="font-mono text-brand-600 dark:text-brand-400">[{amb.field}]</span> — {amb.message}
                </div>
                {amb.suggestions && amb.suggestions.length > 0 && (
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[11px] text-slate-500 font-medium">Quick Fix:</span>
                    {amb.suggestions.map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        onClick={() => handleApplySuggestion(sug)}
                        className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-900 text-amber-900 dark:text-amber-200 text-xs font-medium transition-colors"
                      >
                        Set to: {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Rules Preview */}
      {hasParsed && rules.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Rule Preview ({rules.length} Rule{rules.length > 1 ? "s" : ""})
              </h2>
              {confidence && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                  {Math.round(confidence * 100)}% Confidence
                </span>
              )}
            </div>

            <button
              onClick={() => setShowConfirmModal(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              <Database className="w-4 h-4" />
              Confirm & Save to SQLite
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule, idx) => {
              const isAllow = rule.effect === "allow";
              const actionColors: Record<string, string> = {
                read: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800",
                write: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800",
                delete: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800",
              };

              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4 relative overflow-hidden group hover:border-brand-500/40 transition-all"
                >
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 ${
                      isAllow ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />

                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                        isAllow
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800"
                      }`}
                    >
                      {rule.effect.toUpperCase()}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                        actionColors[rule.action] || "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {rule.action.toUpperCase()}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        Target Resource Path
                      </span>
                      <code className="text-sm font-mono font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                        {rule.resource}
                      </code>
                    </div>

                    <div>
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                        User / Client Identity
                      </span>
                      <code className="text-xs font-mono text-brand-600 dark:text-brand-400">
                        {rule.user_id}
                      </code>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 italic pt-1">
                      "{rule.explanation}"
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Rule #{idx + 1}
                    </span>
                    <button
                      onClick={() => handleTestInPlayground(rule)}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Test in Playground
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmSave}
        title="Commit Rules to SQLite Database"
        message={`Are you sure you want to write ${rules.length} structured permission rule(s) to the OpenGuard SQLite database ('user_permissions' table)? These rules will take effect immediately on http://localhost:8080/authorize.`}
        confirmLabel={isSaving ? "Saving..." : "Yes, Commit Rules"}
      />

      {/* Architecture & Workflow Diagram */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-md">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-brand-400" />
          <h3 className="font-bold text-sm">
            How Natural Language Translation Works
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-brand-400 font-bold block mb-1">1. Clause Splitter</span>
            Parses compound English conjunctions (", but", ";", "however") to handle conflicting allow/deny intents.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-brand-400 font-bold block mb-1">2. Semantic Mapper</span>
            Maps informal verbs ("read", "view", "edit", "purge") to exact HTTP actions: <code className="text-amber-300">read</code>, <code className="text-amber-300">write</code>, <code className="text-amber-300">delete</code>.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-brand-400 font-bold block mb-1">3. Ambiguity Detector</span>
            Flags generic terms ("access") or missing subjects before any database writes occur.
          </div>
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/80">
            <span className="text-brand-400 font-bold block mb-1">4. SQLite Integration</span>
            Stores rules in <code className="text-amber-300">user_permissions</code> ready for evaluation by the Authorization Service.
          </div>
        </div>
      </div>
    </div>
  );
};

import React from "react";
import { Link } from "react-router-dom";
import {
  Shield,
  KeyRound,
  Sliders,
  Sparkles,
  Lock,
  ArrowRight,
  Terminal,
  Database,
  Cpu,
  Layers,
  CheckCircle2,
  Github,
  BookOpen,
} from "lucide-react";
import { Navbar } from "../components/navigation/Navbar.js";

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.15),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(15,23,42,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800/60 text-xs font-semibold text-brand-700 dark:text-brand-300 mb-6 animate-fade-in shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-brand-500" />
            <span>OpenGuard Engine v1.0 • Enterprise Auth0 & SQLite Security</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-4xl mx-auto leading-tight">
            Secure Every Request. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-brand-600 via-indigo-500 to-violet-600 bg-clip-text text-transparent">
              Control Every Permission.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
            OpenGuard combines zero-trust OAuth2 JWT cryptographic validation with high-performance SQLite fine-grained access control. Segment-based wildcards, specificity conflict resolution, and default-deny enforcement out of the box.
          </p>

          {/* Call to actions */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Explore Dashboard
            </Link>
            <Link
              to="/playground"
              className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800/50 hover:bg-brand-100 dark:hover:bg-brand-950/70 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Terminal className="w-4 h-4" /> Try Live API
            </Link>
          </div>

          {/* Code snippet preview */}
          <div className="mt-14 max-w-3xl mx-auto text-left rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="ml-2 text-slate-300 font-medium">POST /authorize</span>
              </div>
              <span className="text-emerald-400 font-bold">200 OK • Decision: ALLOW</span>
            </div>
            <div className="p-5 font-mono text-xs sm:text-sm overflow-x-auto">
              <div className="text-slate-500">// 1. Client evaluates authorization with Bearer token</div>
              <div className="text-brand-300 font-semibold mt-1">
                curl -X POST http://localhost:8080/authorize \
              </div>
              <div className="text-slate-300 pl-4">
                -H "Content-Type: application/json" \
              </div>
              <div className="text-slate-300 pl-4">
                -d &#123; "access_token": "eyJhbGciOiJSUzI1Ni...", "method": "GET", "path": "/wallets/wallet-789/transactions" &#125;
              </div>

              <div className="text-slate-500 mt-4">// 2. Response: Verified token sub claim + SQLite rule evaluation</div>
              <div className="text-emerald-400 mt-1">
                &#123; "decision": "ALLOW", "user_id": "Q1OcYhR9hod5OSSrrxDCYIJfKmIzYSaf@clients", "reason": "Allowed by policy: read on wallets/wallet-789/transactions" &#125;
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section id="features" className="py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400">
              Engine Capabilities
            </h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
              Built for Zero-Trust Microservice Architectures
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:border-brand-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950/60 dark:text-brand-400 flex items-center justify-center mb-4">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                JWT Token Validation
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Asymmetric RS256 signature verification via Auth0 remote JWKS. Enforces issuer, audience, and expiration claims cryptographically.
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:border-brand-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Fine-Grained Authorization
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Maps HTTP verbs into normalized actions (read, write, delete) with canonical resource paths to evaluate permissions per request.
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:border-brand-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 dark:bg-violet-950/60 dark:text-violet-400 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Wildcard Matching
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Segment-aware wildcards like <code className="text-brand-600 dark:text-brand-400 font-mono">wallets/*</code> with specificity ranking so exact rules take precedence over general ones.
              </p>
            </div>

            {/* Card 4 */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 hover:shadow-lg hover:border-brand-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Default-Deny Security
              </h3>
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Principle of least privilege. Any request without an explicit allow rule or with conflicting specificity defaults strictly to DENY.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Overview Section */}
      <section id="architecture" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-xs font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400">
            Pipeline Architecture
          </h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            How Every Request is Evaluated
          </p>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            End-to-end evaluation flow from HTTP client to SQLite permission matrix
          </p>
        </div>

        {/* Step-by-step pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Client Request</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              POST /authorize with access token, method, path
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">JWT Validation</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Auth0 JWKS signature & claims check
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Identity Extract</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Extract user_id from verified sub claim
            </p>
          </div>

          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center shadow-sm">
            <div className="w-8 h-8 rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950 dark:text-violet-400 font-bold text-xs flex items-center justify-center mx-auto mb-3">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">SQLite Engine</h4>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
              Lookup rules, specificity & deny-wins
            </p>
          </div>

          <div className="p-5 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-600 text-white text-center shadow-md">
            <div className="w-8 h-8 rounded-full bg-white/20 text-white font-bold text-xs flex items-center justify-center mx-auto mb-3">
              5
            </div>
            <h4 className="text-xs font-bold">ALLOW / DENY</h4>
            <p className="mt-1 text-[11px] text-brand-100">
              Structured JSON decision & matched rules
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-14 bg-slate-100/60 dark:bg-slate-900/40 border-t border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Production-Grade Tech Stack
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">Node.js 22+</span>
              <span className="text-[11px] text-slate-500">Native SQLite</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">TypeScript</span>
              <span className="text-[11px] text-slate-500">Strict Type Safety</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">Auth0 / jose</span>
              <span className="text-[11px] text-slate-500">RS256 & JWKS</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">Express.js</span>
              <span className="text-[11px] text-slate-500">REST API Server</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">React + Vite</span>
              <span className="text-[11px] text-slate-500">Fast UI Dashboard</span>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="block font-bold text-sm text-slate-900 dark:text-white">Vitest</span>
              <span className="text-[11px] text-slate-500">108 Automated Tests</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-white">
              <Shield className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-slate-900 dark:text-white">OpenGuard</span>
            <span className="text-xs text-slate-400">© 2026. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <Link to="/docs" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              Documentation
            </Link>
            <Link to="/playground" className="hover:text-slate-900 dark:hover:text-white transition-colors">
              API Playground
            </Link>
            <a
              href="https://github.com/SAI-SON/OpenGuard-Authentication-Authorization-Service"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" /> GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

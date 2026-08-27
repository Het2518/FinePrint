"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Mail, Lock, User, Building2, Loader2, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    org_name: "",
    full_name: "",
    email: "",
    password: "",
  });

  // If already logged in, redirect
  useEffect(() => {
    if (localStorage.getItem("fineprint_token")) {
      router.replace("/");
    }
  }, [router]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let token: string;
      if (mode === "register") {
        const res = await api.register({
          org_name: form.org_name,
          email: form.email,
          password: form.password,
          full_name: form.full_name,
        });
        token = res.access_token;
      } else {
        const res = await api.login({ email: form.email, password: form.password });
        token = res.access_token;
      }
      localStorage.setItem("fineprint_token", token);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-indigo-500/30">
            <Shield size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">FinePrint</h1>
          <p className="text-sm text-slate-500 mt-1">AI Contract Risk Monitor</p>
        </div>

        {/* Card */}
        <div className="glass rounded-2xl border border-white/[0.08] p-8 shadow-2xl shadow-black/40">
          {/* Tab toggle */}
          <div className="flex p-1 glass rounded-xl border border-white/[0.06] mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${
                  mode === m
                    ? "bg-indigo-500 text-white shadow-sm shadow-indigo-500/30"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      required
                      value={form.org_name}
                      onChange={set("org_name")}
                      placeholder="Acme Corp"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 border border-white/[0.08] focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      value={form.full_name}
                      onChange={set("full_name")}
                      placeholder="Jane Smith"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 border border-white/[0.08] focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 border border-white/[0.08] focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-800/60 rounded-xl text-sm text-slate-200 placeholder-slate-600 border border-white/[0.08] focus:outline-none focus:border-indigo-500/50 focus:bg-slate-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
            >
              {loading && <Loader2 size={14} className="animate-spin" />}
              {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          {/* Demo shortcut */}
          <div className="mt-5 pt-5 border-t border-white/[0.06] text-center">
            <p className="text-xs text-slate-600 mb-2">Quick demo fill</p>
            <button
              onClick={() => setForm({ org_name: "Demo Corp", full_name: "Admin", email: "admin@demo.com", password: "secret123" })}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Use demo credentials
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          FinePrint MVP · All data isolated per org · MCP-powered
        </p>
      </div>
    </div>
  );
}

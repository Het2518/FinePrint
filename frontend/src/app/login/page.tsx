"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Shield, Mail, Lock, User, Building2, Loader2, Eye, EyeOff,
} from "lucide-react";
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

  const set =
    (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
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
        const res = await api.login({
          email: form.email,
          password: form.password,
        });
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

  const inputStyle = {
    background: "var(--input-bg)",
    border: "1px solid var(--input-border)",
    color: "var(--text-primary)",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: "var(--bg-canvas)" }}
    >
      {/* Subtle geometric accent */}
      <div
        className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none"
        style={{
          background: `radial-gradient(circle, var(--accent) 0%, transparent 70%)`,
          transform: "translate(30%, -30%)",
        }}
      />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-12 h-12 rounded-md flex items-center justify-center mx-auto mb-4"
            style={{
              background: "var(--accent-muted)",
              border: "1px solid var(--accent-border)",
            }}
          >
            <Shield size={24} style={{ color: "var(--accent)" }} />
          </div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            FinePrint
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            AI Contract Risk Monitor
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-md p-8"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {/* Tab toggle */}
          <div
            className="flex p-1 rounded-md mb-6"
            style={{
              background: "var(--bg-surface-raised)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                }}
                className="flex-1 py-2 rounded-md text-sm font-medium capitalize transition-colors duration-200"
                style={{
                  background:
                    mode === m ? "var(--bg-surface)" : "transparent",
                  color: mode === m ? "var(--text-primary)" : "var(--text-tertiary)",
                  boxShadow: mode === m ? "var(--shadow-sm)" : "none",
                  border: mode === m ? "1px solid var(--border-subtle)" : "1px solid transparent",
                }}
              >
                {m === "login" ? "Sign In" : "Register"}
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="space-y-5">
            {mode === "register" && (
              <>
                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-widest block mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Organization Name
                  </label>
                  <div className="relative">
                    <Building2
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-disabled)" }}
                    />
                    <input
                      required
                      value={form.org_name}
                      onChange={set("org_name")}
                      placeholder="Acme Corp"
                      className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-colors"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--input-focus-border)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--input-border)";
                      }}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className="text-[11px] font-bold uppercase tracking-widest block mb-2"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User
                      size={16}
                      className="absolute left-4 top-1/2 -translate-y-1/2"
                      style={{ color: "var(--text-disabled)" }}
                    />
                    <input
                      value={form.full_name}
                      onChange={set("full_name")}
                      placeholder="Jane Smith"
                      className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-colors"
                      style={inputStyle}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--input-focus-border)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor =
                          "var(--input-border)";
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-widest block mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-disabled)" }}
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={set("email")}
                  placeholder="you@company.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-border)";
                  }}
                />
              </div>
            </div>

            <div>
              <label
                className="text-[11px] font-bold uppercase tracking-widest block mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-disabled)" }}
                />
                <input
                  required
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-md text-sm outline-none transition-colors"
                  style={inputStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-focus-border)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor =
                      "var(--input-border)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors hover:opacity-80"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div
                className="p-4 rounded-md text-xs flex items-start gap-2"
                style={{
                  background: "var(--status-danger-muted)",
                  border: "1px solid var(--status-danger-border)",
                  color: "var(--status-danger)",
                }}
              >
                <Lock size={14} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-md text-sm font-semibold transition-colors duration-200 disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
              style={{
                background: "var(--accent)",
                color: "var(--accent-text)",
              }}
            >
              {loading && (
                <Loader2 size={14} className="animate-spin-slow" />
              )}
              {loading
                ? "Authenticating..."
                : mode === "login"
                  ? "Sign In to FinePrint"
                  : "Create Account"}
            </button>
          </form>

          {/* Demo shortcut */}
          <div
            className="mt-5 pt-5 text-center"
            style={{ borderTop: "1px solid var(--border-subtle)" }}
          >
            <p
              className="text-xs mb-2"
              style={{ color: "var(--text-disabled)" }}
            >
              Quick demo fill
            </p>
            <button
              onClick={() => {
                setForm({
                  org_name: "Demo Corp",
                  full_name: "Admin",
                  email: "admin@demo.com",
                  password: "secret123",
                });
                setMode("register");
                setError(null);
              }}
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              Use demo credentials
            </button>
          </div>
        </div>

        <p
          className="text-center text-xs mt-6"
          style={{ color: "var(--text-disabled)" }}
        >
          FinePrint MVP -- All data isolated per org -- MCP-powered
        </p>
      </div>
    </div>
  );
}

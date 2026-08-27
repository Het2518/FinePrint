"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import {
  DollarSign, FileText, Bell, CheckCircle,
  Wifi, WifiOff, RefreshCw, ArrowRight, TrendingUp
} from "lucide-react";
import Link from "next/link";

interface Summary {
  total_contracts: number;
  pending_approvals: number;
  total_exposure_usd: number;
  realized_savings_usd: number;
  risk_breakdown: { high: number; medium: number; low: number; unknown: number };
  mcp_connections: { server_type: string; status: string; last_verified_at: string | null }[];
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.dashboardSummary();
      setSummary(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time contract risk intelligence</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-sm text-slate-300 hover:text-white border border-white/[0.07] hover:border-indigo-500/30 transition-all duration-200"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
          <p className="text-sm text-indigo-300">
            🔑 <span className="font-medium">Not logged in.</span> Use <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-xs">/auth/register</code> to create your account, then paste your token in localStorage as <code className="bg-indigo-500/20 px-1.5 py-0.5 rounded text-xs">fineprint_token</code>.
          </p>
          <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="text-xs text-indigo-400 hover:text-indigo-200 whitespace-nowrap ml-4 underline">
            Open API Docs →
          </a>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Contracts"
          value={loading ? "—" : summary?.total_contracts ?? 0}
          subtitle="Monitored across all sources"
          icon={<FileText size={18} />}
          accent="indigo"
        />
        <StatCard
          title="Total Exposure"
          value={loading ? "—" : fmtUSD(summary?.total_exposure_usd ?? 0)}
          subtitle="Estimated savings potential"
          icon={<DollarSign size={18} />}
          accent="amber"
          trend={{ value: "vs last month", up: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? "—" : summary?.pending_approvals ?? 0}
          subtitle="Awaiting human review"
          icon={<Bell size={18} />}
          accent="red"
        />
        <StatCard
          title="Realized Savings"
          value={loading ? "—" : fmtUSD(summary?.realized_savings_usd ?? 0)}
          subtitle="From verified outcomes"
          icon={<CheckCircle size={18} />}
          accent="emerald"
          trend={{ value: "YTD confirmed", up: true }}
        />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Risk Breakdown */}
        <div className="glass rounded-2xl p-5 border border-white/[0.06] col-span-1">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">Risk Breakdown</p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 rounded-lg bg-slate-800/50 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "high", label: "High", color: "bg-red-400", bg: "bg-red-400/10" },
                { key: "medium", label: "Medium", color: "bg-amber-400", bg: "bg-amber-400/10" },
                { key: "low", label: "Low", color: "bg-emerald-400", bg: "bg-emerald-400/10" },
              ].map(({ key, label, color, bg }) => {
                const count = summary?.risk_breakdown[key as keyof typeof summary.risk_breakdown] ?? 0;
                const total = Object.values(summary?.risk_breakdown ?? {}).reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-slate-300 font-medium">{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MCP Connection Health */}
        <div className="glass rounded-2xl p-5 border border-white/[0.06] col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">MCP Connection Health</p>
            <Link href="/settings" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
              Manage →
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-16 rounded-xl bg-slate-800/50 animate-pulse" />)}
            </div>
          ) : summary?.mcp_connections.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-sm">
              No MCP connections configured yet.{" "}
              <Link href="/settings" className="text-indigo-400 hover:underline">Add one →</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {summary?.mcp_connections.map((conn) => (
                <div key={conn.server_type} className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/[0.04]">
                  {conn.status === "active" ? (
                    <Wifi size={16} className="text-emerald-400 shrink-0" />
                  ) : (
                    <WifiOff size={16} className="text-red-400 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-300 capitalize truncate">
                      {conn.server_type.replace("_", " ")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {conn.status === "active" ? "Connected" : "Disconnected"}
                      {conn.last_verified_at && ` · ${new Date(conn.last_verified_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`ml-auto w-2 h-2 rounded-full shrink-0 ${conn.status === "active" ? "bg-emerald-400 pulse-soft" : "bg-red-400"}`} />
                </div>
              ))}
              {/* Mock entries to show design even with no connections */}
              {(summary?.mcp_connections.length ?? 0) === 0 && [
                { server_type: "google_drive", status: "mock" },
                { server_type: "gmail", status: "mock" },
                { server_type: "slack", status: "mock" },
                { server_type: "okta", status: "mock" },
              ].map((conn) => (
                <div key={conn.server_type} className="flex items-center gap-3 bg-slate-800/40 rounded-xl px-4 py-3 border border-white/[0.04] opacity-50">
                  <WifiOff size={16} className="text-slate-500 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-slate-400 capitalize">{conn.server_type.replace("_", " ")}</p>
                    <p className="text-xs text-slate-600">Not configured</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Link
          href="/approvals"
          className="glass rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 group hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-200">
            <Bell size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Review Approval Queue</p>
            <p className="text-xs text-slate-500">
              {summary?.pending_approvals ?? "—"} decisions waiting for your sign-off
            </p>
          </div>
          <ArrowRight size={16} className="text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all duration-200" />
        </Link>

        <Link
          href="/contracts"
          className="glass rounded-2xl p-5 border border-white/[0.06] flex items-center gap-4 group hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-200">
            <TrendingUp size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">View Risk Queue</p>
            <p className="text-xs text-slate-500">Browse and trigger contract scans</p>
          </div>
          <ArrowRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all duration-200" />
        </Link>
      </div>
    </div>
  );
}

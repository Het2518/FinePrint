"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import {
  DollarSign, FileText, Bell, CheckCircle,
  Wifi, WifiOff, RefreshCw, ArrowRight, TrendingUp, KeyRound,
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

  useEffect(() => {
    load();
  }, []);

  const fmtUSD = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Real-time contract risk intelligence
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
            e.currentTarget.style.color = "var(--text-primary)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
            e.currentTarget.style.color = "var(--text-secondary)";
          }}
        >
          <RefreshCw
            size={14}
            className={loading ? "animate-spin-slow" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Error / Auth banner */}
      {error && (
        <div
          className="mb-6 p-4 rounded-md flex items-center justify-between"
          style={{
            background: "var(--accent-muted)",
            border: "1px solid var(--accent-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <KeyRound size={16} style={{ color: "var(--accent)" }} />
            <p className="text-sm" style={{ color: "var(--accent)" }}>
              <span className="font-medium">Not logged in.</span> Use{" "}
              <code
                className="text-xs px-1.5 py-0.5 rounded"
                style={{ background: "var(--accent-muted)" }}
              >
                /auth/register
              </code>{" "}
              to create your account.
            </p>
          </div>
          <a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium underline whitespace-nowrap ml-4"
            style={{ color: "var(--accent)" }}
          >
            Open API Docs
          </a>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Contracts"
          value={loading ? "--" : summary?.total_contracts ?? 0}
          subtitle="Monitored across all sources"
          icon={<FileText size={16} />}
        />
        <StatCard
          title="Total Exposure"
          value={loading ? "--" : fmtUSD(summary?.total_exposure_usd ?? 0)}
          subtitle="Estimated savings potential"
          icon={<DollarSign size={16} />}
          trend={{ value: "vs last month", up: true }}
        />
        <StatCard
          title="Pending Approvals"
          value={loading ? "--" : summary?.pending_approvals ?? 0}
          subtitle="Awaiting human review"
          icon={<Bell size={16} />}
        />
        <StatCard
          title="Realized Savings"
          value={loading ? "--" : fmtUSD(summary?.realized_savings_usd ?? 0)}
          subtitle="From verified outcomes"
          icon={<CheckCircle size={16} />}
          trend={{ value: "YTD confirmed", up: true }}
        />
      </div>

      {/* Middle section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Risk Breakdown */}
        <div
          className="rounded-md p-5"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--text-tertiary)" }}
          >
            Risk Breakdown
          </p>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-8 rounded-md skeleton" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {[
                { key: "high", label: "High", color: "var(--status-danger)" },
                { key: "medium", label: "Medium", color: "var(--status-warning)" },
                { key: "low", label: "Low", color: "var(--status-success)" },
              ].map(({ key, label, color }) => {
                const count =
                  summary?.risk_breakdown[
                    key as keyof typeof summary.risk_breakdown
                  ] ?? 0;
                const total =
                  Object.values(summary?.risk_breakdown ?? {}).reduce(
                    (a, b) => a + b,
                    0
                  ) || 1;
                const pct = Math.round((count / total) * 100);
                return (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--text-secondary)" }}>
                        {label}
                      </span>
                      <span
                        className="font-medium tabular-nums"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {count}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--bg-surface-raised)" }}
                    >
                      <div
                        className="h-full rounded-full animate-gauge-fill"
                        style={{ width: `${pct}%`, background: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* MCP Connection Health */}
        <div
          className="rounded-md p-5 lg:col-span-2"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <p
              className="text-[11px] font-semibold uppercase tracking-widest"
              style={{ color: "var(--text-tertiary)" }}
            >
              System Health
            </p>
            <Link
              href="/settings"
              className="text-xs font-medium transition-colors"
              style={{ color: "var(--accent)" }}
            >
              Manage
            </Link>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-14 rounded-md skeleton" />
              ))}
            </div>
          ) : summary?.mcp_connections.length === 0 ? (
            <div
              className="text-center py-8 text-sm"
              style={{ color: "var(--text-tertiary)" }}
            >
              No MCP connections configured.{" "}
              <Link
                href="/settings"
                className="font-medium"
                style={{ color: "var(--accent)" }}
              >
                Add one
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {summary?.mcp_connections.map((conn) => (
                <div
                  key={conn.server_type}
                  className="flex items-center gap-3 rounded-md px-4 py-3"
                  style={{
                    background: "var(--bg-surface-raised)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {conn.status === "active" ? (
                    <Wifi
                      size={14}
                      style={{ color: "var(--status-success)", flexShrink: 0 }}
                    />
                  ) : (
                    <WifiOff
                      size={14}
                      style={{ color: "var(--status-danger)", flexShrink: 0 }}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium capitalize truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {conn.server_type.replace("_", " ")}
                    </p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {conn.status === "active" ? "Connected" : "Disconnected"}
                      {conn.last_verified_at &&
                        ` · ${new Date(conn.last_verified_at).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      conn.status === "active" ? "animate-pulse-glow" : ""
                    }`}
                    style={{
                      background:
                        conn.status === "active"
                          ? "var(--status-success)"
                          : "var(--text-disabled)",
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/approvals"
          className="rounded-md p-5 flex items-center gap-4 group transition-colors duration-150"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
          }}
        >
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
            style={{
              background: "var(--status-warning-muted)",
              color: "var(--status-warning)",
            }}
          >
            <Bell size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Review Approval Queue
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              {summary?.pending_approvals ?? "--"} decisions waiting for sign-off
            </p>
          </div>
          <ArrowRight
            size={16}
            className="transition-transform duration-150 group-hover:translate-x-1"
            style={{ color: "var(--text-disabled)" }}
          />
        </Link>

        <Link
          href="/contracts"
          className="rounded-md p-5 flex items-center gap-4 group transition-colors duration-150"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--accent-border)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--border-subtle)";
          }}
        >
          <div
            className="w-10 h-10 rounded-md flex items-center justify-center transition-transform duration-150 group-hover:scale-105"
            style={{
              background: "var(--accent-muted)",
              color: "var(--accent)",
            }}
          >
            <TrendingUp size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              View Risk Queue
            </p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>
              Browse and trigger contract scans
            </p>
          </div>
          <ArrowRight
            size={16}
            className="transition-transform duration-150 group-hover:translate-x-1"
            style={{ color: "var(--text-disabled)" }}
          />
        </Link>
      </div>
    </div>
  );
}

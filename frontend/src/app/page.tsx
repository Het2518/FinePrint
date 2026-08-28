"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import StatCard from "@/components/StatCard";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import TimelineEvent from "@/components/TimelineEvent";
import CurrencyValue from "@/components/CurrencyValue";
import EmptyState from "@/components/EmptyState";
import Link from "next/link";
import {
  FileText, Bell, TrendingUp, Wifi, WifiOff,
  DollarSign, RefreshCw, CheckCircle2, ScanLine,
  ArrowRight, Cpu, AlertTriangle,
} from "lucide-react";

export default function DashboardPage() {
  const [summary, setSummary] = useState<any>(null);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [audit, setAudit] = useState<any[]>([]);
  const [orgSettings, setOrgSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    setError(null);
    try {
      const [summaryData, decisionsData, auditData, settingsData] = await Promise.all([
        api.dashboardSummary(),
        api.listDecisions("pending"),
        api.listAuditLogs({ limit: 8 }),
        api.getOrgSettings().catch(() => ({ display_currency: "USD" })),
      ]);
      setSummary(summaryData);
      setDecisions(decisionsData.decisions ?? []);
      setAudit(auditData.events ?? []);
      setOrgSettings(settingsData);
    } catch (e: any) {
      setError(e.message);
    } finally {
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const currency = orgSettings?.display_currency ?? "USD";

  const riskBar = summary?.risk_breakdown;
  const totalRisk = riskBar
    ? (riskBar.high || 0) + (riskBar.medium || 0) + (riskBar.low || 0) + (riskBar.unknown || 0)
    : 0;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Dashboard
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            Real-time contract intelligence overview
          </p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-secondary)",
          }}
        >
          <RefreshCw size={13} className={loading ? "animate-spin-slow" : ""} />
          Refresh
        </button>
      </div>

      {error && (
        <div
          className="mb-5 px-4 py-3 rounded-md text-sm"
          style={{
            background: "var(--status-danger-muted)",
            border: "1px solid var(--status-danger-border)",
            color: "var(--status-danger)",
          }}
        >
          {error}
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Contracts"
          value={loading ? "—" : String(summary?.total_contracts ?? 0)}
          icon={<FileText size={15} />}
        />
        <StatCard
          label="Pending Approvals"
          value={loading ? "—" : String(summary?.pending_approvals ?? 0)}
          icon={<Bell size={15} />}
          accent={summary?.pending_approvals > 0}
        />
        <StatCard
          label="Total Exposure"
          value={loading ? "—" : <CurrencyValue amount={summary?.total_exposure_usd} currency={currency} />}
          icon={<AlertTriangle size={15} />}
        />
        <StatCard
          label="Realized Savings"
          value={loading ? "—" : <CurrencyValue amount={summary?.realized_savings_usd} currency={currency} />}
          icon={<TrendingUp size={15} />}
          positive
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column — main content */}
        <div className="lg:col-span-2 space-y-5">

          {/* Risk Distribution */}
          {riskBar && totalRisk > 0 && (
            <div
              className="rounded-md p-5"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "var(--text-secondary)" }}>
                Risk Distribution
              </h2>
              <div className="flex rounded-md overflow-hidden h-2 mb-3">
                {riskBar.high > 0 && (
                  <div
                    className="transition-all duration-700"
                    style={{ width: `${(riskBar.high / totalRisk) * 100}%`, background: "var(--status-danger)" }}
                    title={`High: ${riskBar.high}`}
                  />
                )}
                {riskBar.medium > 0 && (
                  <div
                    className="transition-all duration-700"
                    style={{ width: `${(riskBar.medium / totalRisk) * 100}%`, background: "var(--status-warning)" }}
                    title={`Medium: ${riskBar.medium}`}
                  />
                )}
                {riskBar.low > 0 && (
                  <div
                    className="transition-all duration-700"
                    style={{ width: `${(riskBar.low / totalRisk) * 100}%`, background: "var(--status-success)" }}
                    title={`Low: ${riskBar.low}`}
                  />
                )}
                {riskBar.unknown > 0 && (
                  <div
                    className="transition-all duration-700"
                    style={{ width: `${(riskBar.unknown / totalRisk) * 100}%`, background: "var(--border-subtle)" }}
                    title={`Unknown: ${riskBar.unknown}`}
                  />
                )}
              </div>
              <div className="flex gap-5 text-xs">
                {[
                  { label: "High", count: riskBar.high, color: "var(--status-danger)" },
                  { label: "Medium", count: riskBar.medium, color: "var(--status-warning)" },
                  { label: "Low", count: riskBar.low, color: "var(--status-success)" },
                  { label: "Unknown", count: riskBar.unknown, color: "var(--border-default)" },
                ].map(({ label, count, color }) => count > 0 && (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span style={{ color: "var(--text-secondary)" }}>{count} {label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Approvals */}
          <div
            className="rounded-md overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-3.5"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Pending Approvals
              </h2>
              <Link
                href="/approvals"
                className="text-xs font-medium flex items-center gap-1"
                style={{ color: "var(--accent)" }}
              >
                View all <ArrowRight size={11} />
              </Link>
            </div>

            {loading ? (
              <div className="p-5 space-y-3">
                {[1,2].map(i => <div key={i} className="h-14 rounded-md skeleton" />)}
              </div>
            ) : decisions.length === 0 ? (
              <EmptyState
                compact
                icon={<CheckCircle2 size={16} />}
                title="No pending approvals"
                description="All decisions have been reviewed."
              />
            ) : (
              <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                {decisions.slice(0, 4).map((d: any) => (
                  <div key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {d.vendor_name ?? d.file_name ?? "Unknown Vendor"}
                      </p>
                      <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-tertiary)" }}>
                        {d.situation ? d.situation.slice(0, 80) + (d.situation.length > 80 ? "…" : "") : "Pending review"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.risk_level && <RiskBadge level={d.risk_level} />}
                      {d.expected_impact?.savings_annual != null && (
                        <span className="text-xs font-mono font-semibold" style={{ color: "var(--status-success)" }}>
                          <CurrencyValue amount={d.expected_impact.savings_annual} currency={currency} />
                        </span>
                      )}
                      <Link
                        href="/approvals"
                        className="text-xs px-2.5 py-1 rounded-md font-medium"
                        style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column — system status */}
        <div className="space-y-5">
          {/* MCP Health */}
          <div
            className="rounded-md overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div className="px-4 py-3.5" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Integrations
              </h2>
            </div>
            <div className="px-4 py-3 space-y-2.5">
              {loading ? (
                [1,2,3].map(i => <div key={i} className="h-7 rounded skeleton" />)
              ) : summary?.mcp_connections?.length === 0 ? (
                <p className="text-xs py-2" style={{ color: "var(--text-disabled)" }}>
                  No integrations configured.
                </p>
              ) : (
                (summary?.mcp_connections ?? []).map((c: any) => (
                  <div key={c.server_type} className="flex items-center justify-between">
                    <span className="text-sm capitalize" style={{ color: "var(--text-primary)" }}>
                      {c.server_type.replace(/_/g, " ")}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs">
                      {c.status === "active" ? (
                        <>
                          <Wifi size={11} style={{ color: "var(--status-success)" }} />
                          <span style={{ color: "var(--status-success)" }}>Connected</span>
                        </>
                      ) : (
                        <>
                          <WifiOff size={11} style={{ color: "var(--text-disabled)" }} />
                          <span style={{ color: "var(--text-disabled)" }}>Disconnected</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
              <Link
                href="/settings"
                className="block text-xs pt-1.5"
                style={{ color: "var(--accent)" }}
              >
                Manage integrations →
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div
            className="rounded-md overflow-hidden"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-3.5"
              style={{ borderBottom: "1px solid var(--border-subtle)" }}
            >
              <h2 className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-secondary)" }}>
                Recent Activity
              </h2>
              <Link href="/activity" className="text-xs" style={{ color: "var(--accent)" }}>
                View all →
              </Link>
            </div>
            <div className="px-4 pt-4 pb-2">
              {loading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-10 rounded skeleton" />)}
                </div>
              ) : audit.length === 0 ? (
                <EmptyState compact icon={<Cpu size={14} />} title="No activity yet" />
              ) : (
                audit.slice(0, 5).map((e, i) => (
                  <TimelineEvent
                    key={e.id}
                    action={e.action}
                    entityType={e.entity_type}
                    userId={e.user_id}
                    detail={e.detail}
                    timestamp={e.timestamp}
                    isLast={i === Math.min(4, audit.length - 1)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { AlertTriangle, Clock, CheckCircle2, Calendar, RefreshCw, TrendingUp } from "lucide-react";

interface RenewalEntry {
  contract_id: string;
  vendor_name: string;
  renewal_date: string;
  days_until_renewal: number;
  auto_renew: boolean | null;
  notice_period_days: number | null;
  notice_deadline: string | null;
  contract_value_annual: number | null;
  currency: string;
  risk_level: string | null;
  recommended_action: string | null;
}

const BUCKET_CONFIG = {
  expired:  { label: "Expired",         color: "var(--text-disabled)",    bg: "var(--bg-surface-raised)",     border: "var(--border-subtle)",         icon: Clock },
  critical: { label: "Critical ≤30d",   color: "var(--status-danger)",    bg: "var(--status-danger-muted)",   border: "var(--status-danger-border)",  icon: AlertTriangle },
  warning:  { label: "Warning 31–60d",  color: "var(--status-warning)",   bg: "var(--status-warning-muted)",  border: "var(--status-warning-border)", icon: AlertTriangle },
  watch:    { label: "Watch 61–90d",    color: "var(--accent)",           bg: "var(--accent-muted)",          border: "var(--accent-border)",         icon: Calendar },
  safe:     { label: "Safe >90d",       color: "var(--status-success)",   bg: "var(--status-success-muted)",  border: "var(--status-success-border)", icon: CheckCircle2 },
};

function RenewalCard({ entry, cfg }: { entry: RenewalEntry; cfg: typeof BUCKET_CONFIG[keyof typeof BUCKET_CONFIG] }) {
  const daysLabel =
    entry.days_until_renewal < 0
      ? `Expired ${Math.abs(entry.days_until_renewal)}d ago`
      : entry.days_until_renewal === 0
      ? "Renews today!"
      : `${entry.days_until_renewal} days`;

  return (
    <Link
      href={`/contracts/${entry.contract_id}`}
      className="block rounded-xl p-4 transition-all hover:scale-[1.01]"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
          {entry.vendor_name}
        </p>
        <span
          className="shrink-0 text-xs font-bold px-2 py-0.5 rounded-full tabular-nums"
          style={{ background: cfg.border, color: cfg.color }}
        >
          {daysLabel}
        </span>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: "var(--text-tertiary)" }}>
        <span>📅 {new Date(entry.renewal_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
        {entry.contract_value_annual && (
          <span>💰 ${entry.contract_value_annual.toLocaleString()} {entry.currency}/yr</span>
        )}
        {entry.auto_renew && (
          <span style={{ color: "var(--status-warning)" }}>⚠ Auto-renews</span>
        )}
        {entry.notice_deadline && (
          <span style={{ color: cfg.color }}>
            ⏰ Notice by {new Date(entry.notice_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
        {entry.recommended_action && (
          <span className="capitalize" style={{ color: cfg.color }}>
            → {entry.recommended_action.replace(/_/g, " ")}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function RenewalsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await (api as any).getRenewals();
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const summary = data?.summary ?? {};
  const buckets = data?.buckets ?? {};

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Renewal Calendar
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            {data?.today ? `As of ${new Date(data.today).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : "Contract renewal timeline"}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        >
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {/* Summary KPIs */}
      {!loading && (
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {(Object.keys(BUCKET_CONFIG) as (keyof typeof BUCKET_CONFIG)[]).map((key) => {
            const cfg = BUCKET_CONFIG[key];
            const count = summary[key] ?? 0;
            return (
              <div
                key={key}
                className="rounded-xl p-4 text-center"
                style={{ background: count > 0 ? cfg.bg : "var(--bg-surface)", border: `1px solid ${count > 0 ? cfg.border : "var(--border-subtle)"}` }}
              >
                <p className="text-2xl font-bold tabular-nums mb-1" style={{ color: count > 0 ? cfg.color : "var(--text-disabled)" }}>
                  {count}
                </p>
                <p className="text-[10px] font-medium" style={{ color: "var(--text-tertiary)" }}>
                  {cfg.label}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Bucket sections */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl skeleton" />)}
        </div>
      ) : summary.total === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
        >
          <Calendar size={32} className="mx-auto mb-3" style={{ color: "var(--text-disabled)" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>No renewals found</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>
            Scan contracts with renewal dates to populate this calendar.
          </p>
        </div>
      ) : (
        (Object.keys(BUCKET_CONFIG) as (keyof typeof BUCKET_CONFIG)[])
          .filter((key) => (buckets[key]?.length ?? 0) > 0)
          .map((key) => {
            const cfg = BUCKET_CONFIG[key];
            const Icon = cfg.icon;
            return (
              <section key={key}>
                <div className="flex items-center gap-2 mb-3">
                  <Icon size={14} style={{ color: cfg.color }} />
                  <h2 className="text-sm font-semibold" style={{ color: cfg.color }}>
                    {cfg.label}
                  </h2>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: cfg.border, color: cfg.color }}
                  >
                    {buckets[key].length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {buckets[key].map((entry: RenewalEntry) => (
                    <RenewalCard key={entry.contract_id} entry={entry} cfg={cfg} />
                  ))}
                </div>
              </section>
            );
          })
      )}
    </div>
  );
}

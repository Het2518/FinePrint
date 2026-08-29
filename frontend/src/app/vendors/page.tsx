"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Building2, DollarSign, TrendingUp, AlertTriangle, Calendar, RefreshCw, ChevronRight } from "lucide-react";
import Link from "next/link";
import RiskBadge from "@/components/RiskBadge";

export default function VendorsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await (api as any).getVendors();
      setData(res);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const formatUSD = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` :
    n >= 1_000 ? `$${(n / 1_000).toFixed(0)}K` : `$${n.toFixed(0)}`;

  const vendors = (data?.vendors ?? []).filter((v: any) =>
    !search || v.vendor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            Vendor Intelligence
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-tertiary)" }}>
            {data?.vendor_count ?? "—"} vendors · ${data?.total_portfolio_spend ? formatUSD(data.total_portfolio_spend) : "—"} total annual portfolio
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search vendor…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-2 rounded-lg outline-none"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-primary)",
              width: "180px",
            }}
          />
          <button
            onClick={load}
            className="p-2 rounded-lg transition-colors"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--border-subtle)" }}>
        {/* Table header */}
        <div
          className="grid grid-cols-6 gap-4 px-5 py-3 text-[10px] font-semibold uppercase tracking-wider"
          style={{ background: "var(--bg-surface-raised)", color: "var(--text-tertiary)", borderBottom: "1px solid var(--border-subtle)" }}
        >
          <span className="col-span-2">Vendor</span>
          <span className="text-right">Annual Spend</span>
          <span className="text-center">Contracts</span>
          <span className="text-center">Risk</span>
          <span className="text-right">Next Renewal</span>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-14 rounded skeleton" />)}
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <Building2 size={28} className="mx-auto mb-2" style={{ color: "var(--text-disabled)" }} />
            <p className="text-sm" style={{ color: "var(--text-tertiary)" }}>No vendors found</p>
          </div>
        ) : (
          vendors.map((v: any, i: number) => (
            <div
              key={v.vendor_name}
              className="grid grid-cols-6 gap-4 px-5 py-4 items-center transition-colors"
              style={{
                background: i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-raised)",
                borderBottom: "1px solid var(--border-subtle)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--sidebar-hover)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = i % 2 === 0 ? "var(--bg-surface)" : "var(--bg-surface-raised)")}
            >
              {/* Vendor name */}
              <div className="col-span-2 flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold"
                  style={{ background: "var(--accent-muted)", color: "var(--accent)" }}
                >
                  {v.vendor_name?.[0] ?? "?"}
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{v.vendor_name}</p>
                  <div className="flex gap-2 mt-0.5">
                    {v.has_auto_renew && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--status-warning-muted)", color: "var(--status-warning)" }}>
                        Auto-renew
                      </span>
                    )}
                    {v.avg_escalation_pct && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--status-danger-muted)", color: "var(--status-danger)" }}>
                        +{v.avg_escalation_pct}%/yr
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Spend */}
              <p className="text-sm font-mono font-semibold text-right" style={{ color: "var(--status-success)" }}>
                {formatUSD(v.total_annual_spend)}
              </p>

              {/* Contracts */}
              <p className="text-sm text-center tabular-nums" style={{ color: "var(--text-secondary)" }}>
                {v.contract_count}
              </p>

              {/* Risk */}
              <div className="flex justify-center">
                {v.dominant_risk ? <RiskBadge level={v.dominant_risk} /> : <span style={{ color: "var(--text-disabled)" }}>—</span>}
              </div>

              {/* Renewal */}
              <div className="text-right">
                {v.next_renewal ? (
                  <div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: (v.days_until_next_renewal ?? 999) <= 30 ? "var(--status-danger)" : (v.days_until_next_renewal ?? 999) <= 60 ? "var(--status-warning)" : "var(--text-secondary)" }}
                    >
                      {v.days_until_next_renewal < 0 ? "Expired" : `${v.days_until_next_renewal}d`}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--text-disabled)" }}>
                      {new Date(v.next_renewal).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                ) : (
                  <span style={{ color: "var(--text-disabled)" }}>—</span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Link to renewals */}
      <Link
        href="/renewals"
        className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-colors"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-secondary)")}
      >
        <Calendar size={14} /> View Full Renewal Calendar <ChevronRight size={14} />
      </Link>
    </div>
  );
}

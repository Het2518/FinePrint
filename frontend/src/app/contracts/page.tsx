"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import StatusBadge from "@/components/StatusBadge";
import EmptyState from "@/components/EmptyState";
import CurrencyValue from "@/components/CurrencyValue";
import {
  Search, Upload, RefreshCw, ScanLine, FileText, Loader2,
  ChevronRight, RotateCcw, AlertTriangle, Filter, X,
  Mail, HardDrive, Globe,
} from "lucide-react";

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  gmail:          <Mail size={12} />,
  google_drive:   <HardDrive size={12} />,
  manual_upload:  <Upload size={12} />,
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);
  const [orgSettings, setOrgSettings] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const params: any = {};
      if (riskFilter) params.risk_level = riskFilter;
      if (statusFilter) params.status = statusFilter;
      const data = await api.listContracts(params);
      setContracts(data.contracts || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, [riskFilter, statusFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.getOrgSettings().then(setOrgSettings).catch(() => {}); }, []);

  // Poll while any contract is scanning
  useEffect(() => {
    const isScanning = contracts.some((c) => c.status === "scanning");
    if (!isScanning) return;
    const interval = setInterval(() => load(true), 3500);
    return () => clearInterval(interval);
  }, [contracts, load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadContract(file);
      await load(true);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const triggerScan = async (id: string) => {
    setScanning(id);
    try {
      await api.triggerScan(id);
      await load(true);
    } finally {
      setScanning(null);
    }
  };

  const currency = orgSettings?.display_currency ?? "USD";

  const filtered = contracts.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.file_name?.toLowerCase().includes(q) ||
      c.vendor_name?.toLowerCase().includes(q) ||
      c.status?.toLowerCase().includes(q)
    );
  });

  const hasActiveFilters = riskFilter || statusFilter;

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Contracts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {contracts.length} contract{contracts.length !== 1 ? "s" : ""} monitored
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load(true)}
            disabled={loading}
            className="p-2 rounded-md transition-colors"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? "animate-spin-slow" : ""} />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
            style={{ background: "var(--accent)", color: "var(--accent-text)" }}
          >
            {uploading ? <Loader2 size={14} className="animate-spin-slow" /> : <Upload size={14} />}
            {uploading ? "Uploading…" : "Upload Contract"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Filter bar */}
      <div
        className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-md"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Search */}
        <div
          className="flex items-center gap-2 flex-1 min-w-48 px-3 py-1.5 rounded-md"
          style={{
            background: "var(--bg-surface-raised)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          <Search size={13} style={{ color: "var(--text-disabled)" }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contracts…"
            className="bg-transparent text-sm outline-none w-full"
            style={{ color: "var(--text-primary)" }}
          />
          {search && (
            <button onClick={() => setSearch("")}>
              <X size={12} style={{ color: "var(--text-disabled)" }} />
            </button>
          )}
        </div>

        {/* Risk filter */}
        <select
          value={riskFilter}
          onChange={(e) => setRiskFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md text-sm outline-none"
          style={{
            background: riskFilter ? "var(--accent-muted)" : "var(--bg-surface-raised)",
            border: `1px solid ${riskFilter ? "var(--accent-border)" : "var(--border-subtle)"}`,
            color: riskFilter ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <option value="">All Risk Levels</option>
          <option value="high">High Risk</option>
          <option value="medium">Medium Risk</option>
          <option value="low">Low Risk</option>
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 rounded-md text-sm outline-none"
          style={{
            background: statusFilter ? "var(--accent-muted)" : "var(--bg-surface-raised)",
            border: `1px solid ${statusFilter ? "var(--accent-border)" : "var(--border-subtle)"}`,
            color: statusFilter ? "var(--accent)" : "var(--text-secondary)",
          }}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="scanning">Scanning</option>
          <option value="manual_review">Manual Review</option>
          <option value="parse_failed">Parse Failed</option>
          <option value="archived">Archived</option>
        </select>

        {hasActiveFilters && (
          <button
            onClick={() => { setRiskFilter(""); setStatusFilter(""); }}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md"
            style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}
          >
            <X size={11} /> Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div
        className="rounded-md overflow-hidden"
        style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)" }}
      >
        {/* Table header */}
        <div
          className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-5 py-2.5 text-xs font-semibold uppercase tracking-wider"
          style={{
            borderBottom: "1px solid var(--border-subtle)",
            color: "var(--text-tertiary)",
            background: "var(--bg-surface-raised)",
          }}
        >
          <span>Contract / Vendor</span>
          <span>Status</span>
          <span>Risk</span>
          <span>Annual Value</span>
          <span>Last Scanned</span>
          <span />
        </div>

        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 rounded-md skeleton" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={18} />}
            title={hasActiveFilters || search ? "No contracts match your filters" : "No contracts yet"}
            description={
              hasActiveFilters || search
                ? "Try adjusting your search or filters."
                : "Upload your first contract to get started with AI risk analysis."
            }
            action={
              !hasActiveFilters && !search ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium"
                  style={{ background: "var(--accent)", color: "var(--accent-text)" }}
                >
                  <Upload size={13} /> Upload Contract
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
            {filtered.map((c) => {
              const isScanning = c.status === "scanning" || scanning === c.id;
              return (
                <div
                  key={c.id}
                  className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 transition-colors"
                  style={{ color: "var(--text-primary)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--bg-surface-raised)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Contract name + vendor */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Link
                        href={`/contracts/${c.id}`}
                        className="text-sm font-semibold truncate hover:underline"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.vendor_name ?? c.file_name}
                      </Link>
                      {c.auto_renew && (
                        <span
                          className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded shrink-0"
                          style={{
                            background: "var(--status-warning-muted)",
                            color: "var(--status-warning)",
                          }}
                          title="Auto-renew active"
                        >
                          <RotateCcw size={8} /> Auto-renew
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-tertiary)" }}>
                      {SOURCE_ICONS[c.source] ?? <Globe size={11} />}
                      <span className="font-mono truncate max-w-[180px]">{c.file_name}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <StatusBadge status={c.status} />
                  </div>

                  {/* Risk */}
                  <div>
                    {c.risk_level ? (
                      <RiskBadge level={c.risk_level} />
                    ) : (
                      <span className="text-xs" style={{ color: "var(--text-disabled)" }}>—</span>
                    )}
                  </div>

                  {/* Value */}
                  <div className="text-sm font-mono tabular-nums" style={{ color: "var(--text-primary)" }}>
                    {c.contract_value_annual != null ? (
                      <CurrencyValue amount={c.contract_value_annual} currency={currency} />
                    ) : (
                      <span style={{ color: "var(--text-disabled)" }}>—</span>
                    )}
                  </div>

                  {/* Last scanned */}
                  <div className="text-xs" style={{ color: "var(--text-tertiary)" }}>
                    {c.last_scanned_at
                      ? new Date(c.last_scanned_at).toLocaleDateString()
                      : <span style={{ color: "var(--text-disabled)" }}>Never</span>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.preventDefault(); triggerScan(c.id); }}
                      disabled={isScanning}
                      className="p-1.5 rounded-md transition-colors disabled:opacity-40"
                      style={{
                        background: "var(--bg-surface-raised)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                      title="Run AI Scan"
                    >
                      {isScanning ? (
                        <Loader2 size={12} className="animate-spin-slow" />
                      ) : (
                        <ScanLine size={12} />
                      )}
                    </button>
                    <Link
                      href={`/contracts/${c.id}`}
                      className="p-1.5 rounded-md transition-colors"
                      style={{
                        background: "var(--bg-surface-raised)",
                        border: "1px solid var(--border-subtle)",
                        color: "var(--text-secondary)",
                      }}
                      title="View details"
                    >
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs mt-3 text-center tabular-nums" style={{ color: "var(--text-disabled)" }}>
          Showing {filtered.length} of {contracts.length} contracts
        </p>
      )}
    </div>
  );
}

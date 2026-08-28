"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import {
  Search, Upload, RefreshCw, ScanLine, FileText, ChevronRight, Filter,
} from "lucide-react";

interface Contract {
  id: string;
  file_name: string;
  source: string;
  status: string;
  last_scanned_at: string | null;
  vendor_name: string | null;
  renewal_date: string | null;
  annual_value: number | null;
  risk_level: string | null;
  approval_status: string | null;
}

const STATUS_STYLES: Record<string, { color: string; bg: string }> = {
  active: { color: "var(--status-success)", bg: "var(--status-success-muted)" },
  scanning: { color: "var(--accent)", bg: "var(--accent-muted)" },
  manual_review: { color: "var(--status-warning)", bg: "var(--status-warning-muted)" },
  parse_failed: { color: "var(--status-danger)", bg: "var(--status-danger-muted)" },
  archived: { color: "var(--status-neutral)", bg: "var(--status-neutral-muted)" },
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);

  const load = useCallback(async (background = false) => {
    if (!background) setLoading(true);
    try {
      const data = await api.listContracts(
        riskFilter ? { risk_level: riskFilter } : undefined
      );
      setContracts(data.contracts || []);
    } catch (e) {
      console.error(e);
    } finally {
      if (!background) setLoading(false);
    }
  }, [riskFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const isScanning = contracts.some((c) => c.status === "scanning");
    if (isScanning) {
      const interval = setInterval(() => load(true), 3000);
      return () => clearInterval(interval);
    }
  }, [contracts, load]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadContract(file);
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const triggerScan = async (id: string) => {
    setScanning(id);
    try {
      await api.triggerScan(id);
      setTimeout(load, 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setScanning(null);
    }
  };

  const filtered = contracts.filter(
    (c) =>
      c.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.file_name.toLowerCase().includes(search.toLowerCase())
  );

  const fmtUSD = (n: number | null) =>
    n
      ? new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        }).format(n)
      : "--";

  return (
    <div className="min-h-screen p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ color: "var(--text-primary)" }}
          >
            Contracts
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-tertiary)" }}>
            {contracts.length} contracts monitored
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-md transition-colors duration-150"
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            <RefreshCw
              size={14}
              className={loading ? "animate-spin-slow" : ""}
            />
          </button>
          <label
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors duration-150"
            style={{
              background: "var(--accent)",
              color: "var(--accent-text)",
            }}
          >
            <Upload size={14} />
            {uploading ? "Uploading..." : "Upload Contract"}
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-disabled)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor or filename..."
            className="w-full pl-9 pr-4 py-2.5 rounded-md text-sm outline-none transition-colors"
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              color: "var(--text-primary)",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = "var(--input-focus-border)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = "var(--input-border)";
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} style={{ color: "var(--text-disabled)" }} />
          {["", "high", "medium", "low"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className="px-3 py-2 rounded-md text-xs font-medium transition-all duration-150"
              style={{
                background:
                  riskFilter === r ? "var(--accent-muted)" : "var(--bg-surface)",
                color:
                  riskFilter === r ? "var(--accent)" : "var(--text-secondary)",
                border: `1px solid ${
                  riskFilter === r
                    ? "var(--accent-border)"
                    : "var(--border-subtle)"
                }`,
              }}
            >
              {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-md overflow-hidden"
        style={{
          background: "var(--bg-surface)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)" }}>
              {[
                "Vendor / File",
                "Annual Value",
                "Renewal",
                "Risk",
                "Status",
                "Last Scanned",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="text-left px-5 py-3 text-[11px] font-semibold uppercase tracking-widest"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid var(--border-subtle)" }}
                >
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div
                        className="h-4 rounded skeleton"
                        style={{
                          width: `${60 + Math.random() * 40}%`,
                        }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-center py-16"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  <FileText
                    size={32}
                    className="mx-auto mb-3"
                    style={{ opacity: 0.3 }}
                  />
                  <p className="text-sm">No contracts found.</p>
                  <p className="text-xs mt-1" style={{ color: "var(--text-disabled)" }}>
                    Upload a PDF or DOCX to get started.
                  </p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const statusStyle = STATUS_STYLES[c.status] || {
                  color: "var(--status-neutral)",
                  bg: "var(--status-neutral-muted)",
                };
                return (
                  <tr
                    key={c.id}
                    className="transition-colors duration-100 group"
                    style={{ borderBottom: "1px solid var(--border-subtle)" }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "var(--bg-surface-raised)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <td className="px-5 py-4">
                      <p
                        className="text-sm font-medium"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {c.vendor_name || "Unknown Vendor"}
                      </p>
                      <p
                        className="text-xs truncate max-w-48"
                        style={{ color: "var(--text-tertiary)" }}
                      >
                        {c.file_name}
                      </p>
                    </td>
                    <td
                      className="px-5 py-4 text-sm font-mono tabular-nums"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {fmtUSD(c.annual_value)}
                    </td>
                    <td
                      className="px-5 py-4 text-sm"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {c.renewal_date || "--"}
                    </td>
                    <td className="px-5 py-4">
                      {c.risk_level ? (
                        <RiskBadge level={c.risk_level} />
                      ) : (
                        <span
                          className="text-xs"
                          style={{ color: "var(--text-disabled)" }}
                        >
                          Not scanned
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                        style={{
                          color: statusStyle.color,
                          background: statusStyle.bg,
                        }}
                      >
                        {c.status.replace("_", " ")}
                      </span>
                    </td>
                    <td
                      className="px-5 py-4 text-xs font-mono"
                      style={{ color: "var(--text-tertiary)" }}
                    >
                      {c.last_scanned_at
                        ? new Date(c.last_scanned_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          onClick={() => triggerScan(c.id)}
                          disabled={
                            scanning === c.id || c.status === "scanning"
                          }
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors disabled:opacity-40"
                          style={{
                            background: "var(--accent-muted)",
                            color: "var(--accent)",
                          }}
                        >
                          <ScanLine
                            size={12}
                            className={
                              scanning === c.id ? "animate-spin-slow" : ""
                            }
                          />
                          Scan
                        </button>
                        <Link
                          href={`/contracts/${c.id}`}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          style={{
                            background: "var(--bg-surface-raised)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border-subtle)",
                          }}
                        >
                          View <ChevronRight size={12} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

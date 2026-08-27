"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import RiskBadge from "@/components/RiskBadge";
import {
  Search, Upload, RefreshCw, ScanLine, FileText, ChevronRight, Filter
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

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-400",
  scanning: "bg-indigo-500/15 text-indigo-400",
  manual_review: "bg-amber-500/15 text-amber-400",
  parse_failed: "bg-red-500/15 text-red-400",
  archived: "bg-slate-500/15 text-slate-400",
};

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [scanning, setScanning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.listContracts(riskFilter ? { risk_level: riskFilter } : undefined);
      setContracts(data.contracts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [riskFilter]);

  useEffect(() => { load(); }, [load]);

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
      (c.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.file_name.toLowerCase().includes(search.toLowerCase()))
  );

  const fmtUSD = (n: number | null) =>
    n ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n) : "—";

  return (
    <div className="min-h-screen p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contracts</h1>
          <p className="text-sm text-slate-500 mt-0.5">{contracts.length} contracts monitored</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={load} disabled={loading} className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-slate-400 hover:text-white border border-white/[0.07] transition-all">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-sm font-medium text-white cursor-pointer transition-colors shadow-lg shadow-indigo-500/20">
            <Upload size={14} />
            {uploading ? "Uploading…" : "Upload Contract"}
            <input type="file" accept=".pdf,.docx,.txt" onChange={handleUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by vendor or filename…"
            className="w-full pl-9 pr-4 py-2.5 glass rounded-xl text-sm text-slate-300 placeholder-slate-600 border border-white/[0.07] focus:outline-none focus:border-indigo-500/40 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-500" />
          {["", "high", "medium", "low"].map((r) => (
            <button
              key={r}
              onClick={() => setRiskFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                riskFilter === r
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                  : "glass text-slate-400 border border-white/[0.06] hover:text-white"
              }`}
            >
              {r === "" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/[0.06]">
              {["Vendor / File", "Annual Value", "Renewal", "Risk", "Status", "Last Scanned", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-widest">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(7)].map((_, j) => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-4 rounded-md bg-slate-800/70 animate-pulse" style={{ width: `${60 + Math.random() * 40}%` }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-16 text-slate-500">
                  <FileText size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No contracts found.</p>
                  <p className="text-xs mt-1">Upload a PDF or DOCX to get started.</p>
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-slate-200">{c.vendor_name || "Unknown Vendor"}</p>
                    <p className="text-xs text-slate-500 truncate max-w-48">{c.file_name}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-slate-300">{fmtUSD(c.annual_value)}</td>
                  <td className="px-5 py-4 text-sm text-slate-300">
                    {c.renewal_date || "—"}
                  </td>
                  <td className="px-5 py-4">
                    {c.risk_level ? <RiskBadge level={c.risk_level} /> : <span className="text-slate-600 text-xs">Not scanned</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${STATUS_COLORS[c.status] ?? "bg-slate-500/15 text-slate-400"}`}>
                      {c.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {c.last_scanned_at ? new Date(c.last_scanned_at).toLocaleDateString() : "Never"}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => triggerScan(c.id)}
                        disabled={scanning === c.id || c.status === "scanning"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-400 hover:bg-indigo-500/25 transition-colors disabled:opacity-40"
                      >
                        <ScanLine size={12} className={scanning === c.id ? "animate-spin" : ""} />
                        Scan
                      </button>
                      <Link
                        href={`/contracts/${c.id}`}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium glass border border-white/[0.06] text-slate-400 hover:text-white transition-colors"
                      >
                        View <ChevronRight size={12} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

"use client";

import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  accent?: "indigo" | "emerald" | "amber" | "red";
  trend?: { value: string; up: boolean };
}

const accents = {
  indigo: { bg: "from-indigo-500/20 to-indigo-600/5", icon: "bg-indigo-500/20 text-indigo-400", border: "border-indigo-500/20" },
  emerald:{ bg: "from-emerald-500/20 to-emerald-600/5", icon: "bg-emerald-500/20 text-emerald-400", border: "border-emerald-500/20" },
  amber:  { bg: "from-amber-500/20 to-amber-600/5", icon: "bg-amber-500/20 text-amber-400", border: "border-amber-500/20" },
  red:    { bg: "from-red-500/20 to-red-600/5", icon: "bg-red-500/20 text-red-400", border: "border-red-500/20" },
};

export default function StatCard({ title, value, subtitle, icon, accent = "indigo", trend }: StatCardProps) {
  const a = accents[accent];
  return (
    <div className={`glass rounded-2xl p-5 bg-gradient-to-br ${a.bg} border ${a.border} transition-transform hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20 duration-200`}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${a.icon}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold text-white tracking-tight">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      {trend && (
        <div className={`mt-3 inline-flex items-center gap-1 text-xs font-medium ${trend.up ? "text-emerald-400" : "text-red-400"}`}>
          <span>{trend.up ? "↑" : "↓"}</span>
          <span>{trend.value}</span>
        </div>
      )}
    </div>
  );
}

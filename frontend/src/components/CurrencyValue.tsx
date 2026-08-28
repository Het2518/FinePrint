"use client";

import { useMemo } from "react";

interface CurrencyValueProps {
  amount: number | null | undefined;
  currency?: string; // "USD" | "INR" — from org settings
  className?: string;
  showSign?: boolean;
}

const INR_RATE = 83.5; // Static display rate — does not affect business logic

export function formatCurrency(
  amount: number | null | undefined,
  currency = "USD"
): string {
  if (amount == null) return "—";

  const displayAmount = currency === "INR" ? amount * INR_RATE : amount;
  const locale = currency === "INR" ? "en-IN" : "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(displayAmount);
}

export default function CurrencyValue({
  amount,
  currency = "USD",
  className = "",
  showSign = false,
}: CurrencyValueProps) {
  const formatted = useMemo(
    () => formatCurrency(amount, currency),
    [amount, currency]
  );

  if (amount == null) {
    return <span className={className} style={{ color: "var(--text-disabled)" }}>—</span>;
  }

  return (
    <span className={className}>
      {showSign && amount > 0 && "+"}
      {formatted}
      {currency === "INR" && (
        <span
          className="text-[10px] ml-1 font-normal"
          style={{ color: "var(--text-disabled)" }}
          title="Display only — stored in USD"
        >
          (display)
        </span>
      )}
    </span>
  );
}

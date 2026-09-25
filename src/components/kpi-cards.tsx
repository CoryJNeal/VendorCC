"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { YTD_METRICS, formatCurrency } from "@/lib/seed-data";

export function KpiCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/reporting#orders"
        className="kpi-enter group rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)] transition-colors hover:border-[#1a6b63]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#5f7a76]">
            YTD Orders
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1a6b63]">
            Open reporting
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
        <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#0f2a32] sm:text-4xl">
          {formatCurrency(YTD_METRICS.orders)}
        </p>
        <p className="mt-2 text-sm text-[#5f7a76]">Gross order dollars</p>
      </Link>
      <Link
        href="/reporting#returns"
        className="kpi-enter delay-1 group rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)] transition-colors hover:border-[#1a6b63]"
      >
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#5f7a76]">
            YTD Returns
          </p>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1a6b63]">
            Open reporting
            <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
        <p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-[#0f2a32] sm:text-4xl">
          {formatCurrency(YTD_METRICS.returns)}
        </p>
        <p className="mt-2 text-sm text-[#5f7a76]">Return dollars</p>
      </Link>
    </div>
  );
}

"use client";

import { useEffect } from "react";
import {
  MONTHLY_PERFORMANCE,
  YTD_METRICS,
  formatCurrency,
} from "@/lib/seed-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function MonthlyBars({
  values,
  max,
  color,
}: {
  values: number[];
  max: number;
  color: string;
}) {
  return (
    <div className="mt-4 flex h-28 items-end gap-2">
      {values.map((value, i) => (
        <div key={MONTHLY_PERFORMANCE[i].month} className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-t-sm"
            style={{
              height: `${Math.max(8, (value / max) * 100)}%`,
              background: color,
            }}
          />
          <span className="text-[10px] text-[#5f7a76]">
            {MONTHLY_PERFORMANCE[i].month.slice(0, 3)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReportingView() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const maxOrders = Math.max(...MONTHLY_PERFORMANCE.map((r) => r.orders));
  const maxReturns = Math.max(...MONTHLY_PERFORMANCE.map((r) => r.returns));

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f7a76]">
          Reporting
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f2a32]">
          Orders and returns
        </h1>
        <p className="max-w-2xl text-sm text-[#5f7a76]">
          YTD performance for Footwear Vendor. Use the dashboard KPIs to jump
          into a section.
        </p>
      </header>

      <section
        id="orders"
        className="scroll-mt-24 rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
              Orders
            </h2>
            <p className="mt-1 text-sm text-[#5f7a76]">Gross order dollars by month</p>
          </div>
          <p className="font-heading text-2xl font-semibold text-[#0f2a32]">
            {formatCurrency(YTD_METRICS.orders)}
            <span className="ml-2 text-sm font-normal text-[#5f7a76]">YTD</span>
          </p>
        </div>
        <MonthlyBars
          values={MONTHLY_PERFORMANCE.map((r) => r.orders)}
          max={maxOrders}
          color="#1a6b63"
        />
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Orders</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MONTHLY_PERFORMANCE.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.orders)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      <section
        id="returns"
        className="scroll-mt-24 rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
              Returns
            </h2>
            <p className="mt-1 text-sm text-[#5f7a76]">Return dollars by month</p>
          </div>
          <p className="font-heading text-2xl font-semibold text-[#0f2a32]">
            {formatCurrency(YTD_METRICS.returns)}
            <span className="ml-2 text-sm font-normal text-[#5f7a76]">YTD</span>
          </p>
        </div>
        <MonthlyBars
          values={MONTHLY_PERFORMANCE.map((r) => r.returns)}
          max={maxReturns}
          color="#c46b2d"
        />
        <div className="mt-6 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Returns</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MONTHLY_PERFORMANCE.map((row) => (
                <TableRow key={row.month}>
                  <TableCell>{row.month}</TableCell>
                  <TableCell className="text-right font-mono text-sm">
                    {formatCurrency(row.returns)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>
    </div>
  );
}

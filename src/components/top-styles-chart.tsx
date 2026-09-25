"use client";

import { useMemo, useState } from "react";
import {
  MONTHLY_PERFORMANCE,
  PIE_COLORS,
  TOP_STYLES,
  formatCompact,
  formatCurrency,
} from "@/lib/seed-data";

function polar(cx: number, cy: number, r: number, angle: number) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export function TopStylesChart() {
  const [activeStyle, setActiveStyle] = useState<string>(TOP_STYLES[0].styleNumber);
  const [activeMonth, setActiveMonth] = useState<string>(
    MONTHLY_PERFORMANCE[MONTHLY_PERFORMANCE.length - 1].month,
  );

  const total = useMemo(
    () => TOP_STYLES.reduce((sum, s) => sum + s.revenue, 0),
    [],
  );
  const maxMonthly = useMemo(
    () => Math.max(...MONTHLY_PERFORMANCE.map((row) => row.orders)),
    [],
  );

  const slices = useMemo(() => {
    let cursor = 0;
    return TOP_STYLES.map((style, index) => {
      const sweep = (style.revenue / total) * 360;
      const start = cursor;
      const end = cursor + sweep;
      cursor = end;
      return { style, index, start, end, pct: (style.revenue / total) * 100 };
    });
  }, [total]);

  const hovered = slices.find((s) => s.style.styleNumber === activeStyle) ?? slices[0];
  const hoveredMonth =
    MONTHLY_PERFORMANCE.find((row) => row.month === activeMonth) ??
    MONTHLY_PERFORMANCE[MONTHLY_PERFORMANCE.length - 1];

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
            Top performing styles
          </h2>
          <p className="mt-1 text-sm text-[#5f7a76]">
            Hover or click a slice to see style results
          </p>
          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <svg
              viewBox="0 0 240 240"
              className="size-60 shrink-0"
              role="img"
              aria-label="Top 10 styles pie chart"
            >
              {slices.map((slice) => (
                <path
                  key={slice.style.styleNumber}
                  d={slicePath(120, 120, 104, slice.start, slice.end)}
                  fill={PIE_COLORS[slice.index]}
                  stroke="#f7fbfa"
                  strokeWidth="1.5"
                  opacity={activeStyle !== slice.style.styleNumber ? 0.45 : 1}
                  className="cursor-pointer"
                  style={{ pointerEvents: "all" }}
                  onPointerEnter={() => setActiveStyle(slice.style.styleNumber)}
                  onClick={() => setActiveStyle(slice.style.styleNumber)}
                />
              ))}
              <circle cx="120" cy="120" r="52" fill="#f7fbfa" style={{ pointerEvents: "none" }} />
              <text
                x="120"
                y="116"
                textAnchor="middle"
                className="fill-[#5f7a76]"
                fontSize="11"
                style={{ pointerEvents: "none" }}
              >
                Top 10
              </text>
              <text
                x="120"
                y="134"
                textAnchor="middle"
                className="fill-[#0f2a32]"
                fontSize="13"
                fontWeight="600"
                style={{ pointerEvents: "none" }}
              >
                {formatCurrency(total)}
              </text>
            </svg>
            <div className="min-h-[10rem] w-full rounded-lg border border-[#dce8e4] bg-[#f7fbfa] p-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#5f7a76]">
                Style result
              </p>
              <p className="mt-2 font-mono text-sm font-medium text-[#0f2a32]">
                {hovered.style.styleNumber}
              </p>
              <p className="mt-1 font-heading text-xl font-semibold text-[#0f2a32]">
                {hovered.style.name}
              </p>
              <p className="mt-1 text-sm text-[#5f7a76]">{hovered.style.brand}</p>
              <p className="mt-3 text-lg font-semibold text-[#1a6b63]">
                {formatCurrency(hovered.style.revenue)}
                <span className="ml-2 text-sm font-normal text-[#5f7a76]">
                  {hovered.pct.toFixed(1)}% of top 10
                </span>
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {slices.map((slice) => (
              <button
                key={slice.style.styleNumber}
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#dce8e4] bg-white px-2 py-1 text-[11px] text-[#17343a] hover:border-[#1a6b63]"
                style={{
                  borderColor:
                    activeStyle === slice.style.styleNumber ? PIE_COLORS[slice.index] : undefined,
                }}
                onPointerEnter={() => setActiveStyle(slice.style.styleNumber)}
                onClick={() => setActiveStyle(slice.style.styleNumber)}
              >
                <span
                  className="size-2 rounded-full"
                  style={{ background: PIE_COLORS[slice.index] }}
                />
                {slice.style.styleNumber}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
            Sales by month
          </h2>
          <p className="mt-1 text-sm text-[#5f7a76]">
            YTD order dollars by month
          </p>
          <div className="mt-5 flex h-52 items-end gap-2">
            {MONTHLY_PERFORMANCE.map((row) => {
              const height = Math.max(10, (row.orders / maxMonthly) * 100);
              const isActive = activeMonth === row.month;
              return (
                <button
                  key={row.month}
                  type="button"
                  className="flex min-w-0 flex-1 flex-col items-center gap-1"
                  onPointerEnter={() => setActiveMonth(row.month)}
                  onClick={() => setActiveMonth(row.month)}
                  onFocus={() => setActiveMonth(row.month)}
                >
                  <span className="h-4 text-[10px] font-medium text-[#0f2a32]">
                    {isActive ? formatCompact(row.orders) : ""}
                  </span>
                  <div className="flex h-36 w-full items-end">
                    <div
                      className="w-full rounded-t-sm transition-colors"
                      style={{
                        height: `${height}%`,
                        background: isActive ? "#0f2a32" : "#1a6b63",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-[#5f7a76]">
                    {row.month.slice(0, 3)}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-sm text-[#17343a]">
            <span className="font-medium">{hoveredMonth.month}:</span>{" "}
            {formatCurrency(hoveredMonth.orders)} orders ·{" "}
            {formatCurrency(hoveredMonth.returns)} returns
          </p>
        </div>
      </div>
    </section>
  );
}

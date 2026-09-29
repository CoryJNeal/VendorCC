"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ImagePlus, Search } from "lucide-react";
import {
  useVendorState,
  type StyleSearchMode,
} from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrandInfoPanel() {
  const { brands, brandImageUrls, hydrated, findStyles } = useVendorState();
  const [mode, setMode] = useState<StyleSearchMode>("vendor");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");

  const hits = useMemo(
    () => (submitted ? findStyles(submitted, mode) : []),
    [findStyles, submitted, mode],
  );

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(query.trim());
  }

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
            Brand info & style search
          </h2>
          <p className="mt-1 text-sm text-[#5f7a76]">
            Browse brands set up for this vendor, or look up a style by vendor
            or service number.
          </p>
        </div>
        <Link
          href="/brands"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1a6b63] hover:underline"
        >
          Brand Management
          <ArrowRight className="size-3.5" />
        </Link>
      </div>

      <div className="space-y-5">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#5f7a76]">
            Brand listing
          </h3>
          {!hydrated ? (
            <p className="mt-2 text-sm text-[#5f7a76]">Loading…</p>
          ) : brands.length === 0 ? (
            <p className="mt-2 rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
              No brands yet.{" "}
              <Link href="/brands" className="font-medium text-[#1a6b63] hover:underline">
                Add one in Brand Management
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
              {brands.map((brand) => {
                const imageUrl = brandImageUrls[brand.id];
                return (
                  <li key={brand.id} className="flex items-center gap-3 px-3 py-2.5">
                    <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#dce8e4] bg-[#f3f8f6]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="size-4 text-[#8aa39d]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-[#17343a]">
                        {brand.name}
                      </p>
                      <p className="truncate text-xs text-[#5f7a76]">
                        ID {brand.brandId || "—"} · {brand.styles.length} style
                        {brand.styles.length === 1 ? "" : "s"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-[0.12em] text-[#5f7a76]">
            Style look up
          </h3>
          <form onSubmit={onSearch} className="mt-2 space-y-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={mode === "vendor" ? "default" : "outline"}
                onClick={() => {
                  setMode("vendor");
                  setSubmitted("");
                }}
              >
                Vendor style #
              </Button>
              <Button
                type="button"
                size="sm"
                variant={mode === "service" ? "default" : "outline"}
                onClick={() => {
                  setMode("service");
                  setSubmitted("");
                }}
              >
                Service style #
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="style-search">
                {mode === "vendor" ? "Vendor style #" : "Service style #"}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="style-search"
                  value={query}
                  placeholder={
                    mode === "vendor" ? "e.g. RL-2104" : "e.g. SVC-RL-1017"
                  }
                  onChange={(e) => setQuery(e.target.value)}
                />
                <Button type="submit">
                  <Search />
                  Search
                </Button>
              </div>
            </div>
          </form>

          {submitted ? (
            hits.length === 0 ? (
              <p className="mt-3 rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
                No styles matched “{submitted}”.
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
                {hits.map(({ brand, style }) => (
                  <li key={style.id} className="space-y-1 px-3 py-3 text-sm">
                    <p className="font-medium text-[#17343a]">{brand.name}</p>
                    <p className="text-[#5f7a76]">
                      Brand ID {brand.brandId || "—"}
                    </p>
                    <p className="text-[#17343a]">
                      Vendor style #:{" "}
                      <span className="font-medium">
                        {style.vendorStyleNumber}
                      </span>
                    </p>
                    <p className="text-[#17343a]">
                      Service style #:{" "}
                      <span className="font-medium">
                        {style.serviceStyleNumber}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

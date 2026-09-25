"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useVendorState } from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function BrandFields() {
  const { brands, setBrand, addBrand, removeBrand, saveBrands, hydrated } =
    useVendorState();
  const [saved, setSaved] = useState(false);

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
          Brand setup
        </h2>
        <p className="mt-1 text-sm text-[#5f7a76]">
          Add the brands that sit under this CRM vendor. Start with one and add
          more as needed.
        </p>
      </div>
      <div className="space-y-3">
        {brands.map((brand, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor={`brand-${index}`}>
                Brand {brands.length > 1 ? index + 1 : ""}
              </Label>
              <Input
                id={`brand-${index}`}
                value={hydrated ? brand : ""}
                placeholder="e.g. RidgeLine"
                onChange={(e) => {
                  setBrand(index, e.target.value);
                  setSaved(false);
                }}
              />
            </div>
            {brands.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Remove brand ${index + 1}`}
                onClick={() => {
                  removeBrand(index);
                  setSaved(false);
                }}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            addBrand();
            setSaved(false);
          }}
        >
          <Plus />
          Add brand
        </Button>
        <Button
          type="button"
          onClick={() => {
            saveBrands();
            setSaved(true);
          }}
        >
          Save brands
        </Button>
        {saved ? (
          <p className="rounded-md bg-[#d8ebe6] px-2.5 py-1 text-sm text-[#1a6b63]">
            Brand changes saved.
          </p>
        ) : null}
      </div>
    </section>
  );
}

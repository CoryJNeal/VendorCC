"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import {
  suggestServiceStyleNumber,
  useVendorState,
  type Brand,
} from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

type Mode = "add" | "manage";

function exportStylesCsv(brands: Brand[], brandFilterId?: string) {
  const rows = [["Brand Name", "Brand ID", "Vendor Style #", "Service Style #"]];
  for (const brand of brands) {
    if (brandFilterId && brand.id !== brandFilterId) continue;
    if (brand.styles.length === 0) {
      rows.push([brand.name, brand.brandId, "", ""]);
      continue;
    }
    for (const style of brand.styles) {
      rows.push([
        brand.name,
        brand.brandId,
        style.vendorStyleNumber,
        style.serviceStyleNumber,
      ]);
    }
  }
  const csv = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  const suffix = brandFilterId
    ? brands.find((b) => b.id === brandFilterId)?.brandId || "brand"
    : "all";
  anchor.href = url;
  anchor.download = `brand-styles-${suffix}-${stamp}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function BrandManagement() {
  const {
    brands,
    brandImageUrls,
    hydrated,
    addBrand,
    updateBrand,
    removeBrand,
    addBrandStyle,
    removeBrandStyle,
  } = useVendorState();

  const [mode, setMode] = useState<Mode>("add");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [clearImage, setClearImage] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vendorStyle, setVendorStyle] = useState("");
  const [serviceStyle, setServiceStyle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  const selectedBrand = useMemo(
    () => brands.find((b) => b.id === selectedId) ?? null,
    [brands, selectedId],
  );

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function resetImageDraft() {
    setImage(null);
    setClearImage(false);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function resetForm() {
    setName("");
    setBrandId("");
    resetImageDraft();
    setVendorStyle("");
    setServiceStyle("");
    setError(null);
    setMessage(null);
  }

  function startAdd() {
    setMode("add");
    setSelectedId(null);
    resetForm();
  }

  function startManage(brand: Brand) {
    setMode("manage");
    setSelectedId(brand.id);
    setName(brand.name);
    setBrandId(brand.brandId);
    resetImageDraft();
    setVendorStyle("");
    setServiceStyle(suggestServiceStyleNumber(brand.name, brand.styles.length));
    setError(null);
    setMessage(null);
  }

  function onImageChange(file: File | undefined) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(file);
    setClearImage(false);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setMessage(null);
  }

  function onClearLogo() {
    resetImageDraft();
    if (mode === "manage" && selectedBrand?.imageFileName) {
      setClearImage(true);
    }
  }

  async function onSaveBrand(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const draft = {
      name,
      brandId,
      image,
      clearImage: mode === "manage" ? clearImage : false,
    };
    const result =
      mode === "manage" && selectedId
        ? await updateBrand(selectedId, draft)
        : await addBrand(draft);
    setBusy(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (mode === "manage" && selectedId) {
      setMessage(`${name.trim()} updated.`);
      resetImageDraft();
    } else if (result.brandId) {
      setMessage(`${name.trim()} added. Assign styles below.`);
      setMode("manage");
      setSelectedId(result.brandId);
      resetImageDraft();
      setVendorStyle("");
      setServiceStyle(suggestServiceStyleNumber(name.trim(), 0));
    }
  }

  function onAddStyle(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBrand) {
      setError("Save the brand first, then assign styles.");
      return;
    }
    setError(null);
    setMessage(null);
    const err = addBrandStyle(selectedBrand.id, {
      vendorStyleNumber: vendorStyle,
      serviceStyleNumber: serviceStyle,
    });
    if (err) {
      setError(err);
      return;
    }
    setMessage(`Style ${vendorStyle.trim()} assigned.`);
    setVendorStyle("");
    setServiceStyle(
      suggestServiceStyleNumber(
        selectedBrand.name,
        selectedBrand.styles.length + 1,
      ),
    );
  }

  const logoPreview =
    previewUrl ??
    (!clearImage && selectedBrand ? brandImageUrls[selectedBrand.id] : null);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#5f7a76]">
          Brand Management
        </p>
        <h1 className="font-heading text-3xl font-semibold tracking-tight text-[#0f2a32]">
          Brands & style numbers
        </h1>
        <p className="max-w-2xl text-sm text-[#5f7a76]">
          Set up vendor brands with an ID and logo, then assign vendor style #s
          paired with service style #s used in our system.
        </p>
      </header>

      <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
              {mode === "add" ? "Add a new brand" : "Manage brand"}
            </h2>
            <p className="mt-1 text-sm text-[#5f7a76]">
              {mode === "add"
                ? "Enter brand details, then save to start assigning styles."
                : selectedBrand
                  ? `Editing ${selectedBrand.name}`
                  : "Select a brand from the list below."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={mode === "add" ? "default" : "outline"}
              onClick={startAdd}
            >
              <Plus />
              New brand
            </Button>
          </div>
        </div>

        {hydrated && brands.length > 0 && mode === "manage" ? (
          <div className="mb-4 space-y-1.5">
            <Label htmlFor="brand-select">Existing brand</Label>
            <select
              id="brand-select"
              className="h-8 w-full max-w-md rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={selectedBrand?.id ?? ""}
              onChange={(e) => {
                const brand = brands.find((b) => b.id === e.target.value);
                if (brand) startManage(brand);
              }}
            >
              <option value="" disabled>
                Select a brand…
              </option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name} ({brand.brandId || "no ID"})
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <form onSubmit={onSaveBrand} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input
                id="brand-name"
                value={name}
                placeholder="e.g. RidgeLine"
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setMessage(null);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-id">Brand ID number</Label>
              <Input
                id="brand-id"
                value={brandId}
                placeholder="e.g. 10482"
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setError(null);
                  setMessage(null);
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-logo">Brand logo</Label>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-[#dce8e4] bg-[#f3f8f6]">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoPreview}
                    alt=""
                    className="size-full object-cover"
                  />
                ) : (
                  <ImagePlus className="size-5 text-[#8aa39d]" />
                )}
              </div>
              <input
                ref={imageInputRef}
                id="brand-logo"
                type="file"
                accept={IMAGE_ACCEPT}
                className="hidden"
                onChange={(e) => onImageChange(e.target.files?.[0])}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => imageInputRef.current?.click()}
              >
                <ImagePlus />
                {image || logoPreview ? "Replace logo" : "Upload logo"}
              </Button>
              {image || logoPreview || clearImage ? (
                <Button type="button" variant="ghost" onClick={onClearLogo}>
                  Clear
                </Button>
              ) : null}
            </div>
            <p className="text-xs text-[#5f7a76]">
              {image
                ? image.name
                : "Optional. PNG, JPG, or WebP up to 5 MB."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={busy}>
              {mode === "manage" ? "Update brand" : "Save brand"}
            </Button>
            {mode === "manage" && selectedBrand ? (
              <Button
                type="button"
                variant="ghost"
                onClick={async () => {
                  await removeBrand(selectedBrand.id);
                  startAdd();
                  setMessage(`${selectedBrand.name} removed.`);
                }}
              >
                <Trash2 />
                Remove brand
              </Button>
            ) : null}
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            {message && !error ? (
              <p className="rounded-md bg-[#d8ebe6] px-2.5 py-1 text-sm text-[#1a6b63]">
                {message}
              </p>
            ) : null}
          </div>
        </form>

        {selectedBrand ? (
          <div className="mt-6 border-t border-[#dce8e4] pt-5">
            <h3 className="font-heading text-base font-semibold text-[#0f2a32]">
              Assign style numbers
            </h3>
            <p className="mt-1 text-sm text-[#5f7a76]">
              Pair each vendor style # with a service style # used in our
              system.
            </p>

            <form
              onSubmit={onAddStyle}
              className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
            >
              <div className="space-y-1.5">
                <Label htmlFor="vendor-style">Vendor style #</Label>
                <Input
                  id="vendor-style"
                  value={vendorStyle}
                  placeholder="e.g. RL-2104"
                  onChange={(e) => {
                    setVendorStyle(e.target.value);
                    setError(null);
                    setMessage(null);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="service-style">Service style #</Label>
                <Input
                  id="service-style"
                  value={serviceStyle}
                  placeholder="e.g. SVC-RL-1017"
                  onChange={(e) => {
                    setServiceStyle(e.target.value);
                    setError(null);
                    setMessage(null);
                  }}
                />
              </div>
              <Button type="submit">
                <Plus />
                Add style
              </Button>
            </form>

            {selectedBrand.styles.length > 0 ? (
              <ul className="mt-4 divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
                {selectedBrand.styles.map((style) => (
                  <li
                    key={style.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
                  >
                    <div className="min-w-0 text-sm">
                      <span className="font-medium text-[#17343a]">
                        Vendor {style.vendorStyleNumber}
                      </span>
                      <span className="mx-2 text-[#8aa39d]">→</span>
                      <span className="text-[#17343a]">
                        Service {style.serviceStyleNumber}
                      </span>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        removeBrandStyle(selectedBrand.id, style.id)
                      }
                    >
                      <Trash2 />
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
                No styles assigned yet.
              </p>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
              Listed brands
            </h2>
            <p className="mt-1 text-sm text-[#5f7a76]">
              Name, ID, logo, and an export of assigned styles.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={!hydrated || brands.length === 0}
            onClick={() => exportStylesCsv(brands)}
          >
            <Download />
            Export all styles
          </Button>
        </div>

        {!hydrated ? (
          <p className="text-sm text-[#5f7a76]">Loading brands…</p>
        ) : brands.length === 0 ? (
          <p className="rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
            No brands yet. Add a brand above to get started.
          </p>
        ) : (
          <ul className="divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
            {brands.map((brand) => {
              const imageUrl = brandImageUrls[brand.id];
              return (
                <li
                  key={brand.id}
                  className="flex flex-col gap-3 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#dce8e4] bg-[#f3f8f6]">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imageUrl}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        <ImagePlus className="size-5 text-[#8aa39d]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#17343a]">{brand.name}</p>
                      <p className="text-sm text-[#5f7a76]">
                        Brand ID: {brand.brandId || "—"}
                      </p>
                      <p className="mt-1 text-xs text-[#5f7a76]">
                        {brand.styles.length} style
                        {brand.styles.length === 1 ? "" : "s"} assigned
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startManage(brand)}
                    >
                      <Pencil />
                      Manage
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => exportStylesCsv(brands, brand.id)}
                    >
                      <Download />
                      Export styles
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

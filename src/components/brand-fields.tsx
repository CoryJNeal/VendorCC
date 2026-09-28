"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useVendorState } from "@/lib/vendor-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp,image/gif";

export function BrandFields() {
  const { brands, brandImageUrls, addBrand, removeBrand, hydrated } =
    useVendorState();
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    previewUrlRef.current = previewUrl;
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    };
  }, []);

  function clearImage() {
    setImage(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  }

  function onImageChange(file: File | undefined) {
    if (!file) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setMessage(null);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);
    const err = await addBrand({ name, image });
    setBusy(false);
    if (err) {
      setError(err);
      return;
    }
    setMessage(`${name.trim()} added to brands.`);
    setName("");
    clearImage();
  }

  return (
    <section className="rounded-xl border border-[#c9ddd7] bg-white/70 p-5 shadow-[0_1px_0_rgba(15,42,50,0.04)]">
      <div className="mb-4">
        <h2 className="font-heading text-lg font-semibold text-[#0f2a32]">
          Brand setup
        </h2>
        <p className="mt-1 text-sm text-[#5f7a76]">
          Add a brand with an optional image. Saving appends it to the list and
          seeds demo style numbers for later style setup.
        </p>
      </div>

      {hydrated && brands.length > 0 ? (
        <ul className="mb-5 divide-y divide-[#dce8e4] rounded-lg border border-[#dce8e4]">
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
                    {brand.imageFileName ? (
                      <p className="truncate text-xs text-[#5f7a76]">
                        {brand.imageFileName}
                      </p>
                    ) : (
                      <p className="text-xs text-[#5f7a76]">No image attached</p>
                    )}
                    <div className="mt-2">
                      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#5f7a76]">
                        Style #s
                      </p>
                      <p className="mt-1 text-sm text-[#17343a]">
                        {brand.styleNumbers.join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => removeBrand(brand.id)}
                >
                  <Trash2 />
                  Remove
                </Button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mb-4 rounded-md border border-dashed border-[#b7cec7] px-3 py-3 text-sm text-[#5f7a76]">
          No brands yet. Save a brand below to build the list.
        </p>
      )}

      <form onSubmit={onSave} className="space-y-4">
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
          <Label htmlFor="brand-image">Brand image</Label>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex size-16 items-center justify-center overflow-hidden rounded-lg border border-[#dce8e4] bg-[#f3f8f6]">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <ImagePlus className="size-5 text-[#8aa39d]" />
              )}
            </div>
            <input
              ref={imageInputRef}
              id="brand-image"
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
              {image ? "Replace image" : "Attach image"}
            </Button>
            {image ? (
              <Button type="button" variant="ghost" onClick={clearImage}>
                Clear
              </Button>
            ) : null}
          </div>
          {image ? (
            <p className="text-xs text-[#5f7a76]">{image.name}</p>
          ) : (
            <p className="text-xs text-[#5f7a76]">
              Optional. PNG, JPG, or WebP up to 5 MB.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={busy}>
            Save brand
          </Button>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message && !error ? (
            <p className="rounded-md bg-[#d8ebe6] px-2.5 py-1 text-sm text-[#1a6b63]">
              {message}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}

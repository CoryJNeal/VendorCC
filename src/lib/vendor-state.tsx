"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  DOCUMENT_DEFINITIONS,
  emptyDocument,
  type DocumentTypeId,
  type DocStatus,
  type StoredDocument,
} from "@/lib/documents";
import { deleteFileBlob, getFileBlob, putFileBlob } from "@/lib/file-store";

const STORAGE_KEY = "vcc-vendor-state-v5";
const LEGACY_STORAGE_KEYS = ["vcc-vendor-state-v4", "vcc-vendor-state-v3"];
const MAX_FILE_BYTES = 15_000_000;
const MAX_BRAND_IMAGE_BYTES = 5_000_000;

export type BrandStyle = {
  id: string;
  vendorStyleNumber: string;
  serviceStyleNumber: string;
};

export type Brand = {
  id: string;
  name: string;
  brandId: string;
  imageFileName: string | null;
  imageMimeType: string | null;
  styles: BrandStyle[];
};

export type VendorUser = {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
};

export type FtpCredentials = {
  host: string;
  username: string;
  password: string;
};

type PersistedState = {
  brands: Brand[];
  vendorUsers: VendorUser[];
  documents: Record<DocumentTypeId, StoredDocument>;
  ftp: FtpCredentials;
};

export type BrandDraft = {
  name: string;
  brandId: string;
  image: File | null;
  clearImage?: boolean;
};

export type StyleDraft = {
  vendorStyleNumber: string;
  serviceStyleNumber: string;
};

export type StyleSearchMode = "vendor" | "service";

export type StyleSearchHit = {
  brand: Brand;
  style: BrandStyle;
};

export type BrandMutationResult = {
  error: string | null;
  brandId?: string;
};

type VendorContextValue = PersistedState & {
  hydrated: boolean;
  fileUrls: Partial<Record<DocumentTypeId, string>>;
  brandImageUrls: Record<string, string>;
  addBrand: (draft: BrandDraft) => Promise<BrandMutationResult>;
  updateBrand: (id: string, draft: BrandDraft) => Promise<BrandMutationResult>;
  removeBrand: (id: string) => Promise<void>;
  addBrandStyle: (brandId: string, draft: StyleDraft) => string | null;
  removeBrandStyle: (brandId: string, styleId: string) => void;
  findStyles: (query: string, mode: StyleSearchMode) => StyleSearchHit[];
  addVendorUser: (user: Omit<VendorUser, "id">) => void;
  updateVendorUser: (user: VendorUser) => void;
  removeVendorUser: (id: string) => void;
  uploadDocument: (id: DocumentTypeId, file: File) => Promise<string | null>;
  setDocumentStatus: (id: DocumentTypeId, status: DocStatus) => void;
  removeDocument: (id: DocumentTypeId) => Promise<void>;
  saveFtp: (ftp: FtpCredentials) => void;
};

const defaultDocuments = Object.fromEntries(
  DOCUMENT_DEFINITIONS.map((d) => [d.id, emptyDocument(d.id)]),
) as Record<DocumentTypeId, StoredDocument>;

const seedUsers: VendorUser[] = [
  {
    id: "vu-elena",
    firstName: "Elena",
    lastName: "Park",
    title: "Account Manager",
    email: "elena.park@footwearvendor.com",
    phone: "555-0142",
  },
  {
    id: "vu-marcus",
    firstName: "Marcus",
    lastName: "Chen",
    title: "Operations Lead",
    email: "marcus.chen@footwearvendor.com",
    phone: "",
  },
];

const defaultState: PersistedState = {
  brands: [],
  vendorUsers: seedUsers,
  documents: defaultDocuments,
  ftp: {
    host: "",
    username: "",
    password: "",
  },
};

const VendorContext = createContext<VendorContextValue | null>(null);

function newId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}`;
}

function brandImageKey(id: string) {
  return `brand-${id}`;
}

function makeServiceStyleNumber(brandName: string, index: number): string {
  const letters = brandName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (letters.slice(0, 2) || "BR").padEnd(2, "X");
  const seed = Array.from(brandName).reduce(
    (sum, ch) => sum + ch.charCodeAt(0),
    brandName.length * 37,
  );
  const base = 1000 + (seed % 8000) + index * 17;
  return `SVC-${prefix}-${base}`;
}

function makeDemoStyles(brandName: string): BrandStyle[] {
  const letters = brandName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (letters.slice(0, 2) || "BR").padEnd(2, "X");
  const seed = Array.from(brandName).reduce(
    (sum, ch) => sum + ch.charCodeAt(0),
    brandName.length * 37,
  );
  const base = 1000 + (seed % 8000);
  return [0, 1, 2].map((i) => ({
    id: newId("style"),
    vendorStyleNumber: `${prefix}-${base + i * 17}`,
    serviceStyleNumber: makeServiceStyleNumber(brandName, i),
  }));
}

function sanitizeStyle(raw: unknown, brandName: string, index: number): BrandStyle | null {
  if (typeof raw === "string") {
    const vendorStyleNumber = raw.trim();
    if (!vendorStyleNumber) return null;
    return {
      id: newId("style"),
      vendorStyleNumber,
      serviceStyleNumber: makeServiceStyleNumber(brandName, index),
    };
  }
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<BrandStyle>;
  const vendorStyleNumber =
    typeof value.vendorStyleNumber === "string"
      ? value.vendorStyleNumber.trim()
      : "";
  const serviceStyleNumber =
    typeof value.serviceStyleNumber === "string"
      ? value.serviceStyleNumber.trim()
      : "";
  if (!vendorStyleNumber || !serviceStyleNumber) return null;
  return {
    id:
      typeof value.id === "string" && value.id ? value.id : newId("style"),
    vendorStyleNumber,
    serviceStyleNumber,
  };
}

function sanitizeDocument(
  raw: Partial<StoredDocument> | undefined,
  id: DocumentTypeId,
): StoredDocument {
  const base = emptyDocument(id);
  if (!raw) return base;
  return {
    id,
    status: raw.status ?? base.status,
    fileName: raw.fileName ?? null,
    fileSize: raw.fileSize ?? null,
    mimeType: raw.mimeType ?? null,
    updatedAt: raw.updatedAt ?? null,
  };
}

function sanitizeBrand(raw: unknown): Brand | null {
  if (typeof raw === "string") {
    const name = raw.trim();
    if (!name) return null;
    return {
      id: newId("brand"),
      name,
      brandId: "",
      imageFileName: null,
      imageMimeType: null,
      styles: makeDemoStyles(name),
    };
  }
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<Brand> & { styleNumbers?: unknown };
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) return null;
  const id =
    typeof value.id === "string" && value.id ? value.id : newId("brand");
  const brandId =
    typeof value.brandId === "string" ? value.brandId.trim() : "";

  let styles: BrandStyle[] = [];
  if (Array.isArray(value.styles)) {
    styles = value.styles
      .map((style, index) => sanitizeStyle(style, name, index))
      .filter((s): s is BrandStyle => s !== null);
  } else if (Array.isArray(value.styleNumbers)) {
    styles = value.styleNumbers
      .map((style, index) => sanitizeStyle(style, name, index))
      .filter((s): s is BrandStyle => s !== null);
  }

  return {
    id,
    name,
    brandId,
    imageFileName:
      typeof value.imageFileName === "string" ? value.imageFileName : null,
    imageMimeType:
      typeof value.imageMimeType === "string" ? value.imageMimeType : null,
    styles: styles.length > 0 ? styles : makeDemoStyles(name),
  };
}

function sanitizeVendorUser(raw: unknown): VendorUser | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<VendorUser>;
  if (
    typeof value.firstName !== "string" ||
    typeof value.lastName !== "string" ||
    typeof value.email !== "string"
  ) {
    return null;
  }
  return {
    id:
      typeof value.id === "string" && value.id ? value.id : newId("vu"),
    firstName: value.firstName,
    lastName: value.lastName,
    title: typeof value.title === "string" ? value.title : "",
    email: value.email,
    phone: typeof value.phone === "string" ? value.phone : "",
  };
}

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaultState;
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      for (const key of LEGACY_STORAGE_KEYS) {
        raw = window.localStorage.getItem(key);
        if (raw) break;
      }
    }
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<PersistedState> & {
      vendorUser?: Omit<VendorUser, "id">;
    };
    const documents = { ...defaultDocuments };
    for (const def of DOCUMENT_DEFINITIONS) {
      documents[def.id] = sanitizeDocument(parsed.documents?.[def.id], def.id);
    }
    let vendorUsers = Array.isArray(parsed.vendorUsers)
      ? parsed.vendorUsers
          .map(sanitizeVendorUser)
          .filter((u): u is VendorUser => u !== null)
      : undefined;
    if (!vendorUsers && parsed.vendorUser?.email) {
      vendorUsers = [
        {
          id: newId("vu"),
          firstName: parsed.vendorUser.firstName ?? "",
          lastName: parsed.vendorUser.lastName ?? "",
          title:
            typeof parsed.vendorUser.title === "string"
              ? parsed.vendorUser.title
              : "",
          email: parsed.vendorUser.email,
          phone: parsed.vendorUser.phone ?? "",
        },
      ];
    }
    const brands = Array.isArray(parsed.brands)
      ? parsed.brands
          .map(sanitizeBrand)
          .filter((b): b is Brand => b !== null)
      : [];
    return {
      brands,
      vendorUsers: vendorUsers ?? seedUsers,
      documents,
      ftp: { ...defaultState.ftp, ...parsed.ftp },
    };
  } catch {
    return defaultState;
  }
}

function validateBrandDraft(
  draft: BrandDraft,
  brands: Brand[],
  editingId?: string,
): string | null {
  const name = draft.name.trim();
  const brandId = draft.brandId.trim();
  if (!name) return "Brand name is required.";
  if (!brandId) return "Brand ID number is required.";
  if (draft.image && draft.image.size > MAX_BRAND_IMAGE_BYTES) {
    return "Brand logo is too large (max 5 MB).";
  }
  if (draft.image && !draft.image.type.startsWith("image/")) {
    return "Attach an image file (PNG, JPG, or similar).";
  }
  const duplicateName = brands.some(
    (b) =>
      b.name.toLowerCase() === name.toLowerCase() && b.id !== editingId,
  );
  if (duplicateName) return "A brand with that name already exists.";
  const duplicateId = brands.some(
    (b) =>
      b.brandId.toLowerCase() === brandId.toLowerCase() && b.id !== editingId,
  );
  if (duplicateId) return "A brand with that ID number already exists.";
  return null;
}

function collectStyleConflicts(
  brands: Brand[],
  draft: StyleDraft,
  brandInternalId: string,
): string | null {
  const vendor = draft.vendorStyleNumber.trim().toLowerCase();
  const service = draft.serviceStyleNumber.trim().toLowerCase();
  for (const brand of brands) {
    for (const style of brand.styles) {
      if (style.vendorStyleNumber.toLowerCase() === vendor) {
        return `Vendor style # ${draft.vendorStyleNumber.trim()} is already assigned${brand.id === brandInternalId ? " on this brand" : ` to ${brand.name}`}.`;
      }
      if (style.serviceStyleNumber.toLowerCase() === service) {
        return `Service style # ${draft.serviceStyleNumber.trim()} is already assigned${brand.id === brandInternalId ? " on this brand" : ` to ${brand.name}`}.`;
      }
    }
  }
  return null;
}

export function VendorProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [fileUrls, setFileUrls] = useState<
    Partial<Record<DocumentTypeId, string>>
  >({});
  const [brandImageUrls, setBrandImageUrls] = useState<Record<string, string>>(
    {},
  );
  const fileUrlsRef = useRef(fileUrls);
  const brandImageUrlsRef = useRef(brandImageUrls);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    fileUrlsRef.current = fileUrls;
  }, [fileUrls]);

  useEffect(() => {
    brandImageUrlsRef.current = brandImageUrls;
  }, [brandImageUrls]);

  useEffect(() => {
    const loaded = loadState();
    startTransition(() => {
      setState(loaded);
      setHydrated(true);
    });
    let cancelled = false;
    (async () => {
      const nextUrls: Partial<Record<DocumentTypeId, string>> = {};
      for (const def of DOCUMENT_DEFINITIONS) {
        if (!loaded.documents[def.id]?.fileName) continue;
        const blob = await getFileBlob(def.id);
        if (blob) nextUrls[def.id] = URL.createObjectURL(blob);
      }
      const nextBrandUrls: Record<string, string> = {};
      for (const brand of loaded.brands) {
        if (!brand.imageFileName) continue;
        const blob = await getFileBlob(brandImageKey(brand.id));
        if (blob) nextBrandUrls[brand.id] = URL.createObjectURL(blob);
      }
      if (!cancelled) {
        setFileUrls(nextUrls);
        setBrandImageUrls(nextBrandUrls);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    return () => {
      Object.values(fileUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
      Object.values(brandImageUrlsRef.current).forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, []);

  const addBrand = useCallback(async (draft: BrandDraft) => {
    const error = validateBrandDraft(draft, state.brands);
    if (error) return { error };

    const id = newId("brand");
    const brand: Brand = {
      id,
      name: draft.name.trim(),
      brandId: draft.brandId.trim(),
      imageFileName: draft.image?.name ?? null,
      imageMimeType: draft.image?.type || null,
      styles: [],
    };

    if (draft.image) {
      await putFileBlob(brandImageKey(id), draft.image);
      const url = URL.createObjectURL(draft.image);
      setBrandImageUrls((prev) => {
        if (prev[id]) URL.revokeObjectURL(prev[id]!);
        return { ...prev, [id]: url };
      });
    }

    setState((prev) => ({
      ...prev,
      brands: [...prev.brands, brand],
    }));
    return { error: null, brandId: id };
  }, [state.brands]);

  const updateBrand = useCallback(
    async (id: string, draft: BrandDraft) => {
      const existing = state.brands.find((b) => b.id === id);
      if (!existing) return { error: "Brand not found." };
      const error = validateBrandDraft(draft, state.brands, id);
      if (error) return { error };

      let imageFileName = existing.imageFileName;
      let imageMimeType = existing.imageMimeType;

      if (draft.image) {
        await putFileBlob(brandImageKey(id), draft.image);
        const url = URL.createObjectURL(draft.image);
        setBrandImageUrls((prev) => {
          if (prev[id]) URL.revokeObjectURL(prev[id]!);
          return { ...prev, [id]: url };
        });
        imageFileName = draft.image.name;
        imageMimeType = draft.image.type || null;
      } else if (draft.clearImage) {
        await deleteFileBlob(brandImageKey(id));
        setBrandImageUrls((prev) => {
          if (prev[id]) URL.revokeObjectURL(prev[id]!);
          const next = { ...prev };
          delete next[id];
          return next;
        });
        imageFileName = null;
        imageMimeType = null;
      }

      setState((prev) => ({
        ...prev,
        brands: prev.brands.map((brand) =>
          brand.id === id
            ? {
                ...brand,
                name: draft.name.trim(),
                brandId: draft.brandId.trim(),
                imageFileName,
                imageMimeType,
              }
            : brand,
        ),
      }));
      return { error: null, brandId: id };
    },
    [state.brands],
  );

  const removeBrand = useCallback(async (id: string) => {
    await deleteFileBlob(brandImageKey(id));
    setBrandImageUrls((prev) => {
      if (prev[id]) URL.revokeObjectURL(prev[id]!);
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setState((prev) => ({
      ...prev,
      brands: prev.brands.filter((brand) => brand.id !== id),
    }));
  }, []);

  const addBrandStyle = useCallback(
    (brandInternalId: string, draft: StyleDraft) => {
      const vendorStyleNumber = draft.vendorStyleNumber.trim();
      const serviceStyleNumber = draft.serviceStyleNumber.trim();
      if (!vendorStyleNumber) return "Vendor style # is required.";
      if (!serviceStyleNumber) return "Service style # is required.";
      const conflict = collectStyleConflicts(
        state.brands,
        { vendorStyleNumber, serviceStyleNumber },
        brandInternalId,
      );
      if (conflict) return conflict;

      const brandExists = state.brands.some((b) => b.id === brandInternalId);
      if (!brandExists) return "Brand not found.";

      setState((prev) => ({
        ...prev,
        brands: prev.brands.map((brand) =>
          brand.id === brandInternalId
            ? {
                ...brand,
                styles: [
                  ...brand.styles,
                  {
                    id: newId("style"),
                    vendorStyleNumber,
                    serviceStyleNumber,
                  },
                ],
              }
            : brand,
        ),
      }));
      return null;
    },
    [state.brands],
  );

  const removeBrandStyle = useCallback(
    (brandInternalId: string, styleId: string) => {
      setState((prev) => ({
        ...prev,
        brands: prev.brands.map((brand) =>
          brand.id === brandInternalId
            ? {
                ...brand,
                styles: brand.styles.filter((style) => style.id !== styleId),
              }
            : brand,
        ),
      }));
    },
    [],
  );

  const findStyles = useCallback(
    (query: string, mode: StyleSearchMode): StyleSearchHit[] => {
      const q = query.trim().toLowerCase();
      if (!q) return [];
      const hits: StyleSearchHit[] = [];
      for (const brand of state.brands) {
        for (const style of brand.styles) {
          const value =
            mode === "vendor"
              ? style.vendorStyleNumber
              : style.serviceStyleNumber;
          if (value.toLowerCase().includes(q)) {
            hits.push({ brand, style });
          }
        }
      }
      return hits;
    },
    [state.brands],
  );

  const addVendorUser = useCallback((user: Omit<VendorUser, "id">) => {
    setState((prev) => ({
      ...prev,
      vendorUsers: [...prev.vendorUsers, { ...user, id: newId("vu") }],
    }));
  }, []);

  const updateVendorUser = useCallback((user: VendorUser) => {
    setState((prev) => ({
      ...prev,
      vendorUsers: prev.vendorUsers.map((u) => (u.id === user.id ? user : u)),
    }));
  }, []);

  const removeVendorUser = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      vendorUsers: prev.vendorUsers.filter((u) => u.id !== id),
    }));
  }, []);

  const uploadDocument = useCallback(
    async (id: DocumentTypeId, file: File) => {
      if (file.size > MAX_FILE_BYTES) {
        return "File is too large for this prototype (max 15 MB).";
      }
      await putFileBlob(id, file);
      const url = URL.createObjectURL(file);
      setFileUrls((prev) => {
        if (prev[id]) URL.revokeObjectURL(prev[id]!);
        return { ...prev, [id]: url };
      });
      setState((prev) => ({
        ...prev,
        documents: {
          ...prev.documents,
          [id]: {
            id,
            status: "uploaded",
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            updatedAt: new Date().toISOString(),
          },
        },
      }));
      return null;
    },
    [],
  );

  const setDocumentStatus = useCallback(
    (id: DocumentTypeId, status: DocStatus) => {
      setState((prev) => {
        const current = prev.documents[id];
        if (!current) return prev;
        return {
          ...prev,
          documents: {
            ...prev.documents,
            [id]: {
              ...current,
              status,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      });
    },
    [],
  );

  const removeDocument = useCallback(async (id: DocumentTypeId) => {
    await deleteFileBlob(id);
    setFileUrls((prev) => {
      if (prev[id]) URL.revokeObjectURL(prev[id]!);
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setState((prev) => ({
      ...prev,
      documents: {
        ...prev.documents,
        [id]: emptyDocument(id),
      },
    }));
  }, []);

  const saveFtp = useCallback((ftp: FtpCredentials) => {
    setState((prev) => ({ ...prev, ftp }));
  }, []);

  const value = useMemo<VendorContextValue>(
    () => ({
      ...state,
      hydrated,
      fileUrls,
      brandImageUrls,
      addBrand,
      updateBrand,
      removeBrand,
      addBrandStyle,
      removeBrandStyle,
      findStyles,
      addVendorUser,
      updateVendorUser,
      removeVendorUser,
      uploadDocument,
      setDocumentStatus,
      removeDocument,
      saveFtp,
    }),
    [
      state,
      hydrated,
      fileUrls,
      brandImageUrls,
      addBrand,
      updateBrand,
      removeBrand,
      addBrandStyle,
      removeBrandStyle,
      findStyles,
      addVendorUser,
      updateVendorUser,
      removeVendorUser,
      uploadDocument,
      setDocumentStatus,
      removeDocument,
      saveFtp,
    ],
  );

  return (
    <VendorContext.Provider value={value}>{children}</VendorContext.Provider>
  );
}

export function useVendorState() {
  const ctx = useContext(VendorContext);
  if (!ctx) {
    throw new Error("useVendorState must be used within VendorProvider");
  }
  return ctx;
}

export function suggestServiceStyleNumber(
  brandName: string,
  existingCount: number,
): string {
  return makeServiceStyleNumber(brandName || "Brand", existingCount);
}

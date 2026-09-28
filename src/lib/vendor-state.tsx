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

const STORAGE_KEY = "vcc-vendor-state-v4";
const MAX_FILE_BYTES = 15_000_000;
const MAX_BRAND_IMAGE_BYTES = 5_000_000;

export type Brand = {
  id: string;
  name: string;
  imageFileName: string | null;
  imageMimeType: string | null;
  styleNumbers: string[];
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
  image: File | null;
};

type VendorContextValue = PersistedState & {
  hydrated: boolean;
  fileUrls: Partial<Record<DocumentTypeId, string>>;
  brandImageUrls: Record<string, string>;
  addBrand: (draft: BrandDraft) => Promise<string | null>;
  removeBrand: (id: string) => Promise<void>;
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

function makeDemoStyleNumbers(brandName: string): string[] {
  const letters = brandName.replace(/[^a-zA-Z]/g, "").toUpperCase();
  const prefix = (letters.slice(0, 2) || "BR").padEnd(2, "X");
  const seed = Array.from(brandName).reduce(
    (sum, ch) => sum + ch.charCodeAt(0),
    brandName.length * 37,
  );
  const base = 1000 + (seed % 8000);
  return [
    `${prefix}-${base}`,
    `${prefix}-${base + 17}`,
    `${prefix}-${base + 43}`,
  ];
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
    const id = newId("brand");
    return {
      id,
      name,
      imageFileName: null,
      imageMimeType: null,
      styleNumbers: makeDemoStyleNumbers(name),
    };
  }
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Partial<Brand>;
  const name = typeof value.name === "string" ? value.name.trim() : "";
  if (!name) return null;
  const id =
    typeof value.id === "string" && value.id ? value.id : newId("brand");
  const styleNumbers = Array.isArray(value.styleNumbers)
    ? value.styleNumbers.filter(
        (n): n is string => typeof n === "string" && n.trim().length > 0,
      )
    : [];
  return {
    id,
    name,
    imageFileName:
      typeof value.imageFileName === "string" ? value.imageFileName : null,
    imageMimeType:
      typeof value.imageMimeType === "string" ? value.imageMimeType : null,
    styleNumbers:
      styleNumbers.length > 0 ? styleNumbers : makeDemoStyleNumbers(name),
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
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem("vcc-vendor-state-v3");
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
    const name = draft.name.trim();
    if (!name) return "Brand name is required.";
    if (draft.image && draft.image.size > MAX_BRAND_IMAGE_BYTES) {
      return "Brand image is too large (max 5 MB).";
    }
    if (draft.image && !draft.image.type.startsWith("image/")) {
      return "Attach an image file (PNG, JPG, or similar).";
    }

    const id = newId("brand");
    const brand: Brand = {
      id,
      name,
      imageFileName: draft.image?.name ?? null,
      imageMimeType: draft.image?.type || null,
      styleNumbers: makeDemoStyleNumbers(name),
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
    return null;
  }, []);

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
      removeBrand,
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
      removeBrand,
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

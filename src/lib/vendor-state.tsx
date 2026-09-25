"use client";

import {
  createContext,
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

const STORAGE_KEY = "vcc-vendor-state-v3";
const MAX_FILE_BYTES = 15_000_000;

export type VendorUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

export type FtpCredentials = {
  host: string;
  username: string;
  password: string;
};

type PersistedState = {
  brands: string[];
  vendorUsers: VendorUser[];
  documents: Record<DocumentTypeId, StoredDocument>;
  ftp: FtpCredentials;
};

type VendorContextValue = PersistedState & {
  hydrated: boolean;
  fileUrls: Partial<Record<DocumentTypeId, string>>;
  setBrand: (index: number, value: string) => void;
  addBrand: () => void;
  removeBrand: (index: number) => void;
  saveBrands: () => void;
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
    email: "elena.park@footwearvendor.com",
    phone: "555-0142",
  },
  {
    id: "vu-marcus",
    firstName: "Marcus",
    lastName: "Chen",
    email: "marcus.chen@footwearvendor.com",
    phone: "",
  },
];

const defaultState: PersistedState = {
  brands: [""],
  vendorUsers: seedUsers,
  documents: defaultDocuments,
  ftp: {
    host: "",
    username: "",
    password: "",
  },
};

const VendorContext = createContext<VendorContextValue | null>(null);

function newUserId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `vu-${Date.now()}`;
}

function sanitizeDocument(raw: Partial<StoredDocument> | undefined, id: DocumentTypeId): StoredDocument {
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

function loadState(): PersistedState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
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
      : undefined;
    if (!vendorUsers && parsed.vendorUser?.email) {
      vendorUsers = [{ id: newUserId(), ...parsed.vendorUser }];
    }
    return {
      brands:
        Array.isArray(parsed.brands) && parsed.brands.length > 0
          ? parsed.brands
          : [""],
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
  const [fileUrls, setFileUrls] = useState<Partial<Record<DocumentTypeId, string>>>({});
  const fileUrlsRef = useRef(fileUrls);
  fileUrlsRef.current = fileUrls;
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loaded = loadState();
    setState(loaded);
    setHydrated(true);
    let cancelled = false;
    (async () => {
      const nextUrls: Partial<Record<DocumentTypeId, string>> = {};
      for (const def of DOCUMENT_DEFINITIONS) {
        if (!loaded.documents[def.id]?.fileName) continue;
        const blob = await getFileBlob(def.id);
        if (blob) nextUrls[def.id] = URL.createObjectURL(blob);
      }
      if (!cancelled) setFileUrls(nextUrls);
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
    };
  }, []);

  const setBrand = useCallback((index: number, value: string) => {
    setState((prev) => {
      const brands = [...prev.brands];
      brands[index] = value;
      return { ...prev, brands };
    });
  }, []);

  const addBrand = useCallback(() => {
    setState((prev) => ({ ...prev, brands: [...prev.brands, ""] }));
  }, []);

  const removeBrand = useCallback((index: number) => {
    setState((prev) => {
      if (prev.brands.length <= 1) return prev;
      return {
        ...prev,
        brands: prev.brands.filter((_, i) => i !== index),
      };
    });
  }, []);

  const saveBrands = useCallback(() => {
    setState((prev) => {
      const trimmed = prev.brands.map((b) => b.trim()).filter(Boolean);
      return { ...prev, brands: trimmed.length > 0 ? trimmed : [""] };
    });
  }, []);

  const addVendorUser = useCallback((user: Omit<VendorUser, "id">) => {
    setState((prev) => ({
      ...prev,
      vendorUsers: [...prev.vendorUsers, { ...user, id: newUserId() }],
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

  const setDocumentStatus = useCallback((id: DocumentTypeId, status: DocStatus) => {
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
  }, []);

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
      setBrand,
      addBrand,
      removeBrand,
      saveBrands,
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
      setBrand,
      addBrand,
      removeBrand,
      saveBrands,
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

const DB_NAME = "vcc-files";
const STORE = "blobs";

const memoryFallback = new Map<string, Blob>();

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}

export async function putFileBlob(id: string, blob: Blob) {
  memoryFallback.set(id, blob);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getFileBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  if (!db) return memoryFallback.get(id) ?? null;
  const blob = await new Promise<Blob | null>((resolve) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve((req.result as Blob | undefined) ?? null);
    req.onerror = () => resolve(memoryFallback.get(id) ?? null);
  });
  db.close();
  return blob ?? memoryFallback.get(id) ?? null;
}

export async function deleteFileBlob(id: string) {
  memoryFallback.delete(id);
  const db = await openDb();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
  });
  db.close();
}

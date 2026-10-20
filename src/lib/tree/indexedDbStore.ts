import type { TextStore } from "./storage";

export const DB_NAME = "file-tree-explorer";
export const DB_VERSION = 1;
export const STORE_NAME = "trees";
export const RECORD_KEY = "current";

function promisify<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function openDatabase(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("IndexedDB upgrade blocked"));
  });
}

// Resolves once the transaction is committed, not just when the request succeeds.
function write(
  database: IDBDatabase,
  run: (store: IDBObjectStore) => IDBRequest,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    run(transaction.objectStore(STORE_NAME));
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

/**
 * IndexedDB-backed store, or null when IndexedDB is not available at all.
 * Failures later on (private mode, quota, blocked storage) surface as rejected promises.
 */
export function createIndexedDbStore(
  factory: IDBFactory | undefined = globalThis.indexedDB,
): TextStore | null {
  if (factory === undefined) return null;

  let database: Promise<IDBDatabase> | null = null;
  function getDatabase(): Promise<IDBDatabase> {
    database ??= openDatabase(factory!).catch((error: unknown) => {
      // Allow a later call to retry instead of caching the failure.
      database = null;
      throw error;
    });
    return database;
  }

  return {
    async get() {
      const db = await getDatabase();
      const store = db.transaction(STORE_NAME).objectStore(STORE_NAME);
      const value: unknown = await promisify(store.get(RECORD_KEY));
      return typeof value === "string" ? value : undefined;
    },
    async set(text) {
      await write(await getDatabase(), (store) => store.put(text, RECORD_KEY));
    },
    async delete() {
      await write(await getDatabase(), (store) => store.delete(RECORD_KEY));
    },
  };
}

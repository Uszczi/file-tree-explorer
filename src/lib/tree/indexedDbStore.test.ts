import { IDBFactory } from "fake-indexeddb";
import { describe, expect, it } from "vitest";
import {
  createIndexedDbStore,
  DB_NAME,
  RECORD_KEY,
  STORE_NAME,
} from "./indexedDbStore";

describe("createIndexedDbStore", () => {
  it("returns null when IndexedDB is unavailable", () => {
    expect(createIndexedDbStore(undefined)).toBeNull();
  });

  it("starts empty", async () => {
    const store = createIndexedDbStore(new IDBFactory())!;
    await expect(store.get()).resolves.toBeUndefined();
  });

  it("stores, replaces and deletes the text", async () => {
    const store = createIndexedDbStore(new IDBFactory())!;
    await store.set("first");
    await store.set("second");
    await expect(store.get()).resolves.toBe("second");

    await store.delete();
    await expect(store.get()).resolves.toBeUndefined();
  });

  it("persists across store instances (like a page reload)", async () => {
    const factory = new IDBFactory();
    await createIndexedDbStore(factory)!.set("kept");
    await expect(createIndexedDbStore(factory)!.get()).resolves.toBe("kept");
  });

  it("handles large values", async () => {
    const store = createIndexedDbStore(new IDBFactory())!;
    const large = "x".repeat(20 * 1024 * 1024);
    await store.set(large);
    expect((await store.get())?.length).toBe(large.length);
  });

  it("ignores records that are not strings", async () => {
    const factory = new IDBFactory();
    const store = createIndexedDbStore(factory)!;
    await store.set("init");

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = factory.open(DB_NAME);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put({ not: "a string" }, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();

    await expect(store.get()).resolves.toBeUndefined();
  });

  it("rejects instead of throwing when the database cannot be opened", async () => {
    const broken = {
      open: () => {
        const request = {} as IDBOpenDBRequest;
        queueMicrotask(() => {
          Object.assign(request, { error: new Error("denied") });
          request.onerror?.(new Event("error"));
        });
        return request;
      },
    } as unknown as IDBFactory;

    const store = createIndexedDbStore(broken)!;
    await expect(store.get()).rejects.toThrow("denied");
  });
});

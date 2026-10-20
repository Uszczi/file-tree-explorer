import { describe, expect, it } from "vitest";
import {
  clearStoredTree,
  getBrowserStorage,
  loadTree,
  saveTree,
  STORAGE_KEY,
  type KeyValueStorage,
} from "./storage";
import type { TreeNode } from "./types";

const tree: TreeNode = {
  name: "root",
  type: "folder",
  children: [{ name: "a.txt", type: "file", size: 10 }],
};

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: KeyValueStorage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
    removeItem: (key) => {
      data.delete(key);
    },
  };
  return { storage, data };
}

const throwingStorage: KeyValueStorage = {
  getItem: () => {
    throw new Error("SecurityError");
  },
  setItem: () => {
    throw new Error("QuotaExceededError");
  },
  removeItem: () => {
    throw new Error("SecurityError");
  },
};

describe("getBrowserStorage", () => {
  it("returns null when there is no window", () => {
    expect(getBrowserStorage()).toBeNull();
  });
});

describe("saveTree / loadTree", () => {
  it("round-trips a tree", () => {
    const { storage } = memoryStorage();
    expect(saveTree(storage, tree)).toBe(true);
    expect(loadTree(storage)).toEqual(tree);
  });

  it("returns null when nothing is stored", () => {
    expect(loadTree(memoryStorage().storage)).toBeNull();
  });

  it("works without storage", () => {
    expect(saveTree(null, tree)).toBe(false);
    expect(loadTree(null)).toBeNull();
    expect(() => clearStoredTree(null)).not.toThrow();
  });

  it("reports failure instead of throwing when storage is full or blocked", () => {
    expect(saveTree(throwingStorage, tree)).toBe(false);
    expect(loadTree(throwingStorage)).toBeNull();
    expect(() => clearStoredTree(throwingStorage)).not.toThrow();
  });

  it("drops the previously saved tree when saving fails", () => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: JSON.stringify(tree) });
    const fullStorage: KeyValueStorage = {
      ...storage,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
    };
    expect(saveTree(fullStorage, tree)).toBe(false);
    expect(data.has(STORAGE_KEY)).toBe(false);
  });

  it.each([
    ["invalid JSON", "{"],
    ["an invalid tree", JSON.stringify({ name: "root", type: "file" })],
  ])("drops %s from storage", (_label, stored) => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: stored });
    expect(loadTree(storage)).toBeNull();
    expect(data.has(STORAGE_KEY)).toBe(false);
  });

  it("handles a very deep tree", () => {
    let node: TreeNode = { name: "leaf", type: "file", size: 1 };
    for (let level = 0; level < 10_000; level++) {
      node = { name: "d", type: "folder", children: [node] };
    }
    const { storage } = memoryStorage();
    expect(saveTree(storage, node)).toBe(true);
    expect(loadTree(storage)?.type).toBe("folder");
  });
});

describe("clearStoredTree", () => {
  it("removes only the tree key", () => {
    const { storage, data } = memoryStorage({ [STORAGE_KEY]: "x", other: "y" });
    clearStoredTree(storage);
    expect([...data.keys()]).toEqual(["other"]);
  });
});

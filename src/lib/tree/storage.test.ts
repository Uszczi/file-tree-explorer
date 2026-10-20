import { describe, expect, it } from "vitest";
import { serializeTree } from "./serialize";
import { clearStoredTree, loadTree, saveTree, type TextStore } from "./storage";
import type { TreeNode } from "./types";

const tree: TreeNode = {
  name: "root",
  type: "folder",
  children: [{ name: "a.txt", type: "file", size: 10 }],
};

function memoryStore(initial?: string) {
  const state = { text: initial };
  const store: TextStore = {
    get: async () => state.text,
    set: async (text) => {
      state.text = text;
    },
    delete: async () => {
      state.text = undefined;
    },
  };
  return { store, state };
}

const failingStore: TextStore = {
  get: () => Promise.reject(new Error("SecurityError")),
  set: () => Promise.reject(new Error("QuotaExceededError")),
  delete: () => Promise.reject(new Error("SecurityError")),
};

describe("saveTree / loadTree", () => {
  it("round-trips a tree", async () => {
    const { store } = memoryStore();
    await expect(saveTree(store, tree)).resolves.toBe(true);
    await expect(loadTree(store)).resolves.toEqual(tree);
  });

  it("stores compact JSON text", async () => {
    const { store, state } = memoryStore();
    await saveTree(store, tree);
    expect(state.text).toBe(serializeTree(tree));
  });

  it("returns null when nothing is stored", async () => {
    await expect(loadTree(memoryStore().store)).resolves.toBeNull();
  });

  it("works without storage", async () => {
    await expect(saveTree(null, tree)).resolves.toBe(false);
    await expect(loadTree(null)).resolves.toBeNull();
    await expect(clearStoredTree(null)).resolves.toBeUndefined();
  });

  it("reports failure instead of rejecting when storage is full or blocked", async () => {
    await expect(saveTree(failingStore, tree)).resolves.toBe(false);
    await expect(loadTree(failingStore)).resolves.toBeNull();
    await expect(clearStoredTree(failingStore)).resolves.toBeUndefined();
  });

  it("drops the previously saved tree when saving fails", async () => {
    const { store, state } = memoryStore(JSON.stringify(tree));
    const fullStore: TextStore = {
      ...store,
      set: () => Promise.reject(new Error("QuotaExceededError")),
    };
    await expect(saveTree(fullStore, tree)).resolves.toBe(false);
    expect(state.text).toBeUndefined();
  });

  it.each([
    ["invalid JSON", "{"],
    ["an invalid tree", JSON.stringify({ name: "root", type: "file" })],
  ])("drops %s from storage", async (_label, stored) => {
    const { store, state } = memoryStore(stored);
    await expect(loadTree(store)).resolves.toBeNull();
    expect(state.text).toBeUndefined();
  });

  it("handles a very deep tree", async () => {
    let node: TreeNode = { name: "leaf", type: "file", size: 1 };
    for (let level = 0; level < 10_000; level++) {
      node = { name: "d", type: "folder", children: [node] };
    }
    const { store } = memoryStore();
    await expect(saveTree(store, node)).resolves.toBe(true);
    expect((await loadTree(store))?.type).toBe("folder");
  });
});

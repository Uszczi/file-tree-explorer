import type { TreeNode } from "./types";
import { parseTree } from "./validate";

export const STORAGE_KEY = "file-tree-explorer:tree:v1";

export type KeyValueStorage = Pick<
  Storage,
  "getItem" | "setItem" | "removeItem"
>;

export function getBrowserStorage(): KeyValueStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function saveTree(
  storage: KeyValueStorage | null,
  tree: TreeNode,
): boolean {
  if (storage === null) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(tree));
    return true;
  } catch {
    // Otherwise a reload would bring back the previously saved tree.
    clearStoredTree(storage);
    return false;
  }
}

export function clearStoredTree(storage: KeyValueStorage | null): void {
  try {
    storage?.removeItem(STORAGE_KEY);
  } catch {}
}

export function loadTree(storage: KeyValueStorage | null): TreeNode | null {
  if (storage === null) return null;

  let text: string | null;
  try {
    text = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (text === null) return null;

  const result = parseTree(text);
  if (!result.ok) {
    clearStoredTree(storage);
    return null;
  }
  return result.value;
}

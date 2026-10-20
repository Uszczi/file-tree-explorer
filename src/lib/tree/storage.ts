import { serializeTree } from "./serialize";
import type { TreeNode } from "./types";
import { parseTree } from "./validate";

/** Where the serialized tree is kept. Async so it can be backed by IndexedDB. */
export interface TextStore {
  get(): Promise<string | undefined>;
  set(text: string): Promise<void>;
  delete(): Promise<void>;
}

/** Resolves to false (never rejects) when the tree could not be persisted. */
export async function saveTree(
  store: TextStore | null,
  tree: TreeNode,
): Promise<boolean> {
  if (store === null) return false;
  try {
    // Stored as text rather than a structured clone: serializeTree is iterative,
    // while structured cloning recurses and can fail on very deep trees.
    await store.set(serializeTree(tree));
    return true;
  } catch {
    // Otherwise a reload would bring back the previously saved tree.
    await clearStoredTree(store);
    return false;
  }
}

export async function clearStoredTree(store: TextStore | null): Promise<void> {
  try {
    await store?.delete();
  } catch {
    // Storage unavailable: there is nothing to clear.
  }
}

// Stored data is untrusted (edited by hand, older app version), so it is validated again.
export async function loadTree(
  store: TextStore | null,
): Promise<TreeNode | null> {
  if (store === null) return null;

  let text: string | undefined;
  try {
    text = await store.get();
  } catch {
    return null;
  }
  if (text === undefined) return null;

  const result = parseTree(text);
  if (!result.ok) {
    await clearStoredTree(store);
    return null;
  }
  return result.value;
}

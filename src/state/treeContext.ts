import { createContext, useContext } from "react";
import type { TreeIndex, TreeNode } from "../lib/tree/types";

export interface TreeContextValue {
  readonly index: TreeIndex | null;
  /** Replaces the current tree. Returns false if it could not be persisted. */
  readonly load: (tree: TreeNode) => boolean;
  readonly clear: () => void;
}

export const TreeContext = createContext<TreeContextValue | null>(null);

export function useTree(): TreeContextValue {
  const value = useContext(TreeContext);
  if (value === null) {
    throw new Error("useTree must be used within a TreeProvider");
  }
  return value;
}

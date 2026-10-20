import { createContext, useContext } from "react";
import type { TreeIndex, TreeNode } from "../lib/tree/types";

export interface TreeContextValue {
  readonly hydrated: boolean;
  readonly index: TreeIndex | null;
  readonly persisted: boolean;
  readonly load: (tree: TreeNode) => void;
  readonly clear: () => Promise<void>;
}

export const TreeContext = createContext<TreeContextValue | null>(null);

export function useTree(): TreeContextValue {
  const value = useContext(TreeContext);
  if (value === null) {
    throw new Error("useTree must be used within a TreeProvider");
  }
  return value;
}

export function useTreeIndex(): TreeIndex {
  const { index } = useTree();
  if (index === null) {
    throw new Error("useTreeIndex must be used under TreeLayout");
  }
  return index;
}

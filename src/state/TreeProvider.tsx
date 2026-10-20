import { useCallback, useMemo, useState, type ReactNode } from "react";
import { buildIndex } from "../lib/tree/buildIndex";
import {
  clearStoredTree,
  getBrowserStorage,
  loadTree,
  saveTree,
} from "../lib/tree/storage";
import type { TreeIndex, TreeNode } from "../lib/tree/types";
import { TreeContext, type TreeContextValue } from "./treeContext";

interface TreeProviderProps {
  readonly children: ReactNode;
}

export function TreeProvider({ children }: TreeProviderProps) {
  const [storage] = useState(getBrowserStorage);
  const [index, setIndex] = useState<TreeIndex | null>(() => {
    const stored = loadTree(storage);
    return stored === null ? null : buildIndex(stored);
  });
  const [persisted, setPersisted] = useState(true);

  const load = useCallback(
    (tree: TreeNode) => {
      setIndex(buildIndex(tree));
      setPersisted(saveTree(storage, tree));
    },
    [storage],
  );

  const clear = useCallback(() => {
    setIndex(null);
    setPersisted(true);
    clearStoredTree(storage);
  }, [storage]);

  const value = useMemo<TreeContextValue>(
    () => ({ index, persisted, load, clear }),
    [index, persisted, load, clear],
  );

  return <TreeContext value={value}>{children}</TreeContext>;
}

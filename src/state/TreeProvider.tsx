import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildIndex } from "../lib/tree/buildIndex";
import { createIndexedDbStore } from "../lib/tree/indexedDbStore";
import { clearStoredTree, loadTree, saveTree } from "../lib/tree/storage";
import type { TreeIndex, TreeNode } from "../lib/tree/types";
import { TreeContext, type TreeContextValue } from "./treeContext";

interface TreeProviderProps {
  readonly children: ReactNode;
}

export function TreeProvider({ children }: TreeProviderProps) {
  const [store] = useState(createIndexedDbStore);
  const [hydrated, setHydrated] = useState(false);
  const [index, setIndex] = useState<TreeIndex | null>(null);
  const [persisted, setPersisted] = useState(true);
  // Bumped by every load/clear, so a slow save can't report on a tree that was replaced.
  const generation = useRef(0);

  // Restore the saved tree once. IndexedDB is async, so the app waits on `hydrated`.
  useEffect(() => {
    let cancelled = false;
    void loadTree(store).then((tree) => {
      if (cancelled) return;
      if (tree !== null) setIndex(buildIndex(tree));
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const load = useCallback(
    (tree: TreeNode) => {
      const current = ++generation.current;
      setIndex(buildIndex(tree));
      setPersisted(true);
      void saveTree(store, tree).then((saved) => {
        if (current === generation.current) setPersisted(saved);
      });
    },
    [store],
  );

  // Delete the saved copy before dropping the tree from state: clearing state first would
  // redirect home immediately, and a reload in that moment would restore the tree.
  const clear = useCallback(async () => {
    const current = ++generation.current;
    await clearStoredTree(store);
    if (current !== generation.current) return; // a new tree was loaded meanwhile
    setIndex(null);
    setPersisted(true);
  }, [store]);

  const value = useMemo<TreeContextValue>(
    () => ({ hydrated, index, persisted, load, clear }),
    [hydrated, index, persisted, load, clear],
  );

  return <TreeContext value={value}>{children}</TreeContext>;
}

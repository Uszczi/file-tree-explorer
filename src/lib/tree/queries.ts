import { joinPath, ROOT_PATH } from "./paths";
import type { IndexedNode, NodePath, TreeIndex } from "./types";

/** Paths of all ancestors of `path`, nearest first, ending with the root. */
export function ancestorPaths(index: TreeIndex, path: NodePath): NodePath[] {
  const ancestors: NodePath[] = [];
  let parentPath = index.byPath.get(path)?.parentPath ?? null;
  while (parentPath !== null) {
    ancestors.push(parentPath);
    parentPath = index.byPath.get(parentPath)?.parentPath ?? null;
  }
  return ancestors;
}

export function folderPaths(index: TreeIndex): NodePath[] {
  return [...index.byPath.values()]
    .filter((entry) => entry.node.type === "folder")
    .map((entry) => entry.path);
}

/** Index entries of a folder's direct children, in tree order. Empty for files. */
export function childEntries(index: TreeIndex, path: NodePath): IndexedNode[] {
  const node = index.byPath.get(path)?.node;
  if (node?.type !== "folder") return [];
  return node.children.flatMap((child) => index.byPath.get(joinPath(path, child.name)) ?? []);
}

/** Full path for display, starting with the root's name, e.g. "root/src/index.ts". */
export function displayPath(index: TreeIndex, path: NodePath): string {
  return path === ROOT_PATH ? index.root.name : `${index.root.name}/${path}`;
}

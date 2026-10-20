import type { FolderNode, TreeNode } from "./types";

/** Type guard: after `isFolder(node)`, TypeScript knows `node.children` exists. */
export function isFolder(node: TreeNode): node is FolderNode {
  return node.type === "folder";
}

export function nodeTypeLabel(node: TreeNode): "Folder" | "File" {
  return isFolder(node) ? "Folder" : "File";
}

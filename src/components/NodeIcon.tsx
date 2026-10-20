import { isFolder } from "../lib/tree/nodes";
import type { TreeNode } from "../lib/tree/types";

interface NodeIconProps {
  readonly node: TreeNode;
  /** Shows an open folder; ignored for files. */
  readonly expanded?: boolean;
}

// Decorative: the node name next to it carries the meaning for screen readers.
export function NodeIcon({ node, expanded = false }: NodeIconProps) {
  return <span aria-hidden="true">{isFolder(node) ? (expanded ? "📂" : "📁") : "📄"}</span>;
}

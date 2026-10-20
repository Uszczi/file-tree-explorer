import { joinPath, ROOT_PATH } from "./paths";
import type { IndexedNode, NodePath, TreeIndex } from "./types";

export interface VisibleRow {
  readonly entry: IndexedNode;
  readonly expanded: boolean;
}

// Flattens the expanded part of the tree into display order, so the view can render
// a plain list (no recursive components) and keyboard navigation is just index +/- 1.
export function getVisibleRows(index: TreeIndex, expanded: ReadonlySet<NodePath>): VisibleRow[] {
  const rows: VisibleRow[] = [];
  const stack: NodePath[] = [ROOT_PATH];

  while (stack.length > 0) {
    const entry = index.byPath.get(stack.pop()!);
    if (entry === undefined) continue;

    const { node, path } = entry;
    const isExpanded = node.type === "folder" && expanded.has(path);
    rows.push({ entry, expanded: isExpanded });

    if (node.type === "folder" && isExpanded) {
      for (let child = node.children.length - 1; child >= 0; child--) {
        stack.push(joinPath(path, node.children[child].name));
      }
    }
  }

  return rows;
}

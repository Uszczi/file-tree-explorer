import { joinPath, ROOT_PATH } from "./paths";
import type { IndexedNode, NodePath, TreeIndex, TreeNode } from "./types";

interface Draft {
  readonly node: TreeNode;
  readonly path: NodePath;
  readonly parent: Draft | null;
  readonly depth: number;
  totalSize: number;
}

export function buildIndex(root: TreeNode): TreeIndex {
  const visitOrder: Draft[] = [];
  const stack: Draft[] = [
    { node: root, path: ROOT_PATH, parent: null, depth: 0, totalSize: 0 },
  ];

  while (stack.length > 0) {
    const draft = stack.pop()!;
    visitOrder.push(draft);

    if (draft.node.type === "file") {
      draft.totalSize = draft.node.size;
      continue;
    }

    const { children } = draft.node;
    for (let index = children.length - 1; index >= 0; index--) {
      const child = children[index];
      stack.push({
        node: child,
        path: joinPath(draft.path, child.name),
        parent: draft,
        depth: draft.depth + 1,
        totalSize: 0,
      });
    }
  }

  for (let index = visitOrder.length - 1; index >= 0; index--) {
    const draft = visitOrder[index];
    if (draft.parent !== null) draft.parent.totalSize += draft.totalSize;
  }

  const byPath = new Map<NodePath, IndexedNode>();
  for (const { node, path, parent, depth, totalSize } of visitOrder) {
    byPath.set(path, {
      node,
      path,
      parentPath: parent === null ? null : parent.path,
      depth,
      totalSize,
    });
  }

  return { root, byPath };
}

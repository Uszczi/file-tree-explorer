import type { TreeNode } from "./types";

// Iterative on purpose: JSON.stringify recurses on V8's slow path and can
// overflow the call stack on deeply nested trees.
export function serializeTree(tree: TreeNode): string {
  const parts: string[] = [];
  const stack: (TreeNode | string)[] = [tree];

  while (stack.length > 0) {
    const item = stack.pop()!;
    if (typeof item === "string") {
      parts.push(item);
      continue;
    }

    const name = JSON.stringify(item.name);
    if (item.type === "file") {
      parts.push(`{"name":${name},"type":"file","size":${item.size}}`);
      continue;
    }

    parts.push(`{"name":${name},"type":"folder","children":[`);
    stack.push("]}");
    // Pushed in reverse so children are emitted in order.
    for (let index = item.children.length - 1; index >= 0; index--) {
      stack.push(item.children[index]);
      if (index > 0) stack.push(",");
    }
  }

  return parts.join("");
}

/**
 * JSON for showing a tree in the editor. Never throws.
 *
 * Indentation makes JSON.stringify use more stack per level, so pretty-printing fails
 * around ~2 000 levels in Chromium. Deeper trees fall back to compact, iterative output.
 */
export function stringifyForEditor(tree: TreeNode): string {
  try {
    return JSON.stringify(tree, null, 2);
  } catch {
    return serializeTree(tree);
  }
}

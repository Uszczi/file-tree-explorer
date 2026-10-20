import type { TreeNode } from "./types";

/**
 * JSON for showing a tree in the editor. Never throws.
 *
 * JSON.stringify is recursive, and indentation makes each level cost more stack, so
 * pretty-printing fails much earlier (~2 000 levels in Chromium) than compact output
 * (~20 000+). Fall back to compact, then to an empty editor, rather than crash the page.
 */
export function stringifyForEditor(tree: TreeNode): string {
  try {
    return JSON.stringify(tree, null, 2);
  } catch {
    // Too deep to pretty-print.
  }
  try {
    return JSON.stringify(tree);
  } catch {
    return "";
  }
}

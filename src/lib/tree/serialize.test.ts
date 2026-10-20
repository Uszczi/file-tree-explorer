import { describe, expect, it } from "vitest";
import { stringifyForEditor } from "./serialize";
import type { TreeNode } from "./types";

function deepTree(depth: number): TreeNode {
  let node: TreeNode = { name: "leaf", type: "file", size: 1 };
  for (let level = 0; level < depth; level++) {
    node = { name: "d", type: "folder", children: [node] };
  }
  return node;
}

describe("stringifyForEditor", () => {
  it("pretty-prints regular trees", () => {
    const tree: TreeNode = { name: "root", type: "folder", children: [] };
    expect(stringifyForEditor(tree)).toBe(JSON.stringify(tree, null, 2));
  });

  it("falls back to compact JSON when pretty-printing overflows the stack", () => {
    // Find a depth where indented output fails but compact output still works.
    let depth = 1_000;
    while (depth < 1_000_000) {
      try {
        JSON.stringify(deepTree(depth), null, 2);
        depth *= 2;
      } catch {
        break;
      }
    }
    const tree = deepTree(depth);
    let compactWorks = true;
    try {
      JSON.stringify(tree);
    } catch {
      compactWorks = false;
    }

    const text = stringifyForEditor(tree);
    if (compactWorks) {
      expect(text).toBe(JSON.stringify(tree));
    } else {
      expect(text).toBe("");
    }
  });

  it("returns an empty string instead of throwing", () => {
    const circular = {
      name: "root",
      type: "folder",
      children: [] as TreeNode[],
    };
    circular.children.push(circular as TreeNode);
    expect(stringifyForEditor(circular as TreeNode)).toBe("");
  });
});

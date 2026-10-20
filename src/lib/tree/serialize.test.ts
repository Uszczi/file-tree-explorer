import { describe, expect, it } from "vitest";
import { serializeTree, stringifyForEditor } from "./serialize";
import type { TreeNode } from "./types";

function deepTree(depth: number): TreeNode {
  let node: TreeNode = { name: "leaf", type: "file", size: 1 };
  for (let level = 0; level < depth; level++) {
    node = { name: "d", type: "folder", children: [node] };
  }
  return node;
}

const tree: TreeNode = {
  name: "root",
  type: "folder",
  children: [{ name: "a.txt", type: "file", size: 10 }],
};

describe("serializeTree", () => {
  it("matches JSON.stringify", () => {
    const nested: TreeNode = {
      name: 'quote " and \\ slash',
      type: "folder",
      children: [
        tree,
        { name: "empty", type: "folder", children: [] },
        { name: "ż.bin", type: "file", size: 0 },
      ],
    };
    expect(serializeTree(nested)).toBe(JSON.stringify(nested));
  });

  it("does not overflow the stack on a very deep tree", () => {
    expect(() => serializeTree(deepTree(100_000))).not.toThrow();
  });
});

describe("stringifyForEditor", () => {
  it("pretty-prints regular trees", () => {
    expect(stringifyForEditor(tree)).toBe(JSON.stringify(tree, null, 2));
  });

  it("falls back to compact output when pretty-printing overflows the stack", () => {
    // Deep enough that indented JSON.stringify throws in any current V8.
    const deep = deepTree(100_000);
    expect(() => JSON.stringify(deep, null, 2)).toThrow(RangeError);

    const text = stringifyForEditor(deep);
    expect(text).toBe(serializeTree(deep));
    expect(text.startsWith('{"name":"d","type":"folder","children":[')).toBe(
      true,
    );
  });
});

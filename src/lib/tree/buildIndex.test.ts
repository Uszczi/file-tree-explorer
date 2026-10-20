import { describe, expect, it } from "vitest";
import { buildIndex } from "./buildIndex";
import type { TreeNode } from "./types";

const example: TreeNode = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "src",
      type: "folder",
      children: [
        { name: "index.ts", type: "file", size: 1024 },
        {
          name: "components",
          type: "folder",
          children: [{ name: "Button.tsx", type: "file", size: 512 }],
        },
        { name: "empty", type: "folder", children: [] },
      ],
    },
    { name: "package.json", type: "file", size: 300 },
  ],
};

describe("buildIndex", () => {
  const { root, byPath } = buildIndex(example);

  it("keeps the original root", () => {
    expect(root).toBe(example);
  });

  it("indexes every node in tree order", () => {
    expect([...byPath.keys()]).toEqual([
      "",
      "src",
      "src/index.ts",
      "src/components",
      "src/components/Button.tsx",
      "src/empty",
      "package.json",
    ]);
  });

  it("indexes the root under an empty path", () => {
    expect(byPath.get("")).toMatchObject({
      node: example,
      path: "",
      parentPath: null,
      depth: 0,
    });
  });

  it("stores parent path and depth", () => {
    expect(byPath.get("src/components/Button.tsx")).toMatchObject({
      node: { name: "Button.tsx", type: "file", size: 512 },
      parentPath: "src/components",
      depth: 3,
    });
    expect(byPath.get("package.json")?.parentPath).toBe("");
  });

  it("computes subtree sizes", () => {
    expect(byPath.get("")?.totalSize).toBe(1836);
    expect(byPath.get("src")?.totalSize).toBe(1536);
    expect(byPath.get("src/components")?.totalSize).toBe(512);
    expect(byPath.get("src/empty")?.totalSize).toBe(0);
    expect(byPath.get("package.json")?.totalSize).toBe(300);
  });

  it("returns undefined for unknown paths", () => {
    expect(byPath.get("nope")).toBeUndefined();
    expect(byPath.get("root")).toBeUndefined();
  });

  it("indexes a single file root", () => {
    const file: TreeNode = { name: "a.txt", type: "file", size: 7 };
    const index = buildIndex(file);
    expect([...index.byPath.keys()]).toEqual([""]);
    expect(index.byPath.get("")?.totalSize).toBe(7);
  });

  it("handles very deep trees without overflowing the stack", () => {
    // Already about 100MB
    const depth = 10_000;
    let node: TreeNode = { name: "leaf", type: "file", size: 1 };
    for (let level = 0; level < depth; level++) {
      node = { name: "d", type: "folder", children: [node] };
    }

    const index = buildIndex(node);
    expect(index.byPath.size).toBe(depth + 1);
    expect(index.byPath.get("")?.totalSize).toBe(1);
    const deepest = [...index.byPath.values()].at(-1);
    expect(deepest?.depth).toBe(depth);
    expect(deepest?.node.name).toBe("leaf");
  });
});

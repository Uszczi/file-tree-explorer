import { describe, expect, it } from "vitest";
import { buildIndex } from "./buildIndex";
import type { TreeNode } from "./types";
import { folderPaths } from "./queries";
import { getVisibleRows } from "./visibleRows";

const tree: TreeNode = {
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
      ],
    },
    { name: "package.json", type: "file", size: 300 },
  ],
};

const index = buildIndex(tree);

function paths(expanded: string[]): string[] {
  return getVisibleRows(index, new Set(expanded)).map((row) => row.entry.path);
}

describe("getVisibleRows", () => {
  it("shows only the root when nothing is expanded", () => {
    expect(paths([])).toEqual([""]);
  });

  it("shows direct children of the expanded root in order", () => {
    expect(paths([""])).toEqual(["", "src", "package.json"]);
  });

  it("shows nested children right after their folder", () => {
    expect(paths(["", "src", "src/components"])).toEqual([
      "",
      "src",
      "src/index.ts",
      "src/components",
      "src/components/Button.tsx",
      "package.json",
    ]);
  });

  it("hides children of an expanded folder whose parent is collapsed", () => {
    expect(paths(["", "src/components"])).toEqual(["", "src", "package.json"]);
  });

  it("marks only expanded folders as expanded", () => {
    const rows = getVisibleRows(index, new Set(["", "src", "package.json"]));
    expect(rows.map((row) => [row.entry.path, row.expanded])).toEqual([
      ["", true],
      ["src", true],
      ["src/index.ts", false],
      ["src/components", false],
      ["package.json", false],
    ]);
  });

  it("ignores unknown paths in the expanded set", () => {
    expect(paths(["", "nope"])).toEqual(["", "src", "package.json"]);
  });

  it("handles a single file root", () => {
    const fileIndex = buildIndex({ name: "a.txt", type: "file", size: 1 });
    expect(
      getVisibleRows(fileIndex, new Set([""])).map((row) => row.expanded),
    ).toEqual([false]);
  });

  it("handles a fully expanded very deep tree", () => {
    let node: TreeNode = { name: "leaf", type: "file", size: 1 };
    for (let level = 0; level < 10_000; level++) {
      node = { name: "d", type: "folder", children: [node] };
    }
    const deepIndex = buildIndex(node);
    expect(
      getVisibleRows(deepIndex, new Set(folderPaths(deepIndex))),
    ).toHaveLength(10_001);
  });
});

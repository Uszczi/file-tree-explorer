import { describe, expect, it } from "vitest";
import { buildIndex } from "./buildIndex";
import type { TreeNode } from "./types";
import {
  ancestorPaths,
  childEntries,
  displayPath,
  folderPaths,
} from "./queries";

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

describe("ancestorPaths", () => {
  it("lists ancestors nearest first, ending with the root", () => {
    expect(ancestorPaths(index, "src/components/Button.tsx")).toEqual([
      "src/components",
      "src",
      "",
    ]);
  });

  it("returns nothing for the root and unknown paths", () => {
    expect(ancestorPaths(index, "")).toEqual([]);
    expect(ancestorPaths(index, "nope")).toEqual([]);
  });
});

describe("folderPaths", () => {
  it("lists every folder", () => {
    expect(folderPaths(index)).toEqual(["", "src", "src/components"]);
  });
});

describe("childEntries", () => {
  it("returns direct children with their computed sizes", () => {
    expect(
      childEntries(index, "src").map((entry) => [entry.path, entry.totalSize]),
    ).toEqual([
      ["src/index.ts", 1024],
      ["src/components", 512],
    ]);
  });

  it("returns nothing for files, empty folders and unknown paths", () => {
    expect(childEntries(index, "package.json")).toEqual([]);
    expect(
      childEntries(buildIndex({ name: "e", type: "folder", children: [] }), ""),
    ).toEqual([]);
    expect(childEntries(index, "nope")).toEqual([]);
  });
});

describe("displayPath", () => {
  it("prefixes the path with the root name", () => {
    expect(displayPath(index, "src/components/Button.tsx")).toBe(
      "root/src/components/Button.tsx",
    );
  });

  it("shows just the root name for the root", () => {
    expect(displayPath(index, "")).toBe("root");
  });
});

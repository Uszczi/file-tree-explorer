import { describe, expect, it } from "vitest";
import { buildIndex } from "./buildIndex";
import { searchNodes } from "./search";
import type { TreeNode } from "./types";

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
          children: [
            { name: "Button.tsx", type: "file", size: 512 },
            { name: "IconButton.tsx", type: "file", size: 256 },
          ],
        },
      ],
    },
    { name: "button-notes.md", type: "file", size: 10 },
    { name: "Café.txt", type: "file", size: 5 },
    { name: "a.b(c).txt", type: "file", size: 1 },
  ],
};

const index = buildIndex(tree);

function paths(query: string): string[] {
  return searchNodes(index, query).results.map((result) => result.entry.path);
}

describe("searchNodes", () => {
  it("returns nothing for an empty or blank query", () => {
    expect(searchNodes(index, "")).toEqual({ results: [], total: 0 });
    expect(searchNodes(index, "   ")).toEqual({ results: [], total: 0 });
  });

  it("matches substrings case-insensitively, in tree order", () => {
    expect(paths("BUTTON")).toEqual([
      "src/components/Button.tsx",
      "src/components/IconButton.tsx",
      "button-notes.md",
    ]);
  });

  it("matches folders and the root", () => {
    expect(paths("comp")).toEqual(["src/components"]);
    expect(paths("root")).toEqual([""]);
  });

  it("matches only names, not paths", () => {
    expect(paths("src/")).toEqual([]);
  });

  it("trims the query", () => {
    expect(paths("  index ")).toEqual(["src/index.ts"]);
  });

  it("treats regex characters literally", () => {
    expect(paths(".")).toHaveLength(6);
    expect(paths("(c)")).toEqual(["a.b(c).txt"]);
  });

  it("returns no results when nothing matches", () => {
    expect(searchNodes(index, "nope")).toEqual({ results: [], total: 0 });
  });

  it("reports the match position", () => {
    const [result] = searchNodes(index, "button").results.slice(1, 2);
    expect(result?.match).toEqual({ start: 4, length: 6 });
  });

  it("matches composed and decomposed characters alike", () => {
    expect(paths("café")).toEqual(["Café.txt"]);
    expect(paths("café")).toEqual(["Café.txt"]);
  });

  it("drops the match position when normalization changes the name length", () => {
    const decomposed = buildIndex({ name: "Café", type: "file", size: 1 });
    const [result] = searchNodes(decomposed, "caf").results;
    expect(result?.match).toBeNull();
  });

  it("limits results but counts all matches", () => {
    const { results, total } = searchNodes(index, "t", 2);
    expect(results).toHaveLength(2);
    expect(total).toBe(paths("t").length);
  });
});

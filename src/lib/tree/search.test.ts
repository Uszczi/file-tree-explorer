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
            { name: "bigTableNode.tsx", type: "file", size: 128 },
          ],
        },
      ],
    },
    { name: "button-notes.md", type: "file", size: 10 },
    { name: "żółw.txt", type: "file", size: 5 },
    { name: "a.b(c).txt", type: "file", size: 1 },
    { name: "🎉 party.md", type: "file", size: 1 },
  ],
};

const index = buildIndex(tree);

function names(query: string): string[] {
  return searchNodes(index, query).results.map(
    (result) => result.entry.node.name,
  );
}

function positions(query: string, name: string): number[] {
  const result = searchNodes(index, query).results.find(
    (candidate) => candidate.entry.node.name === name,
  );
  return [...(result?.positions ?? [])].sort((a, b) => a - b);
}

describe("searchNodes", () => {
  it("returns nothing for an empty or blank query", () => {
    expect(searchNodes(index, "")).toEqual({ results: [], total: 0 });
    expect(searchNodes(index, "   ")).toEqual({ results: [], total: 0 });
  });

  it("matches characters in order, not necessarily adjacent", () => {
    expect(names("btn")).toContain("Button.tsx");
    expect(names("bgtbl")).toEqual(["bigTableNode.tsx"]);
  });

  it("does not match characters out of order", () => {
    expect(names("ntb")).not.toContain("Button.tsx");
  });

  it("ranks consecutive and word-start matches higher", () => {
    expect(names("button")).toEqual([
      "Button.tsx",
      "button-notes.md",
      "IconButton.tsx",
    ]);
  });

  it("prefers shorter names when scores tie", () => {
    const [first, second] = names("button");
    expect(first).toBe("Button.tsx");
    expect(second).toBe("button-notes.md");
  });

  it("is case-insensitive for lowercase queries", () => {
    // "bigTableNode.tsx" also contains i…n…d…e…x in order, but scores lower.
    expect(names("index")).toEqual(["index.ts", "bigTableNode.tsx"]);
    expect(names("INDEX")).toEqual([]);
  });

  it("uses smart case: an uppercase letter makes the query case-sensitive", () => {
    expect(names("Button")).toEqual(["Button.tsx", "IconButton.tsx"]);
  });

  it("matches folders and the root, names only (not paths)", () => {
    expect(names("comp")).toEqual(["components"]);
    expect(names("root")).toEqual(["root"]);
    expect(names("src/")).toEqual([]);
  });

  it("ignores diacritics in names", () => {
    expect(names("zolw")).toEqual(["żółw.txt"]);
  });

  it("treats regex characters literally", () => {
    expect(names("(c)")).toEqual(["a.b(c).txt"]);
  });

  describe("extended syntax", () => {
    it("requires every space-separated term to match", () => {
      // Order is by score: b|ig T|able N|ode hits word starts, so it outranks Button.
      expect(names("btn tsx").toSorted()).toEqual([
        "Button.tsx",
        "IconButton.tsx",
        "bigTableNode.tsx",
      ]);
      expect(names("btn md")).toEqual(["button-notes.md"]);
    });

    it("supports exact match, prefix, suffix and negation", () => {
      expect(names("'notes")).toEqual(["button-notes.md"]);
      expect(names("^icon")).toEqual(["IconButton.tsx"]);
      // Equal scores, so the shorter name comes first.
      expect(names(".md$")).toEqual(["🎉 party.md", "button-notes.md"]);
      expect(names("button !icon")).toEqual(["Button.tsx", "button-notes.md"]);
    });

    it("supports alternatives with |", () => {
      expect(names("^index | ^żółw")).toEqual(["index.ts", "żółw.txt"]);
    });
  });

  it("reports matched positions", () => {
    expect(positions("btn", "Button.tsx")).toEqual([0, 2, 5]);
    expect(positions("tsx", "Button.tsx")).toEqual([7, 8, 9]);
  });

  it("reports positions as UTF-16 offsets, so they work with string.slice", () => {
    // "🎉" takes two UTF-16 units.
    expect(positions("party", "🎉 party.md")).toEqual([3, 4, 5, 6, 7]);
    expect("🎉 party.md".slice(3, 8)).toBe("party");
  });

  it("limits results but counts all matches", () => {
    const { results, total } = searchNodes(index, "t", 2);
    expect(results).toHaveLength(2);
    expect(total).toBe(names("t").length);
    expect(total).toBeGreaterThan(2);
  });
});

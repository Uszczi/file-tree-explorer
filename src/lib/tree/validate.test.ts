import { describe, expect, it } from "vitest";
import { MAX_ERRORS, parseJson, validateTree } from "./validate";
import type { Result, TreeNode } from "./types";

const example = {
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

function errorPaths(result: Result<TreeNode>): string[] {
  return result.ok ? [] : result.errors.map((error) => error.path);
}

function folder(children: unknown[]): Record<string, unknown> {
  return { name: "root", type: "folder", children };
}

describe("parseJson", () => {
  it("parses valid JSON", () => {
    expect(parseJson('{"a":1}')).toEqual({ ok: true, value: { a: 1 } });
  });

  it.each(["{", "", "not json"])("returns an error for %j", (text) => {
    const result = parseJson(text);
    expect(result.ok).toBe(false);
  });

  it("accepts null, which validateTree then rejects", () => {
    const parsed = parseJson("null");
    expect(parsed).toEqual({ ok: true, value: null });
    expect(validateTree(null).ok).toBe(false);
  });
});

describe("validateTree", () => {
  it("accepts the example from the assignment", () => {
    expect(validateTree(example)).toEqual({ ok: true, value: example });
  });

  it("accepts a single file as the root", () => {
    const file = { name: "a.txt", type: "file", size: 0 };
    expect(validateTree(file)).toEqual({ ok: true, value: file });
  });

  it("accepts an empty folder", () => {
    expect(validateTree(folder([])).ok).toBe(true);
  });

  it("strips unknown fields", () => {
    const result = validateTree({
      ...folder([{ name: "a", type: "file", size: 1, extra: true }]),
      extra: "x",
    });
    expect(result).toEqual({
      ok: true,
      value: {
        name: "root",
        type: "folder",
        children: [{ name: "a", type: "file", size: 1 }],
      },
    });
  });

  it.each([
    ["non-object node", folder([42]), "children[0]"],
    ["array node", folder([[]]), "children[0]"],
    ["missing name", folder([{ type: "file", size: 1 }]), "children[0].name"],
    ["empty name", folder([{ name: " ", type: "file", size: 1 }]), "children[0].name"],
    ["name with slash", folder([{ name: "a/b", type: "file", size: 1 }]), "children[0].name"],
    ["reserved name", folder([{ name: "..", type: "file", size: 1 }]), "children[0].name"],
    ["unknown type", folder([{ name: "a", type: "link" }]), "children[0].type"],
    ["missing size", folder([{ name: "a", type: "file" }]), "children[0].size"],
    ["string size", folder([{ name: "a", type: "file", size: "1" }]), "children[0].size"],
    ["negative size", folder([{ name: "a", type: "file", size: -1 }]), "children[0].size"],
    ["fractional size", folder([{ name: "a", type: "file", size: 1.5 }]), "children[0].size"],
    ["NaN size", folder([{ name: "a", type: "file", size: Number.NaN }]), "children[0].size"],
    ["missing children", folder([{ name: "a", type: "folder" }]), "children[0].children"],
  ])("rejects %s", (_label, input, expectedPath) => {
    expect(errorPaths(validateTree(input))).toEqual([expectedPath]);
  });

  it("rejects duplicate sibling names", () => {
    const input = folder([
      { name: "a", type: "file", size: 1 },
      { name: "a", type: "folder", children: [] },
    ]);
    expect(errorPaths(validateTree(input))).toEqual(["children[1].name"]);
  });

  it("allows the same name in different folders", () => {
    const input = folder([
      { name: "a", type: "folder", children: [{ name: "a", type: "file", size: 1 }] },
    ]);
    expect(validateTree(input).ok).toBe(true);
  });

  it("reports nested paths", () => {
    const input = folder([
      { name: "src", type: "folder", children: [{ name: "x", type: "file", size: -1 }] },
    ]);
    expect(errorPaths(validateTree(input))).toEqual(["children[0].children[0].size"]);
  });

  it("collects multiple errors in input order", () => {
    const input = folder([
      { name: "", type: "file", size: 1 },
      { name: "b", type: "file", size: -1 },
    ]);
    expect(errorPaths(validateTree(input))).toEqual(["children[0].name", "children[1].size"]);
  });

  it(`stops after ${MAX_ERRORS} errors`, () => {
    const input = folder(Array.from({ length: MAX_ERRORS * 2 }, () => 0));
    const result = validateTree(input);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors).toHaveLength(MAX_ERRORS);
  });

  it("handles very deep trees without overflowing the stack", () => {
    let node: unknown = { name: "leaf", type: "file", size: 1 };
    for (let depth = 0; depth < 10_000; depth++) {
      node = { name: `d${depth}`, type: "folder", children: [node] };
    }
    expect(validateTree(node).ok).toBe(true);
  });
});

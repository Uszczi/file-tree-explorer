import { describe, expect, it } from "vitest";
import { INVALID_EXAMPLES, VALID_EXAMPLES } from "./examples";
import { MAX_ERRORS, parseTree } from "../lib/tree/validate";

const ALL_EXAMPLES = [...VALID_EXAMPLES, ...INVALID_EXAMPLES];

describe("examples", () => {
  it("have unique ids", () => {
    const ids = ALL_EXAMPLES.map((example) => example.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(VALID_EXAMPLES)("$label is valid", (example) => {
    expect(parseTree(example.text()).ok).toBe(true);
  });

  it.each(INVALID_EXAMPLES)("$label is invalid", (example) => {
    expect(parseTree(example.text()).ok).toBe(false);
  });

  it.each([
    ["syntax-error", [""]],
    [
      "invalid-fields",
      [
        "children[0].name",
        "children[1].name",
        "children[2].name",
        "children[3].type",
        "children[4].size",
        "children[5].size",
        "children[6].size",
        "children[7].size",
        "children[8].children",
        "children[9]",
      ],
    ],
    ["duplicates", ["children[1].name", "children[2].children[1].name"]],
    ["nested-error", ["children[0].children[0].children[0].size"]],
    ["wrong-root", [""]],
  ])("%s reports the expected error paths", (id, expectedPaths) => {
    const example = INVALID_EXAMPLES.find((candidate) => candidate.id === id);
    const result = parseTree(example!.text());
    expect(result.ok ? [] : result.errors.map((error) => error.path)).toEqual(expectedPaths);
  });

  it("caps the many-errors example", () => {
    const example = INVALID_EXAMPLES.find((candidate) => candidate.id === "many-errors");
    const result = parseTree(example!.text());
    expect(result.ok ? 0 : result.errors.length).toBe(MAX_ERRORS);
  });
});

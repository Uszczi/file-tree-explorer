import { describe, expect, it } from "vitest";
import { joinPath, ROOT_PATH, toNodeUrl, TREE_URL } from "./paths";

describe("ROOT_PATH", () => {
  it("is an empty string", () => {
    expect(ROOT_PATH).toBe("");
  });
});

describe("joinPath", () => {
  it("returns just the name for children of the root", () => {
    expect(joinPath(ROOT_PATH, "src")).toBe("src");
  });

  it("joins nested segments with a slash", () => {
    expect(joinPath("src", "index.ts")).toBe("src/index.ts");
    expect(joinPath("src/components", "Button.tsx")).toBe("src/components/Button.tsx");
  });

  it("builds a full path step by step", () => {
    const path = ["src", "components", "Button.tsx"].reduce(joinPath, ROOT_PATH);
    expect(path).toBe("src/components/Button.tsx");
  });

  it.each(["my file.txt", "#notes?.md", "100%.txt", "zażółć.ts", ".gitignore"])(
    "keeps the name %j unchanged",
    (name) => {
      expect(joinPath("dir", name)).toBe(`dir/${name}`);
    },
  );
});

describe("toNodeUrl", () => {
  it("points the root at the tree view", () => {
    expect(toNodeUrl(ROOT_PATH)).toBe(TREE_URL);
  });

  it("builds a URL for a top-level node", () => {
    expect(toNodeUrl("src")).toBe("/tree/src");
  });

  it("encodes slashes so the path stays a single segment", () => {
    expect(toNodeUrl("src/components/Button.tsx")).toBe(
      "/tree/src%2Fcomponents%2FButton.tsx",
    );
  });

  it.each([
    ["my file.txt", "/tree/my%20file.txt"],
    ["#notes?.md", "/tree/%23notes%3F.md"],
    ["100%.txt", "/tree/100%25.txt"],
    ["zażółć.ts", "/tree/za%C5%BC%C3%B3%C5%82%C4%87.ts"],
    [".gitignore", "/tree/.gitignore"],
  ])("encodes %j", (path, expected) => {
    expect(toNodeUrl(path)).toBe(expected);
  });

  it.each(["src/components/Button.tsx", "dir/my file.txt", "a/#b?/100%.txt", "zażółć/ü.ts"])(
    "round-trips %j through a single path segment",
    (path) => {
      const segment = toNodeUrl(path).slice(`${TREE_URL}/`.length);
      expect(segment).not.toContain("/");
      expect(decodeURIComponent(segment)).toBe(path);
    },
  );
});

import { describe, expect, it } from "vitest";
import { joinPath, ROOT_PATH } from "./paths";

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

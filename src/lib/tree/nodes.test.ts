import { describe, expect, it } from "vitest";
import { isFolder, nodeTypeLabel } from "./nodes";
import type { TreeNode } from "./types";

const file: TreeNode = { name: "a.txt", type: "file", size: 1 };
const folder: TreeNode = { name: "src", type: "folder", children: [file] };

describe("isFolder", () => {
  it("distinguishes folders from files", () => {
    expect(isFolder(folder)).toBe(true);
    expect(isFolder(file)).toBe(false);
  });

  it("narrows the type so children can be accessed", () => {
    const node: TreeNode = folder;
    // Compiles only because the guard narrows TreeNode to FolderNode.
    const children = isFolder(node) ? node.children : [];
    expect(children).toEqual([file]);
  });
});

describe("nodeTypeLabel", () => {
  it("labels folders and files", () => {
    expect(nodeTypeLabel(folder)).toBe("Folder");
    expect(nodeTypeLabel(file)).toBe("File");
  });
});

import type { NodePath } from "./types";

export const ROOT_PATH: NodePath = "";

export function joinPath(parent: NodePath, name: string): NodePath {
  return parent === ROOT_PATH ? name : `${parent}/${name}`;
}

export const TREE_URL = "/tree";

export function toNodeUrl(path: NodePath): string {
  return path === ROOT_PATH
    ? TREE_URL
    : `${TREE_URL}/${encodeURIComponent(path)}`;
}

export const SEARCH_PARAM = "q";

import type { NodePath } from "./types";

export const ROOT_PATH: NodePath = "";

export function joinPath(parent: NodePath, name: string): NodePath {
  return parent === ROOT_PATH ? name : `${parent}/${name}`;
}

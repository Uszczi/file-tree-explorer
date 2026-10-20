export interface FileNode {
  readonly name: string;
  readonly type: "file";
  readonly size: number;
}

export interface FolderNode {
  readonly name: string;
  readonly type: "folder";
  readonly children: readonly TreeNode[];
}

export type TreeNode = FileNode | FolderNode;

export type NodeType = TreeNode["type"];

export type NodePath = string;

export interface IndexedNode {
  readonly node: TreeNode;
  readonly path: NodePath;
  readonly parentPath: NodePath | null;
  readonly depth: number;
  readonly totalSize: number;
}

export interface TreeIndex {
  readonly root: TreeNode;
  readonly byPath: ReadonlyMap<NodePath, IndexedNode>;
}

export interface ValidationError {
  readonly path: string;
  readonly message: string;
}

export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly errors: readonly ValidationError[] };

import type { Result, TreeNode, ValidationError } from "./types";

export const MAX_ERRORS = 50;

const RESERVED_NAMES = new Set([".", ".."]);

type UnknownRecord = Record<string, unknown>;

interface Frame {
  readonly input: unknown;
  readonly errorPath: string;
  readonly target: TreeNode[];
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function fieldPath(errorPath: string, field: string): string {
  return errorPath === "" ? field : `${errorPath}.${field}`;
}

function childPath(errorPath: string, index: number): string {
  return `${fieldPath(errorPath, "children")}[${index}]`;
}

export function parseJson(text: string): Result<unknown> {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, errors: [{ path: "", message: `Invalid JSON: ${message}` }] };
  }
}

function validateName(
  record: UnknownRecord,
  errorPath: string,
  errors: ValidationError[],
): string | null {
  const { name } = record;
  const path = fieldPath(errorPath, "name");

  if (typeof name !== "string" || name.trim() === "") {
    errors.push({ path, message: "Name must be a non-empty string" });
    return null;
  }
  if (name.includes("/")) {
    errors.push({ path, message: `Name "${name}" must not contain "/"` });
    return null;
  }
  if (RESERVED_NAMES.has(name)) {
    errors.push({ path, message: `Name "${name}" is reserved` });
    return null;
  }
  return name;
}

function findDuplicateNames(
  children: readonly unknown[],
  errorPath: string,
  errors: ValidationError[],
): void {
  const seen = new Set<string>();
  children.forEach((child, index) => {
    if (!isRecord(child) || typeof child.name !== "string") return;
    if (seen.has(child.name)) {
      errors.push({
        path: fieldPath(childPath(errorPath, index), "name"),
        message: `Duplicate name "${child.name}" in the same folder`,
      });
    }
    seen.add(child.name);
  });
}

// Iterative on purpose: the input may be nested deeper than the call stack allows.
export function validateTree(input: unknown): Result<TreeNode> {
  const errors: ValidationError[] = [];
  const rootTarget: TreeNode[] = [];
  const stack: Frame[] = [{ input, errorPath: "", target: rootTarget }];

  while (stack.length > 0 && errors.length < MAX_ERRORS) {
    const { input: current, errorPath, target } = stack.pop()!;

    if (!isRecord(current)) {
      errors.push({ path: errorPath, message: "Node must be an object" });
      continue;
    }

    const name = validateName(current, errorPath, errors);
    const { type } = current;

    if (type === "file") {
      const { size } = current;
      if (typeof size !== "number" || !Number.isInteger(size) || size < 0) {
        errors.push({
          path: fieldPath(errorPath, "size"),
          message: "File size must be a non-negative integer",
        });
        continue;
      }
      if (name !== null) target.push({ name, type, size });
      continue;
    }

    if (type === "folder") {
      const { children } = current;
      if (!Array.isArray(children)) {
        errors.push({
          path: fieldPath(errorPath, "children"),
          message: "Folder children must be an array",
        });
        continue;
      }

      findDuplicateNames(children, errorPath, errors);

      const builtChildren: TreeNode[] = [];
      if (name !== null) target.push({ name, type, children: builtChildren });

      // Pushed in reverse so children are processed, and appended, in input order.
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push({
          input: children[index],
          errorPath: childPath(errorPath, index),
          target: builtChildren,
        });
      }
      continue;
    }

    errors.push({
      path: fieldPath(errorPath, "type"),
      message: 'Type must be "file" or "folder"',
    });
  }

  const root = rootTarget[0];
  if (errors.length > 0 || root === undefined) {
    return { ok: false, errors: errors.slice(0, MAX_ERRORS) };
  }
  return { ok: true, value: root };
}

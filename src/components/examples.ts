import type { TreeNode } from "../lib/tree/types";

export interface Example {
  readonly id: string;
  readonly label: string;
  /** Generated on demand, since some examples are large. */
  readonly text: () => string;
}

const ASSIGNMENT_TREE: TreeNode = {
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

const WEB_APP_TREE: TreeNode = {
  name: "web-app",
  type: "folder",
  children: [
    {
      name: "src",
      type: "folder",
      children: [
        { name: "main.tsx", type: "file", size: 412 },
        { name: "App.tsx", type: "file", size: 2_870 },
        {
          name: "components",
          type: "folder",
          children: [
            { name: "Button.tsx", type: "file", size: 1_540 },
            { name: "Modal.tsx", type: "file", size: 4_210 },
            { name: "Table.tsx", type: "file", size: 9_876 },
          ],
        },
        {
          name: "hooks",
          type: "folder",
          children: [
            { name: "useDebounce.ts", type: "file", size: 388 },
            { name: "useFetch.ts", type: "file", size: 1_204 },
          ],
        },
        {
          name: "assets",
          type: "folder",
          children: [
            { name: "logo.svg", type: "file", size: 6_532 },
            { name: "hero.png", type: "file", size: 1_843_200 },
            { name: "intro.mp4", type: "file", size: 48_234_496 },
          ],
        },
      ],
    },
    {
      name: "public",
      type: "folder",
      children: [{ name: "favicon.ico", type: "file", size: 15_086 }],
    },
    { name: "dist", type: "folder", children: [] },
    { name: "backup.tar.gz", type: "file", size: 3_221_225_472 },
    { name: "package.json", type: "file", size: 1_298 },
    { name: "README.md", type: "file", size: 0 },
  ],
};

const SPECIAL_NAMES_TREE: TreeNode = {
  name: "special names",
  type: "folder",
  children: [
    {
      name: "my documents",
      type: "folder",
      children: [
        { name: "zażółć gęślą jaźń.txt", type: "file", size: 2_048 },
        { name: "100% done.md", type: "file", size: 120 },
        { name: "#todo?.txt", type: "file", size: 64 },
      ],
    },
    { name: ".gitignore", type: "file", size: 210 },
    { name: "a&b=c.json", type: "file", size: 33 },
    { name: "日本語", type: "folder", children: [{ name: "ファイル.txt", type: "file", size: 512 }] },
    { name: "very-long-name-".repeat(8) + "end.ts", type: "file", size: 4_096 },
  ],
};

function deepTree(depth: number): TreeNode {
  let node: TreeNode = { name: "bottom.txt", type: "file", size: 1 };
  for (let level = depth; level >= 1; level--) {
    node = { name: `level-${level}`, type: "folder", children: [node] };
  }
  return node;
}

function wideTree(folders: number, filesPerFolder: number): TreeNode {
  return {
    name: "large",
    type: "folder",
    children: Array.from({ length: folders }, (_, folder) => ({
      name: `folder-${folder + 1}`,
      type: "folder" as const,
      children: Array.from({ length: filesPerFolder }, (_, file) => ({
        name: `file-${file + 1}.txt`,
        type: "file" as const,
        // Deterministic, varied sizes.
        size: ((folder + 1) * 7_919 + (file + 1) * 104_729) % 5_000_000,
      })),
    })),
  };
}

function json(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export const VALID_EXAMPLES: readonly Example[] = [
  { id: "assignment", label: "Assignment example", text: () => json(ASSIGNMENT_TREE) },
  { id: "web-app", label: "Web app (B to GB sizes)", text: () => json(WEB_APP_TREE) },
  { id: "special-names", label: "Special characters in names", text: () => json(SPECIAL_NAMES_TREE) },
  {
    id: "missing-children",
    label: "Folders without children",
    text: () =>
      json({
        name: "root",
        type: "folder",
        children: [
          { name: "empty-array", type: "folder", children: [] },
          { name: "no-children-field", type: "folder" },
        ],
      }),
  },
  {
    id: "single-file",
    label: "Single file as root",
    text: () => json({ name: "notes.txt", type: "file", size: 777 }),
  },
  { id: "deep", label: "Deep nesting (200 levels)", text: () => json(deepTree(200)) },
  { id: "large", label: "Large (100 folders × 100 files)", text: () => json(wideTree(100, 100)) },
];

export const INVALID_EXAMPLES: readonly Example[] = [
  {
    id: "syntax-error",
    label: "Invalid JSON syntax",
    text: () => `{
  "name": "root",
  "type": "folder",
  "children": [
    { "name": "a.txt", "type": "file", "size": 10, }
  ]
}`,
  },
  {
    id: "invalid-fields",
    label: "Invalid fields",
    text: () =>
      json({
        name: "root",
        type: "folder",
        children: [
          { type: "file", size: 1 },
          { name: "", type: "file", size: 1 },
          { name: "a/b.txt", type: "file", size: 1 },
          { name: "link", type: "symlink" },
          { name: "no-size.txt", type: "file" },
          { name: "string-size.txt", type: "file", size: "1024" },
          { name: "negative.txt", type: "file", size: -5 },
          { name: "fraction.txt", type: "file", size: 1.5 },
          { name: "bad-children", type: "folder", children: "none" },
          42,
        ],
      }),
  },
  {
    id: "duplicates",
    label: "Duplicate names in a folder",
    text: () =>
      json({
        name: "root",
        type: "folder",
        children: [
          { name: "index.ts", type: "file", size: 100 },
          { name: "index.ts", type: "file", size: 200 },
          {
            name: "src",
            type: "folder",
            children: [
              { name: "utils", type: "folder", children: [] },
              { name: "utils", type: "file", size: 10 },
            ],
          },
        ],
      }),
  },
  {
    id: "nested-error",
    label: "Error deep in the tree",
    text: () =>
      json({
        name: "root",
        type: "folder",
        children: [
          {
            name: "src",
            type: "folder",
            children: [
              {
                name: "components",
                type: "folder",
                children: [{ name: "Button.tsx", type: "file", size: -512 }],
              },
            ],
          },
        ],
      }),
  },
  {
    id: "wrong-root",
    label: "Root is not an object",
    text: () => json([{ name: "a.txt", type: "file", size: 1 }]),
  },
  {
    id: "many-errors",
    label: "Too many errors (200)",
    text: () =>
      json({
        name: "root",
        type: "folder",
        children: Array.from({ length: 200 }, (_, index) => ({
          name: `bad-${index}.txt`,
          type: "file",
          size: -1,
        })),
      }),
  },
];

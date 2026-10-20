import { useMemo, useRef, useState, type KeyboardEvent } from "react";
import { isFolder } from "../lib/tree/nodes";
import { ROOT_PATH } from "../lib/tree/paths";
import type { NodePath, TreeIndex } from "../lib/tree/types";
import { ancestorPaths, folderPaths } from "../lib/tree/queries";
import { getVisibleRows } from "../lib/tree/visibleRows";
import { NodeIcon } from "./NodeIcon";
import { NodeLink } from "./NodeLink";
import { ui } from "./ui";

interface TreeViewProps {
  readonly index: TreeIndex;
  readonly activePath: NodePath;
}

function withAncestors(
  expanded: ReadonlySet<NodePath>,
  index: TreeIndex,
  path: NodePath,
): ReadonlySet<NodePath> {
  return new Set([...expanded, ...ancestorPaths(index, path)]);
}

export function TreeView({ index, activePath }: TreeViewProps) {
  const [expanded, setExpanded] = useState<ReadonlySet<NodePath>>(() =>
    withAncestors(new Set([ROOT_PATH]), index, activePath),
  );
  const [focusedPath, setFocusedPath] = useState(activePath);
  const treeRef = useRef<HTMLUListElement>(null);

  // Reveal the active node when navigating to it (e.g. from a link in the details view).
  // Adjusting state during render avoids an extra effect pass and a flash of collapsed rows.
  const [revealedPath, setRevealedPath] = useState(activePath);
  if (activePath !== revealedPath) {
    setRevealedPath(activePath);
    setExpanded(withAncestors(expanded, index, activePath));
  }

  const rows = useMemo(
    () => getVisibleRows(index, expanded),
    [index, expanded],
  );

  // Roving tabindex: exactly one row is reachable with Tab, arrows move between rows.
  const tabbablePath =
    [focusedPath, activePath].find((path) =>
      rows.some((row) => row.entry.path === path),
    ) ?? ROOT_PATH;

  function setFolderExpanded(path: NodePath, open: boolean) {
    setExpanded((previous) => {
      const next = new Set(previous);
      if (open) next.add(path);
      else next.delete(path);
      return next;
    });
  }

  function focusRow(path: NodePath) {
    setFocusedPath(path);
    treeRef.current
      ?.querySelector<HTMLElement>(`[data-path="${CSS.escape(path)}"]`)
      ?.focus();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const current = rows.findIndex((row) => row.entry.path === focusedPath);
    if (current === -1) return;

    const { entry, expanded: isExpanded } = rows[current];
    const folder = isFolder(entry.node);
    const next = rows.at(current + 1);

    switch (event.key) {
      case "ArrowDown":
        if (next) focusRow(next.entry.path);
        break;
      case "ArrowUp":
        if (current > 0) focusRow(rows[current - 1].entry.path);
        break;
      case "ArrowRight":
        if (folder && !isExpanded) setFolderExpanded(entry.path, true);
        else if (next?.entry.parentPath === entry.path)
          focusRow(next.entry.path);
        break;
      case "ArrowLeft":
        if (folder && isExpanded) setFolderExpanded(entry.path, false);
        else if (entry.parentPath !== null) focusRow(entry.parentPath);
        break;
      case "Home":
        focusRow(rows[0].entry.path);
        break;
      case "End":
        focusRow(rows[rows.length - 1].entry.path);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2
          className={`text-xs font-medium tracking-wide uppercase ${ui.muted}`}
        >
          Files
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            className={ui.smallButton}
            onClick={() => setExpanded(new Set(folderPaths(index)))}
          >
            Expand all
          </button>
          <button
            type="button"
            className={ui.smallButton}
            onClick={() => setExpanded(new Set([ROOT_PATH]))}
          >
            Collapse all
          </button>
        </div>
      </div>

      {/* w-max lets deep rows scroll horizontally instead of squeezing names to nothing. */}
      <ul
        ref={treeRef}
        role="tree"
        aria-label="File tree"
        className="w-max min-w-full text-sm"
        onKeyDown={handleKeyDown}
      >
        {rows.map(({ entry, expanded: isExpanded }) => {
          const { node, path, depth } = entry;
          const folder = isFolder(node);
          const isActive = path === activePath;

          return (
            <li
              key={path}
              role="treeitem"
              aria-level={depth + 1}
              aria-expanded={folder ? isExpanded : undefined}
              aria-selected={isActive}
              className={`flex items-center rounded-md pe-2 whitespace-nowrap ${
                isActive
                  ? "bg-sky-100 font-medium text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
              style={{ paddingInlineStart: `${depth}rem` }}
            >
              {folder ? (
                <button
                  type="button"
                  tabIndex={-1}
                  className="grid size-6 shrink-0 place-items-center rounded text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  aria-label={`${isExpanded ? "Collapse" : "Expand"} ${node.name}`}
                  onClick={() => {
                    setFolderExpanded(path, !isExpanded);
                    focusRow(path);
                  }}
                >
                  <span
                    aria-hidden="true"
                    className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  >
                    ▸
                  </span>
                </button>
              ) : (
                <span className="size-6 shrink-0" aria-hidden="true" />
              )}
              <NodeLink
                path={path}
                data-path={path}
                tabIndex={path === tabbablePath ? 0 : -1}
                aria-current={isActive ? "page" : undefined}
                onFocus={() => setFocusedPath(path)}
                title={node.name}
                className={`max-w-96 truncate rounded-sm py-1 ${ui.focusRing}`}
              >
                <NodeIcon node={node} expanded={isExpanded} /> {node.name}
              </NodeLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

import { ancestorPaths } from "../lib/tree/queries";
import type { NodePath, TreeIndex } from "../lib/tree/types";
import { NodeLink } from "./NodeLink";
import { ui } from "./ui";

interface BreadcrumbsProps {
  readonly index: TreeIndex;
  readonly path: NodePath;
}

export function Breadcrumbs({ index, path }: BreadcrumbsProps) {
  const crumbs = [...ancestorPaths(index, path).reverse(), path].flatMap(
    (crumbPath) => index.byPath.get(crumbPath) ?? [],
  );

  return (
    <nav aria-label="Breadcrumb" className="mb-3">
      <ol
        className={`flex flex-wrap items-center gap-x-1 gap-y-0.5 text-sm ${ui.muted}`}
      >
        {crumbs.map((crumb, position) => (
          <li key={crumb.path} className="flex min-w-0 items-center gap-1">
            {position > 0 && <span aria-hidden="true">/</span>}
            {crumb.path === path ? (
              <span
                aria-current="page"
                className="font-medium break-all text-zinc-900 dark:text-zinc-100"
              >
                {crumb.node.name}
              </span>
            ) : (
              <NodeLink path={crumb.path} className={`${ui.link} break-all`}>
                {crumb.node.name}
              </NodeLink>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

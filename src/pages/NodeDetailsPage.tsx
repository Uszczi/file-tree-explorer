import { useParams } from "react-router-dom";
import { Breadcrumbs } from "../components/Breadcrumbs";
import { NodeIcon } from "../components/NodeIcon";
import { NodeLink } from "../components/NodeLink";
import { ui } from "../components/ui";
import { formatSize } from "../lib/tree/formatSize";
import { isFolder, nodeTypeLabel } from "../lib/tree/nodes";
import { ROOT_PATH } from "../lib/tree/paths";
import { childEntries, displayPath } from "../lib/tree/queries";
import type { IndexedNode, TreeIndex } from "../lib/tree/types";
import { useTreeIndex } from "../state/treeContext";

const bytesFormat = new Intl.NumberFormat("en-US");

function Size({ bytes }: { readonly bytes: number }) {
  return <span title={`${bytesFormat.format(bytes)} bytes`}>{formatSize(bytes)}</span>;
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

interface DetailsProps {
  readonly index: TreeIndex;
  readonly entry: IndexedNode;
}

function ParentLink({ index, entry }: DetailsProps) {
  if (entry.parentPath === null) return null;
  const parent = index.byPath.get(entry.parentPath);
  if (parent === undefined) return null;
  return (
    <>
      <dt className={ui.muted}>Parent</dt>
      <dd>
        <NodeLink path={parent.path} className={`${ui.link} break-all`}>
          {parent.node.name}
        </NodeLink>
      </dd>
    </>
  );
}

const dlClass = "grid grid-cols-[max-content_minmax(0,1fr)] gap-x-6 gap-y-2 text-sm";

function FileDetails({ index, entry }: DetailsProps) {
  return (
    <dl className={dlClass}>
      <dt className={ui.muted}>Type</dt>
      <dd>File</dd>
      <dt className={ui.muted}>Size</dt>
      <dd>
        <Size bytes={entry.totalSize} />
      </dd>
      <dt className={ui.muted}>Full path</dt>
      <dd>
        <code>{displayPath(index, entry.path)}</code>
      </dd>
      <ParentLink index={index} entry={entry} />
    </dl>
  );
}

function FolderDetails({ index, entry }: DetailsProps) {
  const children = childEntries(index, entry.path);
  const folderCount = children.filter((child) => isFolder(child.node)).length;
  const fileCount = children.length - folderCount;

  return (
    <>
      <dl className={dlClass}>
        <dt className={ui.muted}>Type</dt>
        <dd>Folder</dd>
        <dt className={ui.muted}>Direct children</dt>
        <dd>
          {children.length}
          {children.length > 0 && (
            <span className={ui.muted}>
              {" "}
              ({plural(folderCount, "folder")}, {plural(fileCount, "file")})
            </span>
          )}
        </dd>
        <dt className={ui.muted}>Total size</dt>
        <dd>
          <Size bytes={entry.totalSize} />
        </dd>
        <dt className={ui.muted}>Full path</dt>
        <dd>
          <code>{displayPath(index, entry.path)}</code>
        </dd>
        <ParentLink index={index} entry={entry} />
      </dl>

      <h3 className="mt-8 mb-2 text-sm font-semibold">Contents</h3>
      {children.length === 0 ? (
        <p
          className={`rounded-md border border-dashed border-zinc-300 p-6 text-center text-sm dark:border-zinc-700 ${ui.muted}`}
        >
          This folder is empty.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className={`bg-zinc-50 text-left text-xs tracking-wide uppercase dark:bg-zinc-800/50 ${ui.muted}`}>
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">
                  Name
                </th>
                <th scope="col" className="px-3 py-2 font-medium">
                  Type
                </th>
                <th scope="col" className="px-3 py-2 text-right font-medium">
                  Size
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {children.map((child) => (
                <tr key={child.path} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="px-3 py-2">
                    <NodeLink path={child.path} className={`${ui.link} break-all`}>
                      <NodeIcon node={child.node} /> {child.node.name}
                    </NodeLink>
                  </td>
                  <td className={`px-3 py-2 ${ui.muted}`}>{nodeTypeLabel(child.node)}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">
                    <Size bytes={child.totalSize} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

// The router already decodes the param once, so it must not be decoded again:
// decodeURIComponent("100%.txt") would throw.
export function NodeDetailsPage() {
  const { nodePath = ROOT_PATH } = useParams();
  const index = useTreeIndex();
  const entry = index.byPath.get(nodePath);

  if (entry === undefined) {
    return (
      <section className="flex flex-col items-start gap-3">
        <title>Node not found · FileTree Explorer</title>
        <h2 className="text-xl font-semibold">Node not found</h2>
        <p className="text-sm">
          <code>{nodePath}</code> does not exist in this tree.
        </p>
        <NodeLink path={ROOT_PATH} className={ui.button}>
          Go to root
        </NodeLink>
      </section>
    );
  }

  const folder = isFolder(entry.node);

  return (
    <section>
      <title>{`${entry.node.name} · FileTree Explorer`}</title>
      <Breadcrumbs index={index} path={entry.path} />
      <h2 className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xl font-semibold tracking-tight">
        <span className="break-all">
          <NodeIcon node={entry.node} /> {entry.node.name}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            folder
              ? "bg-amber-100 text-amber-800 dark:bg-amber-400/15 dark:text-amber-300"
              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          }`}
        >
          {nodeTypeLabel(entry.node)}
        </span>
      </h2>
      {folder ? <FolderDetails index={index} entry={entry} /> : <FileDetails index={index} entry={entry} />}
    </section>
  );
}

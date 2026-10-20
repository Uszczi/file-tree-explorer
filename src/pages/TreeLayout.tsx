import {
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { SearchPanel } from "../components/SearchPanel";
import { TreeView } from "../components/TreeView";
import { ui } from "../components/ui";
import { ROOT_PATH, SEARCH_PARAM } from "../lib/tree/paths";
import { useTree } from "../state/treeContext";

export function TreeLayout() {
  const { index, persisted, clear } = useTree();
  const navigate = useNavigate();
  const { nodePath = ROOT_PATH } = useParams();
  const [searchParams] = useSearchParams();
  const isSearching = (searchParams.get(SEARCH_PARAM) ?? "") !== "";

  if (index === null) {
    return <Navigate to="/" replace />;
  }

  async function closeTree() {
    await clear();
    navigate("/");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
        <Link
          to="/"
          className={`shrink-0 rounded-sm font-semibold tracking-tight ${ui.focusRing}`}
        >
          📂 FileTree Explorer
        </Link>
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`truncate text-sm ${ui.muted}`}
            title={index.root.name}
          >
            {index.root.name}
          </span>
          <button type="button" className={ui.button} onClick={closeTree}>
            Close tree
          </button>
        </div>
      </header>

      {!persisted && (
        <p
          role="status"
          className="border-b border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
        >
          This tree could not be saved in the browser and will be lost after a
          page reload.
        </p>
      )}

      <div className="grid flex-1 gap-4 p-4 md:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] md:items-start md:gap-6">
        <nav
          aria-label="Explorer"
          className={`${ui.card} min-w-0 overflow-auto p-3 md:sticky md:top-20 md:max-h-[calc(100dvh-6rem)]`}
        >
          <SearchPanel index={index} />
          {/* Hidden rather than unmounted, so expanded folders survive a search. */}
          <div hidden={isSearching}>
            <TreeView index={index} activePath={nodePath} />
          </div>
        </nav>
        <main className={`${ui.card} min-w-0 p-4 md:p-6`}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

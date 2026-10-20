import {
  useEffect,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { ROOT_PATH, SEARCH_PARAM } from "../lib/tree/paths";
import { displayPath } from "../lib/tree/queries";
import { searchNodes, type SearchResult } from "../lib/tree/search";
import type { TreeIndex } from "../lib/tree/types";
import { NodeLink } from "./NodeLink";
import { ui } from "./ui";

const DEBOUNCE_MS = 250;

interface SearchPanelProps {
  readonly index: TreeIndex;
}

function HighlightedName({ result }: { readonly result: SearchResult }) {
  const { name } = result.entry.node;
  const parts: ReactNode[] = [];
  let runStart = 0;

  for (let position = 1; position <= name.length; position++) {
    const isMatch = result.positions.has(position - 1);
    const endsRun =
      position === name.length || result.positions.has(position) !== isMatch;
    if (!endsRun) continue;

    const text = name.slice(runStart, position);
    parts.push(isMatch ? <mark key={runStart}>{text}</mark> : text);
    runStart = position;
  }

  return <>{parts}</>;
}

export function SearchPanel({ index }: SearchPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(SEARCH_PARAM) ?? "";
  const { nodePath: activePath = ROOT_PATH } = useParams();
  const [input, setInput] = useState(query);
  const inputId = useId();

  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setInput(query);
  }

  useEffect(() => {
    const nextQuery = input.trim() === "" ? "" : input;
    if (nextQuery === query) return;

    const timeout = setTimeout(() => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          if (nextQuery === "") next.delete(SEARCH_PARAM);
          else next.set(SEARCH_PARAM, nextQuery);
          return next;
        },
        { replace: true },
      );
    }, DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [input, query, setSearchParams]);

  const { results, total } = useMemo(
    () => searchNodes(index, query),
    [index, query],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") setInput("");
  }

  return (
    <search className="mb-4 flex flex-col gap-1.5">
      <label htmlFor={inputId} className="sr-only">
        Search by name
      </label>
      <input
        id={inputId}
        type="search"
        value={input}
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Fuzzy search, e.g. btn…"
        autoComplete="off"
        spellCheck={false}
        className={ui.input}
      />

      {query !== "" && (
        <>
          <p aria-live="polite" className={`px-1 text-xs ${ui.muted}`}>
            {total === 0
              ? "No results."
              : total > results.length
                ? `Showing first ${results.length} of ${total} results.`
                : `${total} ${total === 1 ? "result" : "results"}.`}
          </p>
          <ul className="flex flex-col gap-0.5">
            {results.map((result) => {
              const isActive = result.entry.path === activePath;
              return (
                <li key={result.entry.path}>
                  <NodeLink
                    path={result.entry.path}
                    aria-current={isActive ? "page" : undefined}
                    className={`flex flex-col rounded-md px-2 py-1.5 ${ui.focusRing} ${
                      isActive
                        ? "bg-sky-100 dark:bg-sky-500/15"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-sm font-medium break-all">
                      <span aria-hidden="true">
                        {result.entry.node.type === "folder" ? "📁" : "📄"}
                      </span>{" "}
                      <HighlightedName result={result} />
                    </span>
                    <span className={`text-xs break-all ${ui.muted}`}>
                      {displayPath(index, result.entry.path)}
                    </span>
                  </NodeLink>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </search>
  );
}

import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";
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
  if (result.match === null) return <>{name}</>;
  const { start, length } = result.match;
  return (
    <>
      {name.slice(0, start)}
      <mark>{name.slice(start, start + length)}</mark>
      {name.slice(start + length)}
    </>
  );
}

export function SearchPanel({ index }: SearchPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get(SEARCH_PARAM) ?? "";
  const { nodePath: activePath = ROOT_PATH } = useParams();
  const [input, setInput] = useState(query);
  const inputId = useId();

  // The URL is the source of truth: follow it when it changes from outside (back button, link).
  const [syncedQuery, setSyncedQuery] = useState(query);
  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setInput(query);
  }

  // Write the input to the URL after typing pauses; replace so history isn't flooded with keystrokes.
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

  const { results, total } = useMemo(() => searchNodes(index, query), [index, query]);

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
        placeholder="Search by name…"
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
                      isActive ? "bg-sky-100 dark:bg-sky-500/15" : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <span className="text-sm font-medium break-all">
                      <span aria-hidden="true">{result.entry.node.type === "folder" ? "📁" : "📄"}</span>{" "}
                      <HighlightedName result={result} />
                    </span>
                    <span className={`text-xs break-all ${ui.muted}`}>{displayPath(index, result.entry.path)}</span>
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

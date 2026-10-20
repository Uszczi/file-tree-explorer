import type { IndexedNode, TreeIndex } from "./types";

export const MAX_RESULTS = 100;

export interface SearchMatch {
  readonly start: number;
  readonly length: number;
}

export interface SearchResult {
  readonly entry: IndexedNode;
  /** Position of the match in the name, or null when it cannot be mapped back reliably. */
  readonly match: SearchMatch | null;
}

export interface SearchResults {
  readonly results: readonly SearchResult[];
  /** Number of all matches, which may exceed the returned results. */
  readonly total: number;
}

// NFC so that "é" typed on one system matches "é" stored decomposed (e.g. macOS file names).
function normalize(text: string): string {
  return text.normalize("NFC").toLowerCase();
}

/** Case-insensitive substring search over node names, in tree order. */
export function searchNodes(index: TreeIndex, query: string, limit = MAX_RESULTS): SearchResults {
  const needle = normalize(query.trim());
  if (needle === "") return { results: [], total: 0 };

  const results: SearchResult[] = [];
  let total = 0;

  for (const entry of index.byPath.values()) {
    const { name } = entry.node;
    const haystack = normalize(name);
    const start = haystack.indexOf(needle);
    if (start === -1) continue;

    total++;
    if (results.length < limit) {
      // Normalizing can change the length (e.g. decomposed characters); then offsets don't apply.
      const match = haystack.length === name.length ? { start, length: needle.length } : null;
      results.push({ entry, match });
    }
  }

  return { results, total };
}

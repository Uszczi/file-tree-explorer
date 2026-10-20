import { byLengthAsc, extendedMatch, Fzf, type FzfResultItem } from "fzf";
import type { IndexedNode, TreeIndex } from "./types";

export const MAX_RESULTS = 100;

export interface SearchResult {
  readonly entry: IndexedNode;
  /** Indexes of matched characters in the name, as UTF-16 offsets (like string.slice). */
  readonly positions: ReadonlySet<number>;
}

export interface SearchResults {
  readonly results: readonly SearchResult[];
  /** Number of all matches, which may exceed the returned results. */
  readonly total: number;
}

interface Candidate {
  readonly entry: IndexedNode;
  readonly order: number;
}

function byTreeOrder(a: FzfResultItem<Candidate>, b: FzfResultItem<Candidate>): number {
  return a.item.order - b.item.order;
}

// Building the finder walks every node, so it is done once per loaded tree.
const finders = new WeakMap<TreeIndex, Fzf<readonly Candidate[]>>();

function getFinder(index: TreeIndex): Fzf<readonly Candidate[]> {
  let finder = finders.get(index);
  if (finder === undefined) {
    const candidates = [...index.byPath.values()].map((entry, order) => ({ entry, order }));
    finder = new Fzf(candidates, {
      selector: (candidate) => candidate.entry.node.name,
      // fzf's extended syntax: space-separated terms (AND), 'exact, ^prefix, suffix$, !negation, a | b.
      match: extendedMatch,
      casing: "smart-case",
      // Lets "zolw" find "żółw".
      normalize: true,
      tiebreakers: [byLengthAsc, byTreeOrder],
    });
    finders.set(index, finder);
  }
  return finder;
}

/** fzf-style fuzzy search over node names, best matches first. */
export function searchNodes(index: TreeIndex, query: string, limit = MAX_RESULTS): SearchResults {
  if (query.trim() === "") return { results: [], total: 0 };

  const matches = getFinder(index).find(query);
  return {
    results: matches.slice(0, limit).map(({ item, positions }) => ({ entry: item.entry, positions })),
    total: matches.length,
  };
}

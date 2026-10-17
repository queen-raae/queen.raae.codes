// Browser-side search for the search overlay.
// The Fuse index (/search-index.json) and Fuse itself are loaded on first use only.
import type Fuse from "fuse.js";

export interface SearchItem {
  title: string;
  description: string;
  slug: string;
  date: string;
  type?: string;
  tags: { label: string }[];
}

export type SearchResult = ReturnType<Fuse<SearchItem>["search"]>[number];

const FUSE_OPTIONS = {
  includeScore: true,
  ignoreLocation: true,
  includeMatches: true,
  shouldSort: true,
  useExtendedSearch: true,
  minMatchCharLength: 3,
  threshold: 0.4,
  keys: [
    "title",
    "tags.label",
    {
      name: "description",
      weight: 0.7,
    },
  ],
};

let fusePromise: Promise<Fuse<SearchItem>> | null = null;

export function loadSearch(): Promise<Fuse<SearchItem>> {
  if (!fusePromise) {
    fusePromise = Promise.all([import("fuse.js"), fetch("/search-index.json").then((res) => res.json())])
      .then(([{ default: FuseClass }, data]) => new FuseClass<SearchItem>(data, FUSE_OPTIONS))
      .catch((error) => {
        fusePromise = null;
        throw error;
      });
  }
  return fusePromise;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightMatches(text: string, indices: readonly [number, number][]): string {
  if (!indices || indices.length === 0) return escapeHtml(text);

  let result = "";
  let lastIndex = 0;

  indices.forEach(([start, end]) => {
    result += escapeHtml(text.slice(lastIndex, start));
    result += "<mark>" + escapeHtml(text.slice(start, end + 1)) + "</mark>";
    lastIndex = end + 1;
  });

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

export function renderResults(results: SearchResult[]): string {
  return results
    .map((result) => {
      const item = result.item;
      let title = escapeHtml(item.title);
      let description = escapeHtml(item.description);

      // Highlight matches (replaces the escaped default above)
      result.matches?.forEach((match) => {
        if (match.key === "title") {
          title = highlightMatches(item.title, match.indices);
        } else if (match.key === "description") {
          description = highlightMatches(item.description, match.indices);
        }
      });

      const tags = item.tags
        .map((tag) => `<span class="tag"><span class="h" aria-hidden="true">#</span>${escapeHtml(tag.label)}</span>`)
        .join(" ");

      return `
      <a class="row" href="${escapeHtml(item.slug)}">
        <span class="mono row-date">${escapeHtml(item.date)}</span>
        ${item.type ? `<span class="mono label row-type">${escapeHtml(item.type)}</span>` : ""}
        <span class="row-main">
          <span class="ttl">${title}&#8288;<span class="arr" aria-hidden="true">→</span></span>
          <span class="row-desc">${description}</span>
          <span class="row-tags flex flex-wrap gap-x-4 -ml-1">${tags}</span>
        </span>
      </a>
    `;
    })
    .join("");
}

// Send what people search for to Fathom as events, so the dashboard shows what readers come looking for.
// Only the term someone settles on is sent (after a pause, on clicking a result, closing the overlay
// or leaving the page), not every keystroke. Each term is sent once per visit.
const trackedTerms = new Set<string>();
let trackTimer: ReturnType<typeof setTimeout>;
let pendingTrack: { term: string; hits: number } | null = null;

export function trackSearch() {
  clearTimeout(trackTimer);
  if (!pendingTrack) return;
  const { term, hits } = pendingTrack;
  pendingTrack = null;
  const key = term.toLowerCase().slice(0, 60);
  if (trackedTerms.has(key)) return;
  trackedTerms.add(key);
  const fathom = (window as unknown as { fathom?: { trackEvent: (name: string) => void } }).fathom;
  fathom?.trackEvent(hits > 0 ? `Search: ${key}` : `Search, no results: ${key}`);
}

export function queueTrackSearch(term: string, hits: number) {
  clearTimeout(trackTimer);
  pendingTrack = { term, hits };
  trackTimer = setTimeout(trackSearch, 2000);
}

export function cancelTrackSearch() {
  clearTimeout(trackTimer);
  pendingTrack = null;
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", trackSearch);
}

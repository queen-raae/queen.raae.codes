import { getAllPosts, isProduction } from "./posts";

export type ReadingKind = "Book" | "Article" | "Episode";

export interface ReadingItem {
  kind: ReadingKind;
  title: string;
  creator?: string;
  note: string;
  reread: boolean;
  href: string;
  date: string;
  dateShort: string;
  year: string;
  standIn?: boolean;
}

const KIND_BY_TYPE: Record<string, ReadingKind | undefined> = {
  Book: "Book",
  Link: "Article",
  Podcast: "Episode",
};

// Stand-ins from the design mock-ups. Shown on deploy previews only, and only
// until the first real Book or Link entry exists, so the layout can be reviewed.
const STAND_INS: Omit<ReadingItem, "year" | "dateShort" | "href" | "standIn">[] = [
  {
    kind: "Book",
    title: "Small Giants",
    creator: "Bo Burlingham",
    note: "Fourteen companies that turned down growth on purpose. Relevant, uncomfortably.",
    reread: false,
    date: "2026-10-03",
  },
  {
    kind: "Article",
    title: "On buying the software nobody wants",
    creator: "newsletter · 6 min",
    note: "Gets at why ‘boring and profitable’ is the best phrase in the English language.",
    reread: false,
    date: "2026-09-28",
  },
  {
    kind: "Book",
    title: "Kill It with Fire",
    creator: "Marianne Bellotti",
    note: "The best book on legacy systems because it is really a book about organisations. Read before every takeover.",
    reread: false,
    date: "2026-09-14",
  },
  {
    kind: "Book",
    title: "Working in Public",
    creator: "Nadia Eghbal",
    note: "Second time through. The bit about maintainers as stewards reads differently once you own the thing.",
    reread: true,
    date: "2026-08-19",
  },
  {
    kind: "Book",
    title: "The Mom Test",
    creator: "Rob Fitzpatrick",
    note: "Ask about their life, not your idea. Short, blunt, correct. I give it to everyone.",
    reread: false,
    date: "2025-11-30",
  },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export async function getReadingItems(): Promise<ReadingItem[]> {
  const posts = await getAllPosts();
  const items: ReadingItem[] = posts
    .filter((post) => KIND_BY_TYPE[post.type])
    .map((post) => ({
      kind: KIND_BY_TYPE[post.type]!,
      title: post.title,
      creator: post.creator,
      note: post.standfirst || post.description,
      reread: post.reread,
      href: post.slug,
      date: post.date,
      dateShort: post.dateShort,
      year: post.year,
    }));

  const hasNotes = items.some((item) => item.kind !== "Episode");
  if (hasNotes || isProduction) return items;

  const standIns = STAND_INS.map((item) => ({
    ...item,
    year: item.date.slice(0, 4),
    dateShort: `${item.date.slice(8, 10)} ${MONTHS[Number(item.date.slice(5, 7)) - 1]}`,
    href: "#",
    standIn: true,
  }));

  return [...items, ...standIns].sort((a, b) => b.date.localeCompare(a.date));
}

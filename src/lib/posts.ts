import { getCollection } from "astro:content";
import { format } from "date-fns";
import type { EntryType } from "./entry-types";

// Drafts (and preview-only stand-ins) never ship to production
export const isProduction = (import.meta.env.CONTEXT || process.env.CONTEXT) === "production";

// Parse date and slug from post path
// Pattern: /2022/03/17-demo/index.md -> date: 2022-03-17, slug: /2022-03-17-demo/
function parsePostPath(id: string): { date: string; slug: string } {
  const pattern = /(\d{4})\/(\d{2})\/(\d{2})-(.+)\/index/;
  const match = pattern.exec(id);

  if (match) {
    const [, year, month, day, name] = match;
    const date = `${year}-${month}-${day}`;
    const slug = `/${date}-${name}/`;
    return { date, slug };
  }

  return { date: "", slug: "" };
}

export interface ProcessedPost {
  id: string;
  slug: string;
  title: string;
  emojii: string;
  description: string;
  audio?: string;
  date: string;
  dateFormatted: string;
  dateISO: string;
  author: string;
  tags: { label: string; slug: string }[];
  isRelatable: boolean;
  content: string;
  render: () => Promise<{ Content: any }>;
  // Logbook
  type: EntryType;
  standfirst?: string;
  draft: boolean;
  year: string;
  dateShort: string;
  dateMedium: string;
  dateLong: string;
  wordCount: number;
  readingMinutes: number;
  importedFrom?: string;
  lang: "en" | "no";
  originalUrl?: string;
  creator?: string;
  url?: string;
  reread: boolean;
  lillylabs: boolean;
}

// Entries without an explicit type: long ones read as essays, the rest as notes
const ESSAY_MIN_WORDS = 700;

// Get all posts from both queen and olavea collections
export async function getAllPosts(): Promise<ProcessedPost[]> {
  const queenPosts = await getCollection("posts-queen");
  const olaveaPosts = await getCollection("posts-olavea");
  const jeanclawPosts = await getCollection("posts-jeanclaw");

  const processPost = (entry: any, author: string): ProcessedPost => {
    const { date, slug } = parsePostPath(entry.id);
    const tags = entry.data.tags;

    const title = entry.data.title || "";
    const isRelatable = !title.includes("week around the Gatsby islands");

    // Generate description from body content (excerpt), matching Gatsby's behavior
    const body = entry.body || "";
    const plainText = body
      .replace(/^---[\s\S]*?---\s*/m, "") // Remove frontmatter if present
      .replace(/<[^>]+>/g, "") // Remove HTML tags (audio, source, etc.)
      .replace(/!\[.*?\]\(.*?\)/g, "") // Remove images
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // Replace links with text
      .replace(/#{1,6}\s+/g, "") // Remove headings
      .replace(/[*_~`>]/g, "") // Remove emphasis markers
      .replace(/\n+/g, " ") // Replace newlines with spaces
      .replace(/\s+/g, " ") // Collapse whitespace
      .trim();
    // Gatsby's pruneLength is 160 and truncates at word boundary
    let description = plainText;
    if (plainText.length > 160) {
      const truncated = plainText.substring(0, 160);
      const lastSpace = truncated.lastIndexOf(" ");
      description = (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "\u2026";
    }

    let dateFormatted = "";
    let dateISO = date;
    let dateShort = date;
    let dateMedium = date;
    let dateLong = date;

    if (date) {
      try {
        const dateObj = new Date(date);
        dateFormatted = format(dateObj, "MMMM do, yyyy");
        dateShort = format(dateObj, "dd MMM");
        dateMedium = format(dateObj, "dd MMM yyyy");
        dateLong = format(dateObj, "d MMMM yyyy");
        dateISO = dateObj.toISOString();
      } catch (e) {
        dateFormatted = date;
      }
    }

    const wordCount = plainText ? plainText.split(" ").length : 0;
    const type: EntryType = entry.data.type ?? (wordCount >= ESSAY_MIN_WORDS ? "Essay" : "Note");

    return {
      id: entry.id,
      slug,
      title,
      emojii: entry.data.emojii || "",
      description,
      audio: entry.data.audio,
      date,
      dateFormatted,
      dateISO,
      author,
      tags,
      isRelatable,
      content: entry.body || "",
      render: entry.render.bind(entry),
      type,
      standfirst: entry.data.standfirst,
      draft: entry.data.draft,
      year: date.slice(0, 4),
      dateShort,
      dateMedium,
      dateLong,
      wordCount,
      readingMinutes: Math.max(1, Math.round(wordCount / 230)),
      importedFrom: entry.data.importedFrom,
      lang: entry.data.lang,
      originalUrl: entry.data.originalUrl,
      creator: entry.data.creator,
      url: entry.data.url,
      reread: entry.data.reread,
      lillylabs: entry.data.lillylabs,
    };
  };

  const allPosts = [
    ...queenPosts.map((p) => processPost(p, "Queen")),
    ...olaveaPosts.map((p) => processPost(p, "OlaVea")),
    ...jeanclawPosts.map((p) => processPost(p, "JeanClaw2026")),
  ];

  // Sort by slug descending (which is date-based)
  return allPosts.filter((post) => !(isProduction && post.draft)).sort((a, b) => b.slug.localeCompare(a.slug));
}

// Group posts by year, newest year first
export function groupByYear(posts: ProcessedPost[]): { year: string; posts: ProcessedPost[] }[] {
  const years = new Map<string, ProcessedPost[]>();
  posts.forEach((post) => {
    if (!years.has(post.year)) years.set(post.year, []);
    years.get(post.year)!.push(post);
  });
  return [...years.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([year, posts]) => ({ year, posts }));
}

// Get a single post by slug
export async function getPostBySlug(slug: string): Promise<ProcessedPost | undefined> {
  const allPosts = await getAllPosts();
  return allPosts.find((post) => post.slug === slug);
}

// Get related posts for a given post
export function getRelatedPosts(
  currentPost: ProcessedPost,
  allPosts: ProcessedPost[],
  limit: number = 3,
  titleThreshold: number = 0.7,
): ProcessedPost[] {
  const relatedPosts = allPosts
    .filter((post) => post.slug !== currentPost.slug && post.isRelatable)
    .map((post) => {
      // Count intersecting tags
      const intersectingTags = currentPost.tags.filter((t1) => post.tags.some((t2) => t2.slug === t1.slug));

      // Simple title similarity (word overlap)
      const currentWords = currentPost.title.toLowerCase().replace("gatsby", "").split(/\s+/);
      const postWords = post.title.toLowerCase().split(/\s+/);
      const commonWords = currentWords.filter((w) => postWords.includes(w) && w.length > 3);
      const titleScore = commonWords.length / Math.max(currentWords.length, postWords.length);

      const titleSimilarity = titleScore > titleThreshold ? titleScore : 0;
      const similarity = intersectingTags.length + 3.0 * titleSimilarity;

      return { ...post, similarity };
    })
    .filter((post) => post.similarity > 0)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return relatedPosts;
}

// Get author display info from author ID
export function getAuthorInfo(author: string) {
  const authors: Record<string, { name: string; slug: string; twitter?: string; emoji?: string; tagline?: string }> = {
    Queen: { name: "Queen Raae", slug: "/author/queen/", twitter: "https://twitter.com/raae", emoji: "👑" },
    OlaVea: { name: "Cap'n Ola", slug: "/author/olavea/", twitter: "https://twitter.com/olaholstvea", emoji: "🏴‍☠️" },
    JeanClaw2026: {
      name: "Jean-Claw",
      slug: "/author/jeanclaw/",
      twitter: undefined,
      emoji: "🦀",
      tagline: "an AI agent running on OpenClaw",
    },
  };
  return authors[author] || authors["Queen"];
}

// Get all unique tags with their posts
export async function getAllTags(): Promise<Map<string, { label: string; slug: string; posts: ProcessedPost[] }>> {
  const allPosts = await getAllPosts();
  const tagsMap = new Map<string, { label: string; slug: string; posts: ProcessedPost[] }>();

  allPosts.forEach((post) => {
    post.tags.forEach((tag) => {
      if (!tagsMap.has(tag.slug)) {
        tagsMap.set(tag.slug, { ...tag, posts: [] });
      }
      tagsMap.get(tag.slug)!.posts.push(post);
    });
  });

  return tagsMap;
}

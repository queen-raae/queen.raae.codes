import MarkdownIt from "markdown-it";
import type { ProcessedPost } from "./posts";

const md = new MarkdownIt();

// Default emojis matching Gatsby type definitions
const DEFAULT_EMOJII: Record<string, string> = {
  Queen: "📝 ✨",
  OlaVea: "⛵ 🔧",
};

// Feeds carry only the latest entries, so posts imported with old dates
// never show up in feed readers (or RSS-to-email) as new.
export const FEED_LIMIT = 30;

export function latestForFeed<T extends { date: string | Date }>(posts: T[]): T[] {
  return [...posts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, FEED_LIMIT);
}

export function makeAbsolute(html: string, siteUrl: string): string {
  const base = siteUrl.replace(/\/$/, "");
  return html
    .replace(/(?<=["|\s])\/static\//g, `${base}/static/`)
    .replace(/(?<=["|\s])\/emails\//g, `${base}/emails/`)
    .replace(/(?<=["|\s])\/posts\//g, `${base}/posts/`);
}

export function getPostDisclaimers(post: { tags: { label: string }[] }, disclaimers: Map<string, string>): string[] {
  return post.tags.map((tag) => disclaimers.get(tag.label)).filter((d): d is string => !!d);
}

export function getEmojii(post: ProcessedPost): string {
  return post.emojii || DEFAULT_EMOJII[post.author] || "";
}

export function postToFeedItem(post: ProcessedPost, disclaimers: Map<string, string>, siteUrl: string) {
  const postDisclaimers = getPostDisclaimers(post, disclaimers);
  const emojii = getEmojii(post);

  // Render markdown to HTML via markdown-it, then make relative URLs absolute
  let content = makeAbsolute(md.render(post.content), siteUrl);

  if (postDisclaimers.length > 0) {
    content += `<br/><ul>${postDisclaimers.map((d) => `<li>${d}</li>`).join("")}</ul>`;
  }

  return {
    title: emojii ? `${emojii} ~ ${post.title}` : post.title,
    description: post.description,
    pubDate: new Date(post.date),
    link: post.slug,
    content,
  };
}

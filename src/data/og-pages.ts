import siteMetadata from "./siteMetadata";
import { getPageOgImageUrl } from "../lib/og-image";

// Social cards for pages that aren't log entries. Rendered by src/pages/og/page/[page].png.ts
export const OG_PAGES = {
  home: {
    labels: ["Logbook"],
    title: siteMetadata.siteName,
    description: siteMetadata.siteDescription,
  },
  posts: {
    labels: ["The archive"],
    title: "The log, by year",
    description: "Every entry in Queen Raae's logbook, newest first, grouped by year.",
  },
  press: {
    labels: ["Elsewhere"],
    title: "Press",
    description: "Articles about Queen Raae and podcasts she's been a guest on.",
  },
  about: {
    labels: ["About"],
    title: "About",
    description: "Queen Raae is Benedicte Raae, a developer in Oslo and co-captain of Lilly Labs.",
  },
  search: {
    labels: ["Search"],
    title: "Search the log",
    description: "Search every entry in Queen Raae's logbook.",
  },
} satisfies Record<string, { labels: string[]; title: string; description: string }>;

export type OgPage = keyof typeof OG_PAGES;

export function getOgPageImage(name: OgPage): string {
  const { title, description } = OG_PAGES[name];
  return getPageOgImageUrl(name, title, description);
}

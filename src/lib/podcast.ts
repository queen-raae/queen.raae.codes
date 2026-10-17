// Slow & Steady: discover the feed and listening links from the podcast's own
// site at build time, and pick the latest episode for the Treasures player.
// Every step is optional; if the network says no, the row renders without a player.

export const PODCAST_SITE = "https://slowandsteadypodcast.com/";
// The show's cover art, used as the play button
export const PODCAST_COVER =
  "https://img.transistorcdn.com/VJ7EWK9St1qy5IyaIOAWCNq1jUl1rR4LDhmb4MHXpqU/rs:fill:0:0:1/w:1400/h:1400/q:60/mb:500000/aHR0cHM6Ly9pbWct/dXBsb2FkLXByb2R1/Y3Rpb24udHJhbnNp/c3Rvci5mbS9zaG93/LzMzMjEvMTU2NDYw/MzU1MC1hcnR3b3Jr/LmpwZw.jpg";

export interface PodcastInfo {
  site: string;
  feed?: string;
  apple?: string;
  spotify?: string;
  latest?: {
    title: string;
    date: string;
    link?: string;
    audio?: string;
    duration?: string;
    cover?: string;
  };
}

let cached: Promise<PodcastInfo> | undefined;

async function fetchText(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  }
}

const decode = (s: string) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const tag = (xml: string, name: string) => {
  const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return match ? decode(match[1]) : undefined;
};

const attr = (xml: string, name: string, attribute: string) => {
  const match = new RegExp(`<${name}[^>]*\\s${attribute}="([^"]+)"`).exec(xml);
  return match ? decode(match[1]) : undefined;
};

function formatDuration(raw?: string) {
  if (!raw) return undefined;
  if (raw.includes(":")) {
    const parts = raw.split(":").map(Number);
    const seconds = parts.reduce((total, part) => total * 60 + part, 0);
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }
  const seconds = Number(raw);
  if (!isFinite(seconds)) return undefined;
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

async function load(): Promise<PodcastInfo> {
  const info: PodcastInfo = { site: PODCAST_SITE };
  const html = await fetchText(PODCAST_SITE);
  if (!html) return info;

  const feedMatch = /<link[^>]*type="application\/rss\+xml"[^>]*href="([^"]+)"/i.exec(html);
  info.feed = feedMatch ? new URL(decode(feedMatch[1]), PODCAST_SITE).toString() : undefined;
  info.apple = /https:\/\/podcasts\.apple\.com\/[^"'\s<]+/.exec(html)?.[0];
  info.spotify = /https:\/\/open\.spotify\.com\/show\/[^"'\s<]+/.exec(html)?.[0];

  if (!info.feed) return info;
  const xml = await fetchText(info.feed);
  if (!xml) return info;

  const item = /<item[\s>][\s\S]*?<\/item>/.exec(xml)?.[0];
  if (!item) return info;

  const pubDate = tag(item, "pubDate");
  const date = pubDate ? new Date(pubDate) : undefined;

  info.latest = {
    title: tag(item, "title") ?? "Latest episode",
    date:
      date && !isNaN(date.valueOf())
        ? date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
        : "",
    link: tag(item, "link"),
    audio: attr(item, "enclosure", "url"),
    duration: formatDuration(tag(item, "itunes:duration")),
    cover: attr(item, "itunes:image", "href") ?? attr(xml, "itunes:image", "href"),
  };

  return info;
}

export function getPodcastInfo(): Promise<PodcastInfo> {
  cached ??= load();
  return cached;
}

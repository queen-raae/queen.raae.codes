// Swap Transistor iframes (share.transistor.fm/e/<id>?#t=21:39) for our own tape player.
// The embed id is the same id as in the episode's mp3 address in the Slow & Steady feed,
// so the feed is read once per build to find the audio. When the iframe follows a quote,
// the player moves inside the quote, between the words and the "Me on" line.
// If the feed can't be reached, or the episode isn't in it, the iframe stays as it was.
import { visit } from "unist-util-visit";
import { raw } from "hast-util-raw";

const FEED = "https://feeds.transistor.fm/slow-steady";
const SITE = "https://slowandsteadypodcast.com/";

let episodes;

const decode = (s) =>
  s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();

const tag = (xml, name) => {
  const match = new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`).exec(xml);
  return match ? decode(match[1]) : undefined;
};

const pad = (n) => String(Math.floor(n)).padStart(2, "0");
const clock = (seconds) => `${pad(seconds / 60)}:${pad(seconds % 60)}`;

function toSeconds(raw) {
  if (!raw) return 0;
  const seconds = raw.split(":").reduce((total, part) => total * 60 + Number(part), 0);
  return isFinite(seconds) ? seconds : 0;
}

async function loadEpisodes() {
  const map = new Map();
  try {
    const response = await fetch(FEED, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) return map;
    const xml = await response.text();
    for (const item of xml.match(/<item[\s>][\s\S]*?<\/item>/g) ?? []) {
      const audio = /<enclosure[^>]*\surl="([^"]+)"/.exec(item)?.[1];
      const id = audio && /media\.transistor\.fm\/([a-z0-9]+)\//.exec(audio)?.[1];
      if (!id) continue;
      const number = tag(item, "itunes:episode");
      map.set(id, {
        audio: decode(audio),
        title: tag(item, "title") ?? "Slow & Steady",
        number,
        duration: toSeconds(tag(item, "itunes:duration")),
      });
    }
  } catch {
    // Fails soft: the iframes stay.
  }
  return map;
}

const el = (tagName, properties = {}, children = []) => ({ type: "element", tagName, properties, children });
const text = (value) => ({ type: "text", value });
const svg = (className, d) =>
  el("svg", { className: [className], width: "20", height: "20", viewBox: "0 0 20 20", ariaHidden: "true" }, [
    el("path", { d, fill: "currentColor" }),
  ]);

function player(episode, start) {
  const label = `Slow & Steady${episode.number ? ` ${episode.number}` : ""}: ${episode.title}`;
  const startPct = episode.duration ? (start / episode.duration) * 100 : 0;
  const bar = [el("div", { className: ["lp-fill"] })];
  if (start > 0 && episode.duration) {
    bar.push(el("div", { className: ["lp-mark"], style: `left:${startPct.toFixed(2)}%`, ariaHidden: "true" }));
  }
  bar.push(
    el("span", { className: ["lp-current", "mono"] }, [text(clock(start))]),
    el("span", { className: ["lp-duration", "mono"] }, [text(episode.duration ? clock(episode.duration) : "--:--")]),
  );
  return el(
    "div",
    {
      className: ["log-player", "lp-tape", "lp-episode"],
      dataSrc: episode.audio,
      dataStart: String(start),
      dataDuration: String(episode.duration || ""),
    },
    [
      el(
        "button",
        {
          type: "button",
          className: [
            "lp-play",
            "shrink-0",
            "text-ink",
            "inline-flex",
            "items-center",
            "justify-center",
            "cursor-pointer",
            "p-0",
            "bg-acid",
            "hover:bg-ink",
            "hover:text-cream",
          ],
          ariaLabel: `Play: ${label}`,
          dataLabel: label,
        },
        [svg("lp-icon-play", "M5 3l12 7-12 7z"), svg("lp-icon-pause hidden", "M4 3h4v14H4zM12 3h4v14h-4z")],
      ),
      el(
        "div",
        {
          className: ["lp-bar"],
          role: "slider",
          tabIndex: 0,
          ariaLabel: "Seek",
          ariaValueMin: "0",
          ariaValueMax: "100",
          ariaValueNow: String(Math.round(startPct)),
        },
        bar,
      ),
    ],
  );
}

const isBlank = (node) => node.type === "text" && !node.value.trim();

// Find the last <cite> in a quote, with the paragraph that holds it.
function findCite(blockquote) {
  let found;
  visit(blockquote, "element", (node, index, parent) => {
    if (node.tagName === "cite") found = { node, index, parent };
  });
  return found;
}

// Drop the trailing "↓" from the cite: the player now sits above it.
function dropArrow(cite) {
  const last = cite.children.at(-1);
  if (last?.type === "text") last.value = last.value.replace(/\s*↓\s*$/, "");
}

function placeInQuote(blockquote, playerNode) {
  const cite = findCite(blockquote);
  if (!cite) return false;
  dropArrow(cite.node);
  if (cite.parent === blockquote) {
    blockquote.children.splice(cite.index, 0, playerNode);
    return true;
  }
  // The cite sits at the end of the quote's last paragraph: lift it out, player between.
  const holderIndex = blockquote.children.indexOf(cite.parent);
  if (holderIndex === -1) return false;
  cite.parent.children.splice(cite.index, 1);
  while (cite.parent.children.length && isBlank(cite.parent.children.at(-1))) cite.parent.children.pop();
  const last = cite.parent.children.at(-1);
  if (last?.type === "element" && last.tagName === "br") cite.parent.children.pop();
  const lastText = cite.parent.children.at(-1);
  if (lastText?.type === "text") lastText.value = lastText.value.replace(/\s+$/, "");
  blockquote.children.splice(holderIndex + 1, 0, playerNode, cite.node);
  if (!cite.parent.children.length) blockquote.children.splice(holderIndex, 1);
  return true;
}

export default function rehypePodcastPlayer() {
  return async (tree) => {
    const found = [];
    // Markdown keeps hand-written HTML (the iframe, the <cite>) as raw strings at this point
    visit(tree, ["element", "raw"], (node, index, parent) => {
      const src =
        node.type === "raw"
          ? /^\s*<iframe[^>]*\ssrc="([^"]+)"/.exec(node.value)?.[1]
          : node.tagName === "iframe" && String(node.properties?.src ?? "");
      const match = src && /share\.transistor\.fm\/e\/([a-z0-9]+)(?:[^#]*#t=([\d:]+))?/.exec(src);
      if (match && parent) found.push({ node, parent, id: match[1], start: toSeconds(match[2]) });
    });
    if (!found.length) return;

    episodes ??= loadEpisodes();
    const map = await episodes;

    for (const { node, parent, id, start } of found) {
      const episode = map.get(id);
      if (!episode) continue;
      const playerNode = player(episode, start);
      const index = parent.children.indexOf(node);

      let prev = index - 1;
      while (prev >= 0 && isBlank(parent.children[prev])) prev--;
      const before = parent.children[prev];
      if (before?.type === "element" && before.tagName === "blockquote") {
        // Parse the quote's raw HTML so the <cite> is a real element we can move
        const quote = raw(before);
        if (placeInQuote(quote, playerNode)) {
          parent.children[prev] = quote;
          parent.children.splice(index, 1);
          continue;
        }
      }
      parent.children.splice(index, 1, playerNode);
    }
  };
}

import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// ── Author config ─────────────────────────────────────────────────
// Every card has a column with the author's photo; guests also get their name and a label.
// `focus` is Sharp's crop position for the tall column crop (default: attention)
export const AUTHOR_CONFIG: Record<string, { name: string; photo: string; guest?: boolean; focus?: string }> = {
  Queen: {
    name: "Queen Raae",
    photo: "src/assets/og/queen-avatar.jpg",
    focus: "centre",
  },
  OlaVea: {
    name: "Cap'n Ola",
    photo: "src/assets/og/olavea-avatar.jpg",
    guest: true,
  },
  JeanClaw2026: {
    name: "Jean-Claw",
    photo: "src/assets/og/jeanclaw-avatar.jpg",
    guest: true,
  },
};

// What shows around the page: a flat pale rust frame, or Queen's gallery wall photo
const OUTER_FRAME: "panel" | "photo" = "panel";
const WALL_PHOTO = "src/assets/log/queen-wall.jpg";

// ── Design constants (Organic Brutalist tokens from src/global.css) ─
const WIDTH = 1200;
const HEIGHT = 628;
const FRAME = 52; // how much of the frame shows around the page
const COLUMN = 300; // the author column on the right
const PAGE_HEIGHT = HEIGHT - 2 * FRAME - 4; // inside the page's 2px border

const CREAM = "#fdf6ec";
const INK = "#3d1230";
const ACID = "#fbbf24";
const PANEL = "#f3d7c6";

// Bump when the card design changes so social caches pick up new images
export const DESIGN_VERSION = "column-3";

// ── Cached assets (loaded once per build) ─────────────────────────
const fontsDir = path.resolve(process.cwd(), "node_modules/@fontsource");
const readFont = (file: string) => fs.readFileSync(path.join(fontsDir, file));

let fonts: { name: string; data: Buffer; weight: 400 | 700; style: "normal" }[] | null = null;
const photoCache = new Map<string, string>();

function loadFonts() {
  if (!fonts) {
    fonts = [
      {
        name: "Archivo Black",
        data: readFont("archivo-black/files/archivo-black-latin-400-normal.woff"),
        weight: 400,
        style: "normal",
      },
      {
        name: "Space Mono",
        data: readFont("space-mono/files/space-mono-latin-700-normal.woff"),
        weight: 700,
        style: "normal",
      },
      { name: "Lora", data: readFont("lora/files/lora-latin-400-normal.woff"), weight: 400, style: "normal" },
    ];
  }
  return fonts;
}

// Crop a photo once per build, so Satori only has to place it
async function getPhotoDataUri(file: string, width = WIDTH, height = HEIGHT, position = "attention"): Promise<string> {
  const key = `${file}@${width}x${height}@${position}`;
  if (photoCache.has(key)) return photoCache.get(key)!;
  const buf = await sharp(path.resolve(process.cwd(), file))
    .resize(width, height, { fit: "cover", position })
    .jpeg({ quality: 82 })
    .toBuffer();
  const uri = `data:image/jpeg;base64,${buf.toString("base64")}`;
  photoCache.set(key, uri);
  return uri;
}

// ── Emoji support (Twemoji SVGs via Satori's loadAdditionalAsset) ─
const U200D = String.fromCharCode(8205);
const UFE0Fg = /️/g;

function toCodePoint(unicodeSurrogates: string): string {
  const r: string[] = [];
  let c = 0,
    p = 0,
    i = 0;
  while (i < unicodeSurrogates.length) {
    c = unicodeSurrogates.charCodeAt(i++);
    if (p) {
      r.push((65536 + ((p - 55296) << 10) + (c - 56320)).toString(16));
      p = 0;
    } else if (55296 <= c && c <= 56319) {
      p = c;
    } else {
      r.push(c.toString(16));
    }
  }
  return r.join("-");
}

function getIconCode(char: string): string {
  return toCodePoint(char.indexOf(U200D) < 0 ? char.replace(UFE0Fg, "") : char);
}

const emojiCache = new Map<string, string>();

async function loadEmoji(code: string): Promise<string> {
  if (emojiCache.has(code)) return emojiCache.get(code)!;
  const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code.toLowerCase()}.svg`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Failed to fetch emoji SVG for ${code}: HTTP ${res.status}`);
      return "";
    }
    const svg = await res.text();
    emojiCache.set(code, svg);
    return svg;
  } catch (err) {
    console.warn(`Failed to fetch emoji SVG for ${code}:`, err);
    return "";
  }
}

// ── Text truncation (Satori has no line-clamp) ────────────────────
function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const truncated = text.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "…";
}

// ── Deterministic image path for a post slug ──────────────────────
export function getOgImagePath(slug: string): string {
  const name = slug.replace(/^\/|\/$/g, "");
  return `/og/${name}.png`;
}

// ── Cache-busting URL (hash changes when title/description/design change) ─
export function getOgImageUrl(slug: string, title: string, description: string): string {
  const hash = createHash("md5").update(`${DESIGN_VERSION}|${title}|${description}`).digest("hex").slice(0, 8);
  return `${getOgImagePath(slug)}?v=${hash}`;
}

// ── Tiny VDOM helpers for Satori ──────────────────────────────────
type Node = { type: string; props: Record<string, any> };

const el = (style: Record<string, any>, children?: any): Node => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children },
});

const label = (text: string, background: string, fontSize = "20px"): Node =>
  el(
    {
      fontFamily: "Space Mono",
      fontWeight: 700,
      fontSize,
      letterSpacing: "2px",
      textTransform: "uppercase",
      background,
      color: INK,
      padding: "4px 12px",
    },
    text,
  );

// Shorter titles get bigger type; the page column is ~690px wide
function titleSize(title: string): number {
  if (title.length <= 12) return 92;
  if (title.length <= 34) return 62;
  if (title.length <= 60) return 54;
  return 46;
}

// ── The card: a cream page with an author column, inside a frame ──
async function renderCard(options: {
  labels: string[];
  title: string;
  description: string;
  author: string;
  guestLabel?: boolean; // "Guest post" above the name; off on author pages
}): Promise<Buffer> {
  const config = AUTHOR_CONFIG[options.author] || AUTHOR_CONFIG.Queen;
  const wall = OUTER_FRAME === "photo" ? await getPhotoDataUri(WALL_PHOTO) : null;
  // Queen's photo fills the column; a guest's is square with their name below
  const photoWidth = COLUMN - 2;
  const photoHeight = config.guest ? photoWidth : PAGE_HEIGHT;
  const photo = await getPhotoDataUri(config.photo, photoWidth, photoHeight, config.focus);

  const page = el({ flex: 1, flexDirection: "column", padding: "40px 48px 36px 56px" }, [
    el(
      { gap: "12px" },
      options.labels.map((text, i) => label(text, i === 0 ? ACID : PANEL)),
    ),
    el({ flex: 1, flexDirection: "column", justifyContent: "center" }, [
      el(
        {
          fontFamily: "Archivo Black",
          fontSize: `${titleSize(options.title)}px`,
          lineHeight: 1.06,
          letterSpacing: "-1px",
          textWrap: "balance",
        },
        options.title,
      ),
      options.description
        ? el({ fontFamily: "Lora", fontSize: "23px", lineHeight: 1.4, marginTop: "18px" }, options.description)
        : null,
    ]),
    el(
      {
        borderTop: `2px solid ${INK}`,
        paddingTop: "16px",
        fontFamily: "Space Mono",
        fontWeight: 700,
        fontSize: "22px",
      },
      "queen.raae.codes",
    ),
  ]);

  const column = el({ width: `${COLUMN}px`, flexDirection: "column", borderLeft: `2px solid ${INK}` }, [
    {
      type: "img",
      props: {
        src: photo,
        width: photoWidth,
        height: photoHeight,
        style: {
          width: `${photoWidth}px`,
          height: `${photoHeight}px`,
          borderBottom: config.guest ? `2px solid ${INK}` : "none",
        },
      },
    },
    config.guest
      ? el(
          {
            flex: 1,
            flexDirection: "column",
            justifyContent: "center",
            gap: "12px",
            padding: "0 28px",
            background: PANEL,
          },
          [
            options.guestLabel !== false ? el({ alignSelf: "flex-start" }, [label("Guest post", ACID, "16px")]) : null,
            el({ fontFamily: "Archivo Black", fontSize: "32px", lineHeight: 1 }, config.name),
          ],
        )
      : null,
  ]);

  const markup = el({ position: "relative", width: `${WIDTH}px`, height: `${HEIGHT}px`, background: PANEL }, [
    // Photo first so the page paints on top (SVG paint order = DOM order)
    wall && {
      type: "img",
      props: {
        src: wall,
        width: WIDTH,
        height: HEIGHT,
        style: { position: "absolute", top: 0, left: 0, width: `${WIDTH}px`, height: `${HEIGHT}px` },
      },
    },
    el(
      {
        position: "absolute",
        top: `${FRAME}px`,
        left: `${FRAME}px`,
        right: `${FRAME}px`,
        bottom: `${FRAME}px`,
        background: CREAM,
        border: `2px solid ${INK}`,
        color: INK,
      },
      [page, column],
    ),
  ]);

  const svg = await satori(markup as any, {
    width: WIDTH,
    height: HEIGHT,
    fonts: loadFonts(),
    loadAdditionalAsset: async (code: string, segment: string) => {
      if (code === "emoji") {
        return `data:image/svg+xml;base64,${Buffer.from(await loadEmoji(getIconCode(segment))).toString("base64")}`;
      }
      return code;
    },
  });

  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Log entry card ────────────────────────────────────────────────
export async function generateOgImage(options: {
  title: string;
  description: string;
  author: string;
  type?: string;
  date?: string;
}): Promise<Buffer> {
  return renderCard({
    labels: [options.type || "Log", options.date].filter(Boolean) as string[],
    title: truncateText(options.title, 80),
    description: truncateText(options.description, 140),
    author: options.author,
  });
}

// ── Author card ───────────────────────────────────────────────────
export async function generateAuthorOgImage(options: {
  title: string;
  description: string;
  authorKey: string;
}): Promise<Buffer> {
  return renderCard({
    labels: ["Author"],
    title: options.title,
    description: truncateText(options.description, 140),
    author: options.authorKey,
    guestLabel: false,
  });
}

// ── Page card (home, archive, tags…) — always Queen's column ──────
export async function generatePageOgImage(options: {
  labels: string[];
  title: string;
  description: string;
}): Promise<Buffer> {
  return renderCard({
    labels: options.labels,
    title: truncateText(options.title, 80),
    description: truncateText(options.description, 140),
    author: "Queen",
  });
}

// Page card URL with the same cache busting as entry cards
export function getPageOgImageUrl(name: string, title: string, description: string): string {
  return getOgImageUrl(`page/${name}`, title, description);
}

// Tag pages: same description as the page itself, and a cache-busted card URL
export function getTagOgDescription(label: string, blurb?: string): string {
  return blurb || `Every entry in the log tagged #${label}.`;
}

export function getTagOgImageUrl(tagParam: string, label: string, description: string): string {
  return getOgImageUrl(`tag/${tagParam}`, `#${label}`, description);
}

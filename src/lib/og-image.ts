import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// ── Author config ─────────────────────────────────────────────────
// Guests get a small avatar by their byline; Queen's own cards don't need one.
export const AUTHOR_CONFIG: Record<string, { byline: string; avatar?: string }> = {
  Queen: {
    byline: "👑 Queen Raae",
  },
  OlaVea: {
    byline: "🏴‍☠️ Cap'n Ola",
    avatar: "src/assets/og/olavea-avatar.jpg",
  },
  JeanClaw2026: {
    byline: "🦀 Jean-Claw",
    avatar: "src/assets/og/jeanclaw-avatar.jpg",
  },
};

// Queen's photo shows as a frame around her cards
const QUEEN_PHOTO = "src/assets/log/queen-wall.jpg";

// What frames a guest's card: Queen's photo, or a flat colour
export type GuestFrame = "photo" | "plum" | "panel";
const GUEST_FRAME: GuestFrame = "photo";

// ── Design constants (Organic Brutalist tokens from src/global.css) ─
const WIDTH = 1200;
const HEIGHT = 628;
const FRAME = 52; // how much of the photo shows around the page
const AVATAR = 56;
const CREAM = "#fdf6ec";
const INK = "#3d1230";
const ACID = "#fbbf24";
const PANEL = "#f3d7c6";

// Bump when the card design changes so social caches pick up new images
const DESIGN_VERSION = "frame-1";

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
async function getPhotoDataUri(file: string, width = WIDTH, height = HEIGHT): Promise<string> {
  const key = `${file}@${width}x${height}`;
  if (photoCache.has(key)) return photoCache.get(key)!;
  const buf = await sharp(path.resolve(process.cwd(), file))
    .resize(width, height, { fit: "cover", position: "attention" })
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

const label = (text: string, background: string): Node =>
  el(
    {
      fontFamily: "Space Mono",
      fontWeight: 700,
      fontSize: "20px",
      letterSpacing: "2px",
      textTransform: "uppercase",
      background,
      color: INK,
      padding: "4px 12px",
    },
    text,
  );

// ── The card: a cream page inset in the author's photo ────────────
async function renderCard(options: {
  labels: string[];
  title: string;
  description: string;
  author: string;
  guestFrame?: GuestFrame;
}): Promise<Buffer> {
  const config = AUTHOR_CONFIG[options.author] || AUTHOR_CONFIG.Queen;
  const frame = config.avatar ? options.guestFrame || GUEST_FRAME : "photo";
  const photo = frame === "photo" ? await getPhotoDataUri(QUEEN_PHOTO) : null;
  const avatar = config.avatar ? await getPhotoDataUri(config.avatar, AVATAR, AVATAR) : null;
  const titleSize = options.title.length > 48 ? 54 : 64;

  const background = frame === "plum" ? INK : frame === "panel" ? PANEL : CREAM;
  const markup = el({ position: "relative", width: `${WIDTH}px`, height: `${HEIGHT}px`, background }, [
    // Photo first so the page paints on top (SVG paint order = DOM order)
    photo && {
      type: "img",
      props: {
        src: photo,
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
        flexDirection: "column",
        background: CREAM,
        border: `2px solid ${INK}`,
        padding: "44px 56px 36px",
        color: INK,
      },
      [
        el(
          { gap: "12px" },
          options.labels.map((text, i) => label(text, i === 0 ? ACID : PANEL)),
        ),
        el({ flex: 1, flexDirection: "column", justifyContent: "center" }, [
          el(
            {
              fontFamily: "Archivo Black",
              fontSize: `${titleSize}px`,
              lineHeight: 1.08,
              letterSpacing: "-1px",
              textWrap: "balance",
            },
            options.title,
          ),
          options.description
            ? el(
                { fontFamily: "Lora", fontSize: "24px", lineHeight: 1.4, marginTop: "20px", maxWidth: "900px" },
                options.description,
              )
            : null,
        ]),
        el(
          {
            borderTop: `2px solid ${INK}`,
            paddingTop: "16px",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Space Mono",
            fontWeight: 700,
            fontSize: "22px",
          },
          [
            el({}, "queen.raae.codes"),
            el({ alignItems: "center", gap: "14px" }, [
              avatar && {
                type: "img",
                props: {
                  src: avatar,
                  width: AVATAR,
                  height: AVATAR,
                  style: { width: `${AVATAR}px`, height: `${AVATAR}px`, border: `2px solid ${INK}` },
                },
              },
              el({}, config.byline),
            ]),
          ],
        ),
      ],
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
  guestFrame?: GuestFrame;
}): Promise<Buffer> {
  return renderCard({
    guestFrame: options.guestFrame,
    labels: [options.type || "Log", options.date].filter(Boolean) as string[],
    title: truncateText(options.title, 90),
    description: truncateText(options.description, 160),
    author: options.author,
  });
}

// ── Author card (same frame, "Author" label) ──────────────────────
export async function generateAuthorOgImage(options: {
  title: string;
  description: string;
  authorKey: string;
}): Promise<Buffer> {
  return renderCard({
    labels: ["Author"],
    title: options.title,
    description: truncateText(options.description, 160),
    author: options.authorKey,
  });
}

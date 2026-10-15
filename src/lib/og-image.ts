import satori from "satori";
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

// ── Royal Brutalism v3 share images (1200×628) ────────────────────
// Cream page with the orangered stripe of the site header on top and the ink
// footer band (plum rule) of the site footer at the bottom. Montserrat Black
// titles, Newsreader excerpts, JetBrains Mono labels. Square corners, no
// shadows, only palette colours. Authors are told apart by emoji alone.

// ── Authors: name + emoji sigil (no photos, no per-author colours) ─
export const AUTHOR_CONFIG: Record<string, { name: string; emoji: string }> = {
  Queen: { name: "Queen Raae", emoji: "👑" },
  OlaVea: { name: "Cap'n Ola", emoji: "🏴‍☠️" },
  JeanClaw2026: { name: "Jean-Claw", emoji: "🦀" },
};

const CREW_LINE = Object.values(AUTHOR_CONFIG)
  .map(({ name, emoji }) => `${name} ${emoji}`)
  .join(" · ");

// ── Design tokens (the v3 palette, nothing else) ──────────────────
const COLOR = {
  cream: "#fdf6ec",
  ink: "#3d1230",
  plum: "#7b2d5e",
  plumFaded: "#9b4d7e",
  blush: "#f0c4d8",
  orangered: "#ff4500",
  goldDeep: "#d97706",
};

const WIDTH = 1200;
const HEIGHT = 628;
const PAD_X = 64;
const STRIPE_HEIGHT = 20; // orangered stripe, like the site header
const BAND_HEIGHT = 104; // ink footer band incl. its 8px plum rule
const CONTENT_WIDTH = WIDTH - PAD_X * 2;

const SITE_NAME = "queen.raae.codes";
const TITLE_SIZES = [104, 96, 88, 80, 72, 64, 58, 52, 48];
const TITLE_MAX_HEIGHT = 240;
const EXCERPT_SIZE = 32;

// Bump when the look changes so shared links refresh (see getOgImageUrl)
const OG_DESIGN_VERSION = "v3";

// ── Cached assets (loaded once per build) ─────────────────────────
const assetsDir = path.resolve(process.cwd(), "src/assets/og");

type Font = { name: string; data: Buffer; weight: 500 | 700 | 900; style: "normal" | "italic" };
let fontsCache: Font[] | null = null;

function getFonts(): Font[] {
  if (!fontsCache) {
    const read = (file: string) => fs.readFileSync(path.join(assetsDir, file));
    fontsCache = [
      { name: "Montserrat", data: read("Montserrat-Black.ttf"), weight: 900, style: "normal" },
      { name: "Newsreader", data: read("Newsreader-MediumItalic.woff"), weight: 500, style: "italic" },
      { name: "JetBrains Mono", data: read("JetBrainsMono-Bold.woff"), weight: 700, style: "normal" },
    ];
  }
  return fontsCache;
}

// ── Emoji support (Twemoji SVGs via Satori's loadAdditionalAsset) ─
// The author sigils ship in src/assets/og/emoji so they never depend on the
// network; any other emoji (e.g. in a post title) is fetched from the CDN.
// Twemoji graphics © Twitter, Inc. and other contributors, CC-BY 4.0.
const U200D = String.fromCharCode(8205);
const UFE0Fg = /\uFE0F/g;

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

const svgDataUri = (svg: string) => `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const BLANK_IMAGE = svgDataUri('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>');

const emojiCache = new Map<string, string>();

function readBundledEmoji(code: string): string | null {
  const file = path.join(assetsDir, "emoji", `${code.toLowerCase()}.svg`);
  return fs.existsSync(file) ? svgDataUri(fs.readFileSync(file, "utf8")) : null;
}

async function loadEmoji(code: string): Promise<string> {
  const cached = emojiCache.get(code);
  if (cached) return cached;

  let uri = readBundledEmoji(code);
  if (!uri) {
    const url = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${code.toLowerCase()}.svg`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        uri = svgDataUri(await res.text());
      } else {
        console.warn(`Failed to fetch emoji SVG for ${code}: HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`Failed to fetch emoji SVG for ${code}:`, err);
    }
  }

  // Cache misses too: a blank is better than a build that retries 260 times
  uri = uri ?? BLANK_IMAGE;
  emojiCache.set(code, uri);
  return uri;
}

const loadAdditionalAsset = async (languageCode: string, segment: string): Promise<string> =>
  languageCode === "emoji" ? loadEmoji(getIconCode(segment)) : BLANK_IMAGE;

// ── Tiny node helpers for Satori's React-element-like objects ─────
type Style = Record<string, string | number>;
type OgNode = { type: string; props: Record<string, unknown> };
type Children = OgNode | OgNode[] | string | undefined;

const box = (style: Style, children?: Children): OgNode => ({
  type: "div",
  props: { style: { display: "flex", ...style }, children },
});
const column = (style: Style, children?: Children): OgNode => box({ flexDirection: "column", ...style }, children);
const text = (style: Style, children: string): OgNode => ({ type: "div", props: { style, children } });
const image = (src: string, size: number): OgNode => ({
  type: "img",
  props: { src, width: size, height: size, style: { width: `${size}px`, height: `${size}px` } },
});

// JetBrains Mono caps label (site name, author line, date, kicker)
const mono = (size: number, color: string, extra: Style = {}): Style => ({
  fontFamily: "JetBrains Mono",
  fontWeight: 700,
  fontSize: `${size}px`,
  lineHeight: 1.3,
  color,
  textTransform: "uppercase",
  letterSpacing: `${(size * 0.08).toFixed(2)}px`,
  ...extra,
});

// Newsreader italic: excerpts, leads and the little "by"
const serif = (size: number, color: string, extra: Style = {}): Style => ({
  fontFamily: "Newsreader",
  fontStyle: "italic",
  fontWeight: 500,
  fontSize: `${size}px`,
  lineHeight: 1.35,
  color,
  ...extra,
});

// Montserrat Black, tight tracking
const heading = (size: number, extra: Style = {}): Style => ({
  fontFamily: "Montserrat",
  fontWeight: 900,
  fontSize: `${size}px`,
  lineHeight: 1,
  letterSpacing: `${(-0.03 * size).toFixed(2)}px`,
  color: COLOR.ink,
  ...extra,
});

// Fleur-de-lis from the design system, drawn on a 24px grid
const LILY = svgDataUri(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${COLOR.goldDeep}">` +
    '<path d="M12 1l3.5 6-2 6h-3l-2-6z"/><path d="M10 13L6 6 1.5 8v4.5L5 11l2.5 2z"/>' +
    '<path d="M14 13l4-7 4.5 2v4.5L19 11l-2.5 2z"/><rect x="6" y="13.5" width="12" height="2.5"/>' +
    '<path d="M10.5 16.5h3L12 22z"/><path d="M7 16.5h3L6 21l-2.5-1.5z"/><path d="M17 16.5h-3l4 4.5 2.5-1.5z"/></svg>',
);

// An emoji as a crisp image; falls back to a text emoji (CDN) if it isn't bundled
function sigil(emoji: string, size: number): OgNode {
  const uri = readBundledEmoji(getIconCode(emoji));
  return uri ? image(uri, size) : text({ fontSize: `${size}px`, lineHeight: 1 }, emoji);
}

// A square blush tile with an emoji in it (square corners, 4px ink edge)
const tile = (emoji: string, size: number, emojiSize: number): OgNode =>
  box(
    {
      width: `${size}px`,
      height: `${size}px`,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: COLOR.blush,
      border: `4px solid ${COLOR.ink}`,
    },
    sigil(emoji, emojiSize),
  );

// ── Page frame: orangered stripe · content · ink band ─────────────
const stripe = (): OgNode =>
  box({ width: "100%", height: `${STRIPE_HEIGHT}px`, flexShrink: 0, backgroundColor: COLOR.orangered });

const siteLabel = (): OgNode[] => [image(LILY, 30), text(mono(24, COLOR.orangered), SITE_NAME)];

function band(left: OgNode[], right: OgNode[] = siteLabel()): OgNode {
  return box(
    {
      height: `${BAND_HEIGHT}px`,
      flexShrink: 0,
      alignItems: "center",
      justifyContent: "space-between",
      padding: `0 ${PAD_X}px`,
      backgroundColor: COLOR.ink,
      borderTop: `8px solid ${COLOR.plum}`,
    },
    [box({ alignItems: "center", gap: "16px" }, left), box({ alignItems: "center", gap: "14px" }, right)],
  );
}

// `content` is the cream area between stripe and band
const content = (style: Style, children: Children): OgNode =>
  box({ flex: 1, padding: `40px ${PAD_X}px 24px`, overflow: "hidden", ...style }, children);

const kicker = (parts: string[]): OgNode =>
  box(
    { alignItems: "center", gap: "12px" },
    parts
      .filter(Boolean)
      .flatMap((part, i) => [
        ...(i > 0 ? [text(mono(22, COLOR.goldDeep), "/")] : []),
        text(mono(22, COLOR.plumFaded), part),
      ]),
  );

function frame(body: OgNode, bandLeft: OgNode[]): OgNode {
  return column({ width: `${WIDTH}px`, height: `${HEIGHT}px`, backgroundColor: COLOR.cream }, [
    stripe(),
    body,
    band(bandLeft),
  ]);
}

// ── Text helpers ──────────────────────────────────────────────────
// Drop invisible characters and the lone surrogate left when an excerpt was cut
// in the middle of an emoji, and collapse whitespace
const clean = (s: string) =>
  s
    .replace(/[\u200B\u2060\uFEFF]/g, "")
    .replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();

function truncateText(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  const truncated = s.substring(0, maxChars);
  const lastSpace = truncated.lastIndexOf(" ");
  return (lastSpace > 0 ? truncated.substring(0, lastSpace) : truncated) + "…";
}

// Lay text out with Satori itself (layout only, nothing is drawn) and return its height
async function measure(content: string, style: Style, width: number): Promise<number> {
  let height = 0;
  await satori(
    {
      type: "div",
      props: {
        style: { display: "flex", width: `${width}px` },
        children: text({ ...style, display: "block", width: `${width}px` }, content),
      },
    } as any,
    {
      width,
      height: HEIGHT * 2,
      fonts: getFonts(),
      embedFont: false,
      loadAdditionalAsset,
      onNodeDetected: (node) => {
        if ((node.props?.style as Style | undefined)?.fontSize === style.fontSize) height = node.height;
      },
    },
  );
  return height;
}

// Width of the widest word at a 100px headline size: a line can't be narrower
// than that, and it scales linearly with the font size
async function widestWordAt100(title: string): Promise<number> {
  let widest = 0;
  await satori(
    {
      type: "div",
      props: {
        style: { display: "flex", width: "4000px" },
        children: title.split(" ").map((word) => text({ ...heading(100), display: "flex", flexShrink: 0 }, word)),
      },
    } as any,
    {
      width: 4000,
      height: HEIGHT,
      fonts: getFonts(),
      embedFont: false,
      loadAdditionalAsset,
      onNodeDetected: (node) => {
        if ((node.props?.style as Style | undefined)?.fontSize === "100px") widest = Math.max(widest, node.width);
      },
    },
  );
  return widest;
}

// Pick the largest headline size whose wrapped text fits the budget (and whose
// longest word fits on a line). If even the smallest size doesn't fit, drop
// trailing words until it does.
async function fitHeadline(
  title: string,
  {
    width,
    maxLines,
    sizes = TITLE_SIZES,
    maxHeight = TITLE_MAX_HEIGHT,
  }: { width: number; maxLines: number; sizes?: number[]; maxHeight?: number },
): Promise<{ title: string; size: number }> {
  const fits = (height: number, size: number) => height <= maxHeight && height <= size * maxLines + 1;
  const widest = await widestWordAt100(title);

  for (const size of sizes) {
    if ((widest * size) / 100 > width) continue;
    if (fits(await measure(title, heading(size), width), size)) return { title, size };
  }

  const size = sizes[sizes.length - 1];
  const words = title.split(" ");
  while (words.length > 1) {
    words.pop();
    const shortened = `${words.join(" ")}…`;
    if (fits(await measure(shortened, heading(size), width), size)) return { title: shortened, size };
  }
  return { title: words[0] ?? "", size };
}

// Cut an excerpt at a word so it fits `maxLines` lines and ends with an ellipsis
// (Satori's own line clamp would cut in the middle of a word)
async function fitExcerpt(excerpt: string, { width, maxLines }: { width: number; maxLines: number }): Promise<string> {
  const style = serif(EXCERPT_SIZE, COLOR.plum);
  const limit = EXCERPT_SIZE * Number(style.lineHeight) * maxLines + 1;
  if ((await measure(excerpt, style, width)) <= limit) return excerpt;

  const words = excerpt.split(" ");
  const ellipsize = (count: number) =>
    `${words
      .slice(0, count)
      .join(" ")
      .replace(/[\s.,;:–—-]+$/, "")}…`;
  let fitting = 1;
  let tooLong = words.length;
  while (fitting + 1 < tooLong) {
    const mid = Math.floor((fitting + tooLong) / 2);
    if ((await measure(ellipsize(mid), style, width)) <= limit) fitting = mid;
    else tooLong = mid;
  }
  return ellipsize(fitting);
}

// ── Deterministic image path for a post slug ──────────────────────
export function getOgImagePath(slug: string): string {
  const name = slug.replace(/^\/|\/$/g, "");
  return `/og/${name}.png`;
}

// ── Cache-busting URL (hash changes when title/description or the design change)
export function getOgImageUrl(slug: string, title: string, description: string): string {
  const hash = createHash("md5").update(`${OG_DESIGN_VERSION}|${title}|${description}`).digest("hex").slice(0, 8);
  return `${getOgImagePath(slug)}?v=${hash}`;
}

// ── SVG → PNG ─────────────────────────────────────────────────────
async function render(tree: OgNode): Promise<Buffer> {
  const svg = await satori(tree as any, {
    width: WIDTH,
    height: HEIGHT,
    fonts: getFonts(),
    loadAdditionalAsset,
  });
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

// ── Post OG image ─────────────────────────────────────────────────
export async function generateOgImage(options: {
  title: string;
  description: string;
  author: string;
  date?: string;
}): Promise<Buffer> {
  const author = AUTHOR_CONFIG[options.author] || AUTHOR_CONFIG.Queen;
  const fitted = await fitHeadline(truncateText(clean(options.title), 200), { width: CONTENT_WIDTH, maxLines: 4 });
  const description = await fitExcerpt(truncateText(clean(options.description), 400), {
    width: CONTENT_WIDTH,
    maxLines: 2,
  });

  return render(
    frame(
      content({ flexDirection: "column" }, [
        kicker(["Posts", options.date ? clean(options.date) : ""]),
        text(heading(fitted.size, { display: "block", marginTop: "22px", textWrap: "balance" }), fitted.title),
        ...(description
          ? [text(serif(EXCERPT_SIZE, COLOR.plum, { display: "block", marginTop: "22px", lineClamp: 2 }), description)]
          : []),
      ]),
      [sigil(author.emoji, 52), text(serif(EXCERPT_SIZE, COLOR.blush), "by"), text(mono(28, COLOR.cream), author.name)],
    ),
  );
}

// ── Author OG image: the emoji is the portrait ────────────────────
export async function generateAuthorOgImage(options: {
  title: string;
  description: string;
  authorKey: string;
}): Promise<Buffer> {
  const author = AUTHOR_CONFIG[options.authorKey] || AUTHOR_CONFIG.Queen;
  const TILE = 340;
  const GAP = 48;
  const columnWidth = CONTENT_WIDTH - TILE - GAP;

  // The tile carries the emoji, so a trailing emoji in the title is dropped
  const name = clean(options.title).replace(/[\s\p{Extended_Pictographic}\u200D\uFE0F]+$/u, "") || author.name;
  const fitted = await fitHeadline(name, { width: columnWidth, maxLines: 1, sizes: [104, 96, 88, 80, 72, 64, 56] });
  const description = await fitExcerpt(truncateText(clean(options.description), 400), {
    width: columnWidth,
    maxLines: 4,
  });

  return render(
    frame(
      content({ alignItems: "center", gap: `${GAP}px` }, [
        column({ flex: 1 }, [
          kicker(["Author"]),
          text(heading(fitted.size, { display: "block", marginTop: "22px" }), fitted.title),
          text(serif(EXCERPT_SIZE, COLOR.plum, { display: "block", marginTop: "22px", lineClamp: 4 }), description),
        ]),
        tile(author.emoji, TILE, 210),
      ]),
      [text(mono(22, COLOR.cream), CREW_LINE)],
    ),
  );
}

// ── Quiz OG image: Queen vs Jean-Claw ─────────────────────────────
export async function generateQuizOgImage(): Promise<Buffer> {
  const TILE = 200;
  const tilesWidth = TILE * 2 + 20 * 2 + 44;
  const GAP = 40;
  const columnWidth = CONTENT_WIDTH - tilesWidth - GAP;
  const fitted = await fitHeadline("Who said it?", {
    width: columnWidth,
    maxLines: 1,
    sizes: [104, 96, 88, 80, 72, 64],
  });

  return render(
    frame(
      content({ alignItems: "center", gap: `${GAP}px` }, [
        column({ flex: 1 }, [
          kicker(["Quiz Game"]),
          text(heading(fitted.size, { display: "block", marginTop: "22px" }), fitted.title),
          text(
            heading(44, { display: "block", marginTop: "20px", letterSpacing: "-1.3px" }),
            "Queen vs Jean-Claw (AI)",
          ),
          text(serif(38, COLOR.plum, { display: "block", marginTop: "18px" }), "Can you tell the difference?"),
        ]),
        box({ alignItems: "center", gap: "20px" }, [
          tile(AUTHOR_CONFIG.Queen.emoji, TILE, 124),
          text(mono(28, COLOR.ink), "vs"),
          tile(AUTHOR_CONFIG.JeanClaw2026.emoji, TILE, 124),
        ]),
      ]),
      [text(mono(22, COLOR.cream), CREW_LINE)],
    ),
  );
}

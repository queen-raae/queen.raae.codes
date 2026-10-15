/** @type {import('tailwindcss').Config} */
const INK = "#3d1230";
const PLUM = "#7b2d5e";
const PLUM_FADED = "#9b4d7e";
const BLUSH = "#f0c4d8";
const PLUM_TINT = "#f8e8f0";
const ORANGERED = "#ff4500";
const EMBER = "#c23400";
const GOLD = "#fbbf24";
const LILY =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23d97706'%3E%3Cpath d='M12 1l3.5 6-2 6h-3l-2-6z'/%3E%3Cpath d='M10 13L6 6 1.5 8v4.5L5 11l2.5 2z'/%3E%3Cpath d='M14 13l4-7 4.5 2v4.5L19 11l-2.5 2z'/%3E%3Crect x='6' y='13.5' width='12' height='2.5'/%3E%3Cpath d='M10.5 16.5h3L12 22z'/%3E%3Cpath d='M7 16.5h3L6 21l-2.5-1.5z'/%3E%3Cpath d='M17 16.5h-3l4 4.5 2.5-1.5z'/%3E%3C/svg%3E\")";

module.exports = {
  theme: {
    extend: {
      typography: () => ({
        brown: {
          css: {
            "--tw-prose-body": INK,
            "--tw-prose-headings": INK,
            "--tw-prose-lead": PLUM,
            "--tw-prose-links": INK,
            "--tw-prose-bold": INK,
            "--tw-prose-counters": EMBER,
            "--tw-prose-bullets": "#d97706",
            "--tw-prose-hr": INK,
            "--tw-prose-quotes": PLUM,
            "--tw-prose-quote-borders": INK,
            "--tw-prose-captions": PLUM_FADED,
            "--tw-prose-code": INK,
            "--tw-prose-pre-code": PLUM_TINT,
            "--tw-prose-pre-bg": INK,
            "--tw-prose-th-borders": INK,
            "--tw-prose-td-borders": BLUSH,
            "--tw-prose-invert-body": BLUSH,
            "--tw-prose-invert-headings": "#ffffff",
            "--tw-prose-invert-lead": BLUSH,
            "--tw-prose-invert-links": "#ffffff",
            "--tw-prose-invert-bold": "#ffffff",
            "--tw-prose-invert-counters": GOLD,
            "--tw-prose-invert-bullets": GOLD,
            "--tw-prose-invert-hr": PLUM_FADED,
            "--tw-prose-invert-quotes": PLUM_TINT,
            "--tw-prose-invert-quote-borders": PLUM_FADED,
            "--tw-prose-invert-captions": BLUSH,
            "--tw-prose-invert-code": "#ffffff",
            "--tw-prose-invert-pre-code": BLUSH,
            "--tw-prose-invert-pre-bg": "rgb(0 0 0 / 50%)",
            "--tw-prose-invert-th-borders": PLUM_FADED,
            "--tw-prose-invert-td-borders": PLUM,
          },
        },
        DEFAULT: {
          css: {
            a: {
              color: "var(--tw-prose-links)",
              fontWeight: "inherit",
              textDecorationLine: "underline",
              textDecorationColor: ORANGERED,
              textDecorationThickness: "2px",
              textUnderlineOffset: "3px",
              transition: "background-color 0.08s ease",
              "&:hover": {
                backgroundColor: GOLD,
                textDecorationColor: INK,
              },
            },
            "h1, h2, h3, h4": {
              fontFamily: "var(--font-heading)",
              color: "var(--tw-prose-headings)",
            },
            h2: {
              fontSize: "1.6em",
              marginTop: "1.9em",
              marginBottom: "0.6em",
              fontWeight: "900",
              lineHeight: "1.1",
              letterSpacing: "-0.02em",
              textWrap: "balance",
            },
            h3: {
              fontSize: "1.25em",
              marginTop: "1.6em",
              marginBottom: "0.45em",
              fontWeight: "800",
              lineHeight: "1.2",
              letterSpacing: "-0.01em",
            },
            h4: {
              marginTop: "1.4em",
              marginBottom: "0.35em",
              fontWeight: "800",
            },
            p: {
              marginTop: "0.9em",
              marginBottom: "0.9em",
            },
            strong: {
              fontWeight: "700",
            },
            code: {
              fontFamily: "var(--font-label)",
              fontSize: "0.82em !important",
              fontWeight: "500",
              backgroundColor: PLUM_TINT,
              padding: "0.1em 0.35em",
              borderRadius: "0",
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
              content: "none",
            },
            "pre code": {
              backgroundColor: "transparent",
              padding: "0",
              fontWeight: "400",
            },
            pre: {
              fontFamily: "var(--font-label)",
              borderRadius: "0",
              border: `2px solid ${INK}`,
            },
            "a code": {
              color: "inherit",
            },
            img: {
              borderRadius: "0",
            },
            ol: {
              listStylePosition: "inside",
            },
            li: {
              textWrap: "pretty",
            },
            "ol > li::marker": {
              fontFamily: "var(--font-label)",
              fontWeight: 800,
              color: "var(--tw-prose-counters)",
            },
            "div > ul > li::marker": {
              content: "''",
            },
            "div > ul > li::before": {
              content: "''",
              display: "inline-block",
              width: "0.8em",
              height: "0.8em",
              marginRight: "0.55rem",
              verticalAlign: "-0.05em",
              background: `${LILY} center / contain no-repeat`,
            },
            "div > ul ul": {
              marginTop: 0,
            },
            "div > ul ul li:first-child": {
              marginTop: 0,
            },
            "thead th": {
              fontFamily: "var(--font-label)",
              fontSize: "0.8em",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            },
            thead: {
              borderBottomWidth: "2px",
            },
            figcaption: {
              fontFamily: "var(--font-label)",
              fontSize: "0.72em",
              letterSpacing: "0.04em",
            },
          },
        },
      }),
    },
  },
};

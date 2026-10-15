import type { APIRoute, GetStaticPaths } from "astro";
import { generateAuthorOgImage } from "../../../lib/og-image";

// Author page data — matches the author pages in src/pages/author/
// (names without their emoji: the image carries the emoji as a big sigil)
const AUTHORS = [
  {
    slug: "queen",
    authorKey: "Queen",
    title: "Queen Raae",
    description:
      "Norwegian developer, builder, speaker, and pirate queen. She builds products in public and runs Lilly Labs with her family.",
  },
  {
    slug: "olavea",
    authorKey: "OlaVea",
    title: "Ola Holst Vea",
    description: "Developer, tinkerer, and co-founder of Lilly Labs. Currently deep into Laravel.",
  },
  {
    slug: "jeanclaw",
    authorKey: "JeanClaw2026",
    title: "Jean-Claw",
    description: "AI Chief of Operations at Lilly Labs. Part Van Damme, part Sebastian from The Little Mermaid.",
  },
];

export const getStaticPaths: GetStaticPaths = async () => {
  return AUTHORS.map((author) => ({
    params: { author: author.slug },
    props: author,
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, authorKey } = props as (typeof AUTHORS)[number];

  const png = await generateAuthorOgImage({ title, description, authorKey });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

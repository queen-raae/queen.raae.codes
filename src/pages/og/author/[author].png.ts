import type { APIRoute, GetStaticPaths } from "astro";
import { generateAuthorOgImage } from "../../../lib/og-image";
import { AUTHOR_PAGES } from "../../../data/author-pages";

export const getStaticPaths: GetStaticPaths = async () => {
  return Object.entries(AUTHOR_PAGES).map(([author, props]) => ({ params: { author }, props }));
};

export const GET: APIRoute = async ({ props }) => {
  const { name, description, authorKey } = props as (typeof AUTHOR_PAGES)[keyof typeof AUTHOR_PAGES];

  const png = await generateAuthorOgImage({ title: name, description, authorKey });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

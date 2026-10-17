import type { APIRoute, GetStaticPaths } from "astro";
import { generatePageOgImage } from "../../../lib/og-image";
import { OG_PAGES } from "../../../data/og-pages";

export const getStaticPaths: GetStaticPaths = async () => {
  return Object.entries(OG_PAGES).map(([page, props]) => ({ params: { page }, props }));
};

export const GET: APIRoute = async ({ props }) => {
  const png = await generatePageOgImage(props as (typeof OG_PAGES)[keyof typeof OG_PAGES]);

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

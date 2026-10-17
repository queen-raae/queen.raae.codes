import type { APIRoute, GetStaticPaths } from "astro";
import { getAllTags } from "../../../lib/posts";
import { getTagBlurbs } from "../../../lib/tag-blurbs";
import { generatePageOgImage, getTagOgDescription } from "../../../lib/og-image";

export const getStaticPaths: GetStaticPaths = async () => {
  const tagsMap = await getAllTags();
  const blurbMap = await getTagBlurbs();

  return Array.from(tagsMap.entries()).map(([slug, { label, posts }]) => ({
    params: { tag: slug.replace(/^\/tag\//, "").replace(/\/$/, "") },
    props: { label, count: posts.length, description: getTagOgDescription(label, blurbMap.get(label)?.description) },
  }));
};

export const GET: APIRoute = async ({ props }) => {
  const { label, count, description } = props as { label: string; count: number; description: string };

  const png = await generatePageOgImage({
    labels: ["Tag", `${count} ${count === 1 ? "entry" : "entries"}`],
    title: `#${label}`,
    description,
  });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

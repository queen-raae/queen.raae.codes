import type { APIRoute, GetStaticPaths } from "astro";
import { getAllPosts } from "../../lib/posts";
import { generateOgImage } from "../../lib/og-image";

export const getStaticPaths: GetStaticPaths = async () => {
  const allPosts = await getAllPosts();

  return allPosts.map((post) => {
    const slugParam = post.slug.replace(/^\/|\/$/g, "");
    return {
      params: { slug: slugParam },
      props: {
        title: post.title,
        titlePrefix: post.titlePrefix,
        description: post.description,
        author: post.author,
        type: post.type ? post.typeLabel : "Log", // Link entries: just the date, "Notes on:" says the rest
        date: post.dateMedium,
      },
    };
  });
};

export const GET: APIRoute = async ({ props }) => {
  const { title, titlePrefix, description, author, type, date } = props as any;

  const png = await generateOgImage({ title, titlePrefix, description, author, type, date });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

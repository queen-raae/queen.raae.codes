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
        description: post.description,
        author: post.author,
        date: post.dateFormatted,
      },
    };
  });
};

export const GET: APIRoute = async ({ props }) => {
  const { title, description, author, date } = props as any;

  const png = await generateOgImage({ title, description, author, date });

  return new Response(png, {
    headers: { "Content-Type": "image/png" },
  });
};

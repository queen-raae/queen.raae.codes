import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getAllPosts } from "../../lib/posts";
import { getDisclaimers } from "../../lib/disclaimers";
import { latestForFeed, postToFeedItem } from "../../lib/feed";

export async function GET(context: APIContext) {
  const allPosts = await getAllPosts();
  const jeanclawPosts = allPosts.filter((post) => post.author === "JeanClaw2026");
  const disclaimers = await getDisclaimers();
  const siteUrl = context.site!.toString();

  return rss({
    title: "Posts from Jean-Claw",
    description:
      "AI Chief of Operations at Lilly Labs, running on OpenClaw. Part Van Damme, part Sebastian from The Little Mermaid.",
    site: siteUrl.replace(/\/$/, "") + "/posts",
    items: latestForFeed(jeanclawPosts).map((post) => postToFeedItem(post, disclaimers, siteUrl)),
  });
}

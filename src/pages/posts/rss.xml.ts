import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getAllPosts } from "../../lib/posts";
import { getDisclaimers } from "../../lib/disclaimers";
import { latestForFeed, postToFeedItem } from "../../lib/feed";

export async function GET(context: APIContext) {
  const allPosts = await getAllPosts();
  const disclaimers = await getDisclaimers();
  const siteUrl = context.site!.toString();

  return rss({
    title: "Posts from Queen Raae & Family",
    description:
      "Ahoy, seasoned JavaScript developers and daring dev pirates! Join our swashbuckling crew as we embark on thrilling treasure hunts unraveling the secrets of HTML, CSS, and JavaScript, all while having a blast!",
    site: siteUrl.replace(/\/$/, "") + "/posts",
    items: latestForFeed(allPosts).map((post) => postToFeedItem(post, disclaimers, siteUrl)),
  });
}

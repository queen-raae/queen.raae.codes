import rss from "@astrojs/rss";
import type { APIRoute, GetStaticPaths } from "astro";
import { getAllTags } from "../../lib/posts";
import { getDisclaimers } from "../../lib/disclaimers";
import { latestForFeed, postToFeedItem } from "../../lib/feed";

export const getStaticPaths: GetStaticPaths = async () => {
  const tagsMap = await getAllTags();

  return Array.from(tagsMap.entries()).map(([slug, { label, posts }]) => {
    const tagParam = slug.replace(/^\/tag\//, "").replace(/\/$/, "");
    return {
      params: { tag: tagParam },
      props: { label, posts },
    };
  });
};

export const GET: APIRoute = async (context) => {
  const { label, posts } = context.props as any;
  const disclaimers = await getDisclaimers();
  const siteUrl = context.site!.toString();

  return rss({
    title: `Posts tagged #${label}`,
    description: `The latest posts tagged with ${label} on queen.raae.codes`,
    site: siteUrl.replace(/\/$/, "") + `/tag/${context.params.tag}`,
    items: latestForFeed(posts).map((post: any) => postToFeedItem(post, disclaimers, siteUrl)),
  });
};

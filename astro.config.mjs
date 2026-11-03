import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import rehypeBlockquoteClass from "./src/lib/rehype-blockquote-class.mjs";
import rehypePodcastPlayer from "./src/lib/rehype-podcast-player.mjs";

export default defineConfig({
  site: "https://queen.raae.codes",
  trailingSlash: "always",
  markdown: {
    // Rendered entries are cached between builds (Netlify too) until this config changes:
    // bump `markup` when the podcast player's HTML changes, or old entries keep the old player.
    rehypePlugins: [rehypeBlockquoteClass, [rehypePodcastPlayer, { markup: 3 }]],
  },
  image: {
    // Skip processing for GIF files which can be too large
    service: {
      entrypoint: "astro/assets/services/sharp",
      config: {
        limitInputPixels: false,
      },
    },
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        // Exclude certain pages from sitemap
        const excludedPaths = ["/posts/preferences/", "/posts/welcome/", "/posts/reminders/"];
        return !excludedPaths.some((path) => page.includes(path)) && !page.includes("/tag/"); // Exclude tag archives
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
    server: {
      allowedHosts: ["under-the-sea.tail3ebde1.ts.net"],
    },
    ssr: {
      noExternal: ["clsx", "date-fns"],
    },
  },
});

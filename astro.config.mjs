import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import rehypeBlockquoteClass from "./src/lib/rehype-blockquote-class.mjs";

export default defineConfig({
  site: "https://queen.raae.codes",
  trailingSlash: "always",
  markdown: {
    rehypePlugins: [rehypeBlockquoteClass],
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

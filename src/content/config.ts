import { defineCollection, z } from "astro:content";
import { ENTRY_TYPES } from "../lib/entry-types";

// Slugify function for tag URLs
function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Parse comma-separated tags string into array of tag objects
function parseTags(
  tagsStr?: string,
  brandsStr?: string,
  peepsStr?: string,
  projectsStr?: string,
): { label: string; slug: string }[] {
  const allTags = [tagsStr, brandsStr, peepsStr, projectsStr].filter(Boolean).join(",");

  if (!allTags) return [];

  const tags = allTags
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0);

  const uniqueTags = [...new Set(tags)];

  return uniqueTags.map((tag) => ({
    label: tag,
    slug: `/tag/${slugify(tag)}/`,
  }));
}

// Post schema with transform: pre-processes tags and computes isRelatable
// so the content layer caches these derived fields
const postSchema = z
  .object({
    title: z.string(),
    emojii: z.string().optional(),
    audio: z.string().optional(), // Path to audio narration file
    tags: z.string().optional(), // Comma-separated string in frontmatter
    brands: z.string().optional(),
    peeps: z.string().optional(),
    projects: z.string().optional(),
    // Logbook fields (all optional; see src/lib/posts.ts for defaults)
    type: z.enum(ENTRY_TYPES).optional(), // Book, Link, Podcast, Life, Press; plain posts have none
    standfirst: z.string().optional(), // Italic line under the headline
    draft: z.boolean().optional(), // Hidden in production, shown on deploy previews
    importedFrom: z.string().optional(), // e.g. "kindle", "mailchimp", "convertkit", "bgraphic.no"
    source: z.string().optional(), // Alias for importedFrom, as named in the brief
    lang: z.enum(["en", "no"]).optional(), // "no" shows a "På norsk" label
    originalUrl: z.string().optional(), // Where an imported entry used to live
    creator: z.string().optional(), // Book author, or the publication for a Link
    url: z.string().optional(), // The thing a Link, Book, Podcast or Press entry points at
    outlet: z.string().optional(), // Press: the publication or podcast, e.g. "kode24"
    reread: z.boolean().optional(),
    lillylabs: z.boolean().optional(), // Show the "På norsk, for bedrifter" cross-link box
  })
  .transform((data) => ({
    title: data.title,
    emojii: data.emojii,
    audio: data.audio,
    tags: parseTags(data.tags, data.brands, data.peeps, data.projects),
    isRelatable: !data.title.includes("week around the Gatsby islands"),
    type: data.type,
    standfirst: data.standfirst,
    draft: data.draft ?? false,
    importedFrom: data.importedFrom ?? data.source,
    lang: data.lang ?? "en",
    originalUrl: data.originalUrl,
    creator: data.creator,
    url: data.url,
    outlet: data.outlet,
    reread: data.reread ?? false,
    lillylabs: data.lillylabs ?? false,
  }));

// Posts collections (queen and olavea share the same schema)
const postsQueen = defineCollection({
  type: "content",
  schema: postSchema,
});

const postsOlavea = defineCollection({
  type: "content",
  schema: postSchema,
});

const postsJeanclaw = defineCollection({
  type: "content",
  schema: postSchema,
});

// Landing pages collection
const landing = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      badge: z.string().optional(),
      title: z.string().optional(),
      lead: z.string().optional(),
      tagline: z.string().optional(),
      imageAlt: z.string().optional(),
      image: image().optional(),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().optional(),
          imageAlt: z.string().optional(),
          image: image().optional(),
        })
        .optional(),
      cta: z
        .object({
          href: z.string().optional(),
          label: z.string().optional(),
          noteTitle: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),
      ctas: z
        .array(
          z.object({
            to: z.string().optional(),
            label: z.string().optional(),
          }),
        )
        .optional(),
      webinar: z
        .object({
          date: z.any().optional(),
          url: z.string().optional(),
        })
        .optional(),
      form: z
        .object({
          cta: z.string().optional(),
          key: z.string().optional(),
          message: z.string().optional(),
          tagline: z.string().optional(),
        })
        .optional(),
      join: z
        .object({
          start: z.union([z.string(), z.date()]).optional(),
          end: z.union([z.string(), z.date()]).optional(),
          deadline: z.union([z.string(), z.number()]).optional(),
          paymentLink: z.string().optional(),
          price: z.string().optional(),
          status: z.string().optional(),
        })
        .optional(),
      sections: z
        .array(
          z.object({
            element: z.string().optional(),
            badge: z.string().optional(),
            title: z.string().optional(),
            titlePath: z.string().optional(),
            lead: z.string().optional(),
            tagline: z.string().optional(),
            content: z.string().optional(),
            imageAlt: z.string().optional(),
            image: image().optional(),
            body: z.string().optional(), // Path to body markdown file
            testimonials: z.array(z.string()).optional(), // Paths to testimonial files
          }),
        )
        .optional(),
    }),
});

// Talks collection
const talks = defineCollection({
  type: "content",
  schema: ({ image }) =>
    z.object({
      badge: z.string().optional(),
      title: z.string().optional(),
      lead: z.string().optional(),
      event: z.string().optional(),
      eventUrl: z.string().optional(),
      recording: z.string().optional(),
      imageAlt: z.string().optional(),
      image: image().optional(),
      archive: z
        .object({
          title: z.string().optional(),
          more: z.string().optional(),
          moreHref: z.string().optional(),
        })
        .optional(),
      teaser: z
        .object({
          badge: z.string().optional(),
          title: z.string().optional(),
          recording: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),
      cta: z
        .object({
          label: z.string().optional(),
          href: z.string().optional(),
          noteTitle: z.string().optional(),
          note: z.string().optional(),
        })
        .optional(),
    }),
});

// Tags collection (YAML files) - array of tag objects
const tags = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      label: z.string(),
      displayName: z.string().optional(),
      description: z.string().optional(),
      relationship: z.string().optional(),
      url: z.string().optional(),
      disclaimer: z.string().optional(),
      showOnPosts: z.boolean().optional(),
    }),
  ),
});

// Testimonials collection (YAML files)
const testimonials = defineCollection({
  type: "data",
  schema: z.array(
    z.object({
      url: z.string().optional(),
      post: z.string().optional(),
      image: z.string().optional(),
      product: z.string().optional(),
      date: z.union([z.string(), z.date()]).optional(),
    }),
  ),
});

export const collections = {
  "posts-queen": postsQueen,
  "posts-olavea": postsOlavea,
  "posts-jeanclaw": postsJeanclaw,
  landing: landing,
  talks: talks,
  tags: tags,
  testimonials: testimonials,
};

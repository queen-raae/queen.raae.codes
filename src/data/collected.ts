import type { ImageMetadata } from "astro";
import sevallaDeploymentQueued from "../assets/collected/sevalla-deployment-queued.png";

// Collected: screenshots of UI details Queen spotted, shown as pinned specimens on /collected/
// and as a strip at the top of each year in the log archive. Newest first.
// `note` is Queen's own words. Don't write one for her.
export interface Find {
  id: string; // Anchor on /collected/
  image: ImageMetadata;
  alt: string;
  note: string;
  site: string;
  url?: string;
  date: string; // YYYY-MM-DD
  tags: string[];
}

export const collected: Find[] = [
  {
    id: "sevalla-deploy-toast",
    image: sevallaDeploymentQueued,
    alt: "Sevalla’s dark “Deployment queued” toast with a spinner, and a Cancel button that is “square” on its left side and round on its right",
    note: "The button is “square” on one side and round on the other",
    site: "Sevalla",
    url: "https://sevalla.com",
    date: "2026-11-02",
    tags: ["ui", "inspo"],
  },
];

export function findsByYear(year: string): Find[] {
  return collected.filter((find) => find.date.startsWith(year));
}

export const formatFindDate = (date: string, withYear = true) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  });

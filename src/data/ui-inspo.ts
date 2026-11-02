import type { ImageMetadata } from "astro";
import sevallaDeploymentQueued from "../assets/ui-inspo/sevalla-deployment-queued.png";

// UI inspo: screenshots of interface details Queen liked, newest first.
// `note` is Queen's own words. Don't rewrite them or write one for her.
export interface UiInspo {
  id: string;
  image: ImageMetadata;
  alt: string;
  source: string;
  sourceUrl?: string;
  date: string; // YYYY-MM-DD, when she saved it
  note: string;
}

export const uiInspo: UiInspo[] = [
  {
    id: "sevalla-deployment-queued",
    image: sevallaDeploymentQueued,
    alt: "A dark pill-shaped toast reading “Deployment queued” with a spinner, and a Cancel button that is square on its left side and rounded on its right",
    source: "Sevalla",
    sourceUrl: "https://sevalla.com",
    date: "2026-11-02",
    note: "I liked the button being square on one side and round on the other.",
  },
];

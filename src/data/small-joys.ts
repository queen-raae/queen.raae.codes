import type { ImageMetadata } from "astro";
import rodelokka from "../assets/small-joys/2026-11-02-rodelokka.jpeg";

// Small joys: photos that made Queen happy or grateful, shown on /small-joys/. Newest first.
// `words`, `place` and `date` are all optional. `words` is Queen's own; never write it for her.
// A photo with none of them shows without a label.
export interface SmallJoy {
  id: string; // Anchor on /small-joys/
  image: ImageMetadata;
  alt: string;
  words?: string;
  place?: string;
  date?: string; // YYYY-MM-DD
}

export const smallJoys: SmallJoy[] = [
  {
    id: "rodelokka-2026-11-02",
    image: rodelokka,
    alt: "Low autumn sun on a quiet street of old wooden houses, with potted herbs and flowers on a stone step by a front door",
    place: "Rodeløkka, Oslo",
    date: "2026-11-02",
  },
];

export const formatJoyDate = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

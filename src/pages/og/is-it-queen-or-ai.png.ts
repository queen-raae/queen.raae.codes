import type { APIRoute } from "astro";
import { generateQuizOgImage } from "../../lib/og-image";

export const GET: APIRoute = async () =>
  new Response(await generateQuizOgImage(), { headers: { "Content-Type": "image/png" } });

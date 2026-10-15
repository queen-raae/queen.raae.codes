// Shared helpers for the speaker pages (/speaker/ and /speaker/<talk>/)

/** Talk folders are named YYYY-MM-DD-slug; the date lives in the id. */
export function parseDateFromId(id: string): Date | null {
  const match = id.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function getRecordingText(url: string): string {
  if (url.includes("youtu")) return "Watch the recording on YouTube";
  return "Watch the recording";
}

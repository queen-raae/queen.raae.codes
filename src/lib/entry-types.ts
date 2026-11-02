export const ENTRY_TYPES = ["Book", "Link", "Podcast", "Life", "Press", "Happiness"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

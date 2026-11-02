export const ENTRY_TYPES = ["Book", "Link", "Podcast", "Life", "Press", "Collected"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

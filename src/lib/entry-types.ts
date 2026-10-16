export const ENTRY_TYPES = ["Essay", "Note", "Book", "Link", "Life", "Podcast"] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

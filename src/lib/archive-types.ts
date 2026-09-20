export type ArchivePost = {
  slug: string;
  // Set when the old site served the post at the site root rather than /blog/.
  legacyPath?: string;
  title: string;
  date: string;
  updatedDate?: string;
  tag: string;
  excerpt: string;
  audience?: "client" | "candidate";
  fieldNotes?: string[];
  html: string;
};

export type ArchivePost = {
  slug: string;
  // Set when the old site served the post at the site root rather than /blog/.
  legacyPath?: string;
  title: string;
  date: string;
  tag: string;
  excerpt: string;
  html: string;
};

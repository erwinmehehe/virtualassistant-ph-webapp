import { ARCHIVE_POSTS } from "@/lib/archive-posts";
export type { ArchivePost } from "@/lib/archive-types";
export { ARCHIVE_POSTS } from "@/lib/archive-posts";

export function archivePostBySlug(slug: string) {
  return ARCHIVE_POSTS.find((post) => post.slug === slug);
}

// Recovered posts are dated text from the previous site, so the date is parsed
// back into an ISO value for schema and for the visible byline.
export function archivePublishedIso(post: { date: string }) {
  const parsed = new Date(post.date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString().slice(0, 10);
}

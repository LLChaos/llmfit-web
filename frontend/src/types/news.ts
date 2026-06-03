/** News post for list display. */
export interface NewsPostListItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: "news" | "guide" | "tutorial" | "announcement";
  tags: string; // comma-separated
  coverImageUrl: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Full news post with Markdown body. */
export interface NewsPostDetail extends NewsPostListItem {
  bodyMarkdown: string;
  isPublished: boolean;
}

/** Payload for creating/updating a news post. */
export interface NewsPostInput {
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  category?: string;
  tags?: string;
  coverImageUrl?: string;
  isPublished?: boolean;
}

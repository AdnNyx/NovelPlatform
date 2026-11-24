export interface User {
  id: string;
  username: string | null;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: "pembaca" | "novelis" | "admin";
  is_active: boolean;
  created_at: string;
}

export interface NovelAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export interface Novel {
  id: string;
  author_id: string;
  author?: NovelAuthor | null;
  title: string;
  slug: string;
  cover_url: string | null;
  synopsis: string;
  genres: string[];
  tags: string[];
  status: "ongoing" | "tamat";
  is_approved: boolean;
  total_views: number;
  total_chapters: number;
  rating_avg: string | number;
  rating_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChapterListItem {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  is_draft: boolean;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
}

export interface ChapterDetail {
  id: string;
  novel_id: string;
  novel_title: string;
  novel_slug: string;
  chapter_number: number;
  title: string;
  content_html: string;
  is_draft: boolean;
  is_published: boolean;
  published_at: string | null;
  prev_chapter_id: string | null;
  next_chapter_id: string | null;
  created_at: string;
}

export type BookmarkCategory = "sedang_dibaca" | "ingin_dibaca" | "favorit" | "selesai";

export interface Bookmark {
  id: string;
  novel_id: string;
  category: BookmarkCategory;
  created_at: string;
  novel: Novel;
}

export interface HistoryItem {
  id: string;
  novel_id: string;
  chapter_id: string;
  last_position: string | number;
  updated_at: string;
  novel_title: string;
  novel_slug: string;
  cover_url: string | null;
  chapter_number: number;
  chapter_title: string;
}

export interface NotificationItem {
  id: string;
  type: "chapter_baru" | "balasan_komentar" | "novel_update";
  title: string;
  message: string;
  is_read: boolean;
  novel_id: string | null;
  chapter_id: string | null;
  created_at: string;
}

export interface CommentAuthor {
  id: string;
  display_name: string;
  avatar_url: string | null;
  role: string;
}

export interface CommentItem {
  id: string;
  novel_id: string;
  chapter_id: string;
  parent_id: string | null;
  content: string;
  is_reported: boolean;
  created_at: string;
  user: CommentAuthor;
  replies?: CommentItem[];
}

export interface RatingItem {
  id: string;
  user_id: string;
  novel_id: string;
  score: number;
  review: string | null;
  created_at: string;
  user: CommentAuthor;
}

export interface NovelUserState {
  is_following: boolean;
  bookmark_category: BookmarkCategory | null;
  last_history: HistoryItem | null;
  user_rating: number | null;
  user_review: string | null;
}

export interface GenreItem {
  id: string;
  name: string;
  slug: string;
}

export interface TagItem {
  id: string;
  name: string;
  slug: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface StandardResponse<T> {
  status: string;
  data: T;
}

export interface PaginatedResponse<T> {
  status: string;
  data: T[];
  meta: PaginationMeta;
}

export interface NovelisDashboardStats {
  total_views: number;
  total_novels: number;
  total_chapters: number;
  total_bookmarks: number;
}

export interface NovelisDashboardData {
  stats: NovelisDashboardStats;
  novels: Novel[];
}

export interface AdminStats {
  total_users: number;
  total_novels: number;
  total_chapters: number;
  reported_comments: number;
}

export interface AdminCommentOut {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string;
  content: string;
  is_reported: boolean;
  created_at: string;
  user: CommentAuthor;
}

export interface ExtractedChapter {
  suggested_title: string;
  content_html: string;
}

export interface PdfJobPollData {
  job_id: string;
  job_status: string;
  chapters?: ExtractedChapter[] | null;
  error?: string | null;
}

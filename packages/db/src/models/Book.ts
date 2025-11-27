export type BookStatus = "draft" | "published";
export type BookVisibility = "public" | "private" | "unlisted";
export type BookFileType = "pdf" | "epub" | "mobi" | "sample";
export type BookCurrency = "USD" | "EUR" | "GBP";

export interface BookFile {
  id: string;
  type: BookFileType;
  url: string;
  size: number;
  uploaded_at: string;
}

export interface Book {
  id: string;
  author_id: string; // UUID
  title: string;
  slug: string;
  description?: string;
  cover_url?: string;
  price_cents: number;
  currency: BookCurrency;
  is_draft: boolean;
  visibility: BookVisibility;
  tags: string[];
  files: BookFile[];
  stats: {
    views: number;
    sales: number;
  };
  // Legacy fields
  cover_image?: string;
  category?: string;
  status: BookStatus;
  genres?: string[];
  language?: string;
  pages?: number;
  average_rating: number;
  review_count: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

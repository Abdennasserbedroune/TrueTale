export interface Review {
  id: string;
  user_id: string; // UUID
  book_id: string; // UUID
  rating: number;
  review_text: string;
  created_at: string;
  updated_at: string;
}

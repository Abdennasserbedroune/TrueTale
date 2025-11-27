export interface Draft {
  id: string;
  writer_id: string; // UUID
  title: string;
  content: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

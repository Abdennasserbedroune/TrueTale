export interface Story {
  id: string;
  writer_id: string; // UUID
  title: string;
  content: string;
  published: boolean;
  created_at: string;
  updated_at: string;
}

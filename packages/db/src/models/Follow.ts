export interface Follow {
  id: string;
  follower_id: string; // UUID
  following_id: string; // UUID
  created_at: string;
  updated_at: string;
}

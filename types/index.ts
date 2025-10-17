export type MessagingPreference = "anyone" | "followers" | "mutuals";

export interface WriterProfile {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  avatar?: string;
  location?: string;
  website?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
  interests: string[];
  genres: string[];
  featuredWorks: string[];
  network: {
    followers: string[];
    following: string[];
  };
  messagingPreference: MessagingPreference;
}

export type WorkStatus = "published" | "draft";

export interface WritingWork {
  id: string;
  slug: string;
  writerId: string;
  title: string;
  summary: string;
  excerpt: string;
  genres: string[];
  interests: string[];
  publishedAt: string;
  updatedAt: string;
  status: WorkStatus;
  readingTimeMinutes: number;
  popularityScore: number;
  recommendationsScore: number;
  likes: number;
  bookmarks: number;
}

export interface WorkComment {
  id: string;
  workId: string;
  authorId: string;
  body: string;
  createdAt: string;
  parentId?: string;
}

export interface DirectMessage {
  id: string;
  threadId: string;
  senderId: string;
  receiverId: string;
  body: string;
  createdAt: string;
  read: boolean;
}

export type NotificationType = "comment" | "message" | "marketplace";

export interface DashboardNotification {
  id: string;
  type: NotificationType;
  actorId: string;
  subjectId: string;
  createdAt: string;
  summary: string;
}

export interface MarketplaceEvent {
  id: string;
  workId: string;
  createdAt: string;
  type: "new-work" | "featured" | "milestone";
  description: string;
}

export interface AggregatedWork extends WritingWork {
  writer: WriterProfile;
}

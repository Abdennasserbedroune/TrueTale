import { WorkComment } from "@/types";

export interface EngagementRecord {
  workId: string;
  likes: string[];
  bookmarks: string[];
  comments: WorkComment[];
}

export function toggleLike(
  record: EngagementRecord,
  userId: string,
): EngagementRecord {
  const alreadyLiked = record.likes.includes(userId);
  const likes = alreadyLiked
    ? record.likes.filter((id) => id !== userId)
    : [...record.likes, userId];

  return {
    ...record,
    likes,
  };
}

export function toggleBookmark(
  record: EngagementRecord,
  userId: string,
): EngagementRecord {
  const alreadyBookmarked = record.bookmarks.includes(userId);
  const bookmarks = alreadyBookmarked
    ? record.bookmarks.filter((id) => id !== userId)
    : [...record.bookmarks, userId];

  return {
    ...record,
    bookmarks,
  };
}

export interface CreateCommentInput {
  workId: string;
  authorId: string;
  body: string;
  parentId?: string;
  createdAt?: string;
}

export function addComment(
  record: EngagementRecord,
  input: CreateCommentInput,
): EngagementRecord {
  const trimmed = input.body.trim();
  if (!trimmed) {
    throw new Error("Comments require content");
  }

  const newComment: WorkComment = {
    id: `${record.workId}-comment-${record.comments.length + 1}-${Date.now()}`,
    workId: record.workId,
    authorId: input.authorId,
    body: trimmed,
    parentId: input.parentId,
    createdAt: input.createdAt ?? new Date().toISOString(),
  };

  return {
    ...record,
    comments: [...record.comments, newComment].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    ),
  };
}

export function summariseEngagement(record: EngagementRecord) {
  return {
    likeCount: record.likes.length,
    bookmarkCount: record.bookmarks.length,
    commentCount: record.comments.length,
  };
}

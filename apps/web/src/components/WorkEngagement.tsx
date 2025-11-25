"use client";

import { FormEvent, useMemo, useState } from "react";
import { addComment, EngagementRecord, toggleBookmark, toggleLike } from "@/lib/engagement";
import { currentUserId } from "@/lib/session";
import { AggregatedWork, WorkComment, WriterProfile } from "@/types";
import { CommentThread } from "./CommentThread";

interface WorkEngagementProps {
  work: AggregatedWork;
  writers: Record<string, WriterProfile>;
  initialComments: WorkComment[];
}

export function WorkEngagement({ work, writers, initialComments }: WorkEngagementProps) {
  const [engagement, setEngagement] = useState<EngagementRecord>({
    workId: work.id,
    likes: [],
    bookmarks: [],
    comments: initialComments,
  });

  const [likeCount, setLikeCount] = useState(work.likes);
  const [bookmarkCount, setBookmarkCount] = useState(work.bookmarks);
  const [commentBody, setCommentBody] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);

  const hasLiked = engagement.likes.includes(currentUserId);
  const hasBookmarked = engagement.bookmarks.includes(currentUserId);

  const accessibleSummary = useMemo(
    () =>
      `This work has ${likeCount} likes, ${bookmarkCount} bookmarks, and ${engagement.comments.length} comments`,
    [bookmarkCount, engagement.comments.length, likeCount]
  );

  const handleToggleLike = () => {
    setEngagement((previous) => {
      const alreadyLiked = previous.likes.includes(currentUserId);
      const next = toggleLike(previous, currentUserId);
      setLikeCount((count) => (alreadyLiked ? Math.max(0, count - 1) : count + 1));
      return next;
    });
  };

  const handleToggleBookmark = () => {
    setEngagement((previous) => {
      const alreadyBookmarked = previous.bookmarks.includes(currentUserId);
      const next = toggleBookmark(previous, currentUserId);
      setBookmarkCount((count) => (alreadyBookmarked ? Math.max(0, count - 1) : count + 1));
      return next;
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setEngagement((previous) =>
        addComment(previous, {
          workId: work.id,
          authorId: currentUserId,
          body: commentBody,
        })
      );
      setCommentBody("");
      setCommentError(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Unable to add comment");
    }
  };

  return (
    <section aria-label={accessibleSummary} className="space-y-8">
      <div className="flex flex-wrap gap-4">
        <button
          type="button"
          onClick={handleToggleLike}
          className={`group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${hasLiked
              ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 hover:bg-brand-500"
              : "bg-white/5 text-text-primary hover:bg-white/10 hover:text-brand-300"
            }`}
          aria-pressed={hasLiked}
        >
          <span>{hasLiked ? "Liked" : "Like"}</span>
          <span className="opacity-50">·</span>
          <span>{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`group relative inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-bold transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-500 ${hasBookmarked
              ? "bg-cyan-600 text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-500"
              : "bg-white/5 text-text-primary hover:bg-white/10 hover:text-cyan-300"
            }`}
          aria-pressed={hasBookmarked}
        >
          <span>{hasBookmarked ? "Bookmarked" : "Bookmark"}</span>
          <span className="opacity-50">·</span>
          <span>{bookmarkCount}</span>
        </button>
      </div>

      <div className="space-y-6 rounded-3xl border border-white/5 bg-bg-surface p-8">
        <h2 className="text-2xl font-bold text-text-primary font-serif">Comments</h2>
        <CommentThread comments={engagement.comments} writers={writers} />
        <form className="space-y-4" onSubmit={handleSubmit} aria-label="Leave a comment">
          <label
            className="block text-sm font-medium text-text-secondary uppercase tracking-wider"
            htmlFor="comment-body"
          >
            Share your thoughts
          </label>
          <div className="relative">
            <textarea
              id="comment-body"
              name="comment"
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              required
              rows={4}
              className="w-full rounded-2xl border border-white/10 bg-bg-page px-4 py-3 text-sm text-text-primary placeholder-text-muted shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-colors resize-none"
              placeholder="Join the discussion..."
            />
          </div>
          {commentError && (
            <p role="alert" className="text-sm text-red-400 font-medium">
              {commentError}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-brand-600 px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-brand-500 hover:shadow-lg hover:shadow-brand-500/25 active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
            >
              Post comment
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

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
    [bookmarkCount, engagement.comments.length, likeCount],
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
        }),
      );
      setCommentBody("");
      setCommentError(null);
    } catch (error) {
      setCommentError(error instanceof Error ? error.message : "Unable to add comment");
    }
  };

  return (
    <section aria-label={accessibleSummary} className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleToggleLike}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
            hasLiked
              ? "bg-emerald-600 text-white shadow"
              : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100"
          }`}
          aria-pressed={hasLiked}
        >
          {hasLiked ? "Liked" : "Like"} · {likeCount}
        </button>
        <button
          type="button"
          onClick={handleToggleBookmark}
          className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
            hasBookmarked
              ? "bg-sky-600 text-white shadow"
              : "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100"
          }`}
          aria-pressed={hasBookmarked}
        >
          {hasBookmarked ? "Bookmarked" : "Bookmark"} · {bookmarkCount}
        </button>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Comments</h2>
        <CommentThread comments={engagement.comments} writers={writers} />
        <form className="space-y-3" onSubmit={handleSubmit} aria-label="Leave a comment">
          <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300" htmlFor="comment-body">
            Share your thoughts
          </label>
          <textarea
            id="comment-body"
            name="comment"
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            required
            rows={3}
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          {commentError && (
            <p role="alert" className="text-sm text-red-600">
              {commentError}
            </p>
          )}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Post comment
          </button>
        </form>
      </div>
    </section>
  );
}

"use client";

import { WorkComment, WriterProfile } from "@/types";

interface CommentThreadProps {
  comments: WorkComment[];
  writers: Record<string, WriterProfile>;
}

export function CommentThread({ comments, writers }: CommentThreadProps) {
  if (comments.length === 0) {
    return <p className="text-sm text-neutral-500">No comments yet. Start the conversation.</p>;
  }

  return (
    <ul className="space-y-4" aria-label="Comment thread">
      {comments.map((comment) => {
        const author = writers[comment.authorId];
        return (
          <li key={comment.id} className="rounded-lg border border-neutral-200 bg-white/70 p-4 dark:border-neutral-800 dark:bg-neutral-900/60">
            <header className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400">
              <span className="font-semibold text-neutral-800 dark:text-neutral-100">
                {author?.name ?? "Community Member"}
              </span>
              <span aria-hidden="true">·</span>
              <time dateTime={comment.createdAt}>{new Date(comment.createdAt).toLocaleString()}</time>
            </header>
            <p className="mt-2 text-neutral-700 dark:text-neutral-200">{comment.body}</p>
          </li>
        );
      })}
    </ul>
  );
}

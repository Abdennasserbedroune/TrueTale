'use client';

import { DraftWorkspaceComment } from "@/types";

interface DraftCommentsPanelProps {
  comments: DraftWorkspaceComment[];
  authors: Record<string, string>;
}

function renderCommentBody(comment: DraftWorkspaceComment, authorName: string) {
  return (
    <article
      key={comment.id}
      data-comment-id={comment.id}
      className="rounded-lg border border-neutral-200 bg-white/70 p-4 text-sm shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
    >
      <header className="flex items-start justify-between gap-3">
        <span className="font-semibold text-neutral-800 dark:text-neutral-100">{authorName}</span>
        <time
          className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400"
          dateTime={comment.createdAt}
        >
          {new Date(comment.createdAt).toLocaleString()}
        </time>
      </header>
      {comment.quote ? (
        <blockquote className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs italic text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
          “{comment.quote}”
        </blockquote>
      ) : null}
      <p className="mt-3 text-neutral-700 dark:text-neutral-200">{comment.body}</p>
    </article>
  );
}

export default function DraftCommentsPanel({ comments, authors }: DraftCommentsPanelProps) {
  const inlineComments = comments.filter((comment) => comment.placement === "inline");
  const sidebarComments = comments.filter((comment) => comment.placement === "sidebar");

  const renderSection = (
    title: string,
    data: DraftWorkspaceComment[],
    emptyLabel: string,
  ) => {
    const normalised = title.toLowerCase().replace(/\s+/g, "-");
    return (
      <section
        className="space-y-3"
        aria-label={title}
        data-testid={`comments-section-${normalised}`}
      >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
        {title}
      </h3>
      {data.length === 0 ? (
        <p className="rounded-md border border-dashed border-neutral-200 px-3 py-2 text-xs text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          {emptyLabel}
        </p>
      ) : (
        <div className="space-y-3">
          {data.map((comment) => renderCommentBody(comment, authors[comment.authorId] ?? "Collaborator"))}
        </div>
      )}
    </section>
  );
  };

  return (
    <div className="space-y-6" role="region" aria-label="Draft comments">
      {renderSection("Inline", inlineComments, "No inline comments yet")}
      {renderSection("Sidebar", sidebarComments, "No sidebar comments yet")}
    </div>
  );
}

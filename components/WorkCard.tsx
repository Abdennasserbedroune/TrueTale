"use client";

import Link from "next/link";
import { AggregatedWork } from "@/types";

interface WorkCardProps {
  work: AggregatedWork;
  variant?: "horizontal" | "vertical";
}

export function WorkCard({ work, variant = "vertical" }: WorkCardProps) {
  const layoutClasses =
    variant === "horizontal" ? "grid md:grid-cols-[2fr_minmax(0,1fr)] gap-4" : "space-y-3";

  return (
    <article
      className="rounded-lg border border-neutral-200 bg-white/70 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/80"
      aria-labelledby={`${work.id}-title`}
    >
      <div className={layoutClasses}>
        <div className="space-y-3">
          <header className="space-y-1">
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              {work.writer.name} · {new Date(work.publishedAt).toLocaleDateString()}
            </p>
            <h3
              id={`${work.id}-title`}
              className="text-xl font-semibold text-neutral-900 dark:text-neutral-100"
            >
              <Link className="hover:underline" href={`/works/${work.slug}`}>
                {work.title}
              </Link>
            </h3>
          </header>
          <p className="text-neutral-700 dark:text-neutral-300">{work.summary}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Genres and interests">
            {work.genres.map((genre) => (
              <li
                key={genre}
                className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
              >
                {genre}
              </li>
            ))}
            {work.interests.map((interest) => (
              <li
                key={interest}
                className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
              >
                {interest}
              </li>
            ))}
          </ul>
        </div>
        <dl className="grid grid-cols-3 gap-3 self-start text-sm text-neutral-600 dark:text-neutral-400">
          <div>
            <dt className="font-semibold text-neutral-800 dark:text-neutral-200">Likes</dt>
            <dd>{work.likes}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-800 dark:text-neutral-200">Bookmarks</dt>
            <dd>{work.bookmarks}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-800 dark:text-neutral-200">Read time</dt>
            <dd>{work.readingTimeMinutes} min</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

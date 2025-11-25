"use client";

import Link from "next/link";
import { AggregatedWork } from "@/types";

interface WorkCardProps {
  work: AggregatedWork;
  variant?: "horizontal" | "vertical";
}

export function WorkCard({ work, variant = "vertical" }: WorkCardProps) {
  const isHorizontal = variant === "horizontal";
  const layoutClasses = isHorizontal
    ? "grid md:grid-cols-[1.5fr_1fr] gap-6"
    : "flex flex-col h-full";

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border border-white/5 bg-bg-surface p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand-500/10 hover:border-brand-500/20 ${!isHorizontal ? "h-full" : ""
        }`}
      aria-labelledby={`${work.id}-title`}
    >
      {/* Decorative gradient blob */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-500/5 blur-3xl transition-all group-hover:bg-brand-500/10" />

      <div className={layoutClasses}>
        <div className="space-y-4 z-10">
          <header className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-medium text-brand-300 uppercase tracking-wider">
              <span>{work.writer.name}</span>
              <span className="text-white/20">•</span>
              <time dateTime={work.publishedAt}>{new Date(work.publishedAt).toLocaleDateString()}</time>
            </div>
            <h3
              id={`${work.id}-title`}
              className="text-2xl font-bold text-text-primary font-serif leading-tight group-hover:text-brand-400 transition-colors"
            >
              <Link href={`/works/${work.slug}`} className="focus:outline-none">
                <span className="absolute inset-0" aria-hidden="true" />
                {work.title}
              </Link>
            </h3>
          </header>
          <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{work.summary}</p>

          <div className="flex flex-wrap gap-2 pt-2" aria-label="Genres and interests">
            {work.genres.map((genre) => (
              <span
                key={genre}
                className="inline-flex items-center rounded-md bg-cyan-500/10 px-2 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/20"
              >
                {genre}
              </span>
            ))}
            {work.interests.map((interest) => (
              <span
                key={interest}
                className="inline-flex items-center rounded-md bg-brand-500/10 px-2 py-1 text-xs font-medium text-brand-300 ring-1 ring-inset ring-brand-500/20"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>

        <div className={`flex ${isHorizontal ? "flex-col justify-end items-end text-right" : "mt-6 pt-4 border-t border-white/5 justify-between items-end"}`}>
          <dl className="flex gap-6 text-xs text-text-secondary">
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-[10px] font-semibold">Likes</dt>
              <dd className="text-sm font-bold text-text-primary">{work.likes}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-[10px] font-semibold">Bookmarks</dt>
              <dd className="text-sm font-bold text-text-primary">{work.bookmarks}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="uppercase tracking-wider text-[10px] font-semibold">Read time</dt>
              <dd className="text-sm font-bold text-text-primary">{work.readingTimeMinutes} min</dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { WriterProfile } from "@/types";

interface WriterCardProps {
  writer: WriterProfile;
  showBio?: boolean;
}

export function WriterCard({ writer, showBio = false }: WriterCardProps) {
  return (
    <article className="flex flex-col justify-between rounded-lg border border-neutral-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/80">
      <div className="space-y-3">
        <header className="space-y-1">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            <Link className="hover:underline" href={`/writers/${writer.slug}`}>
              {writer.name}
            </Link>
          </h3>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{writer.tagline}</p>
        </header>
        {showBio && <p className="text-sm text-neutral-700 dark:text-neutral-300">{writer.bio}</p>}
        <div className="flex flex-wrap gap-2" aria-label="Writer interests">
          {writer.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/50 dark:text-purple-200"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs text-neutral-600 dark:text-neutral-400">
        <div>
          <dt className="font-semibold text-neutral-800 dark:text-neutral-200">Followers</dt>
          <dd>{writer.network.followers.length}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-800 dark:text-neutral-200">Following</dt>
          <dd>{writer.network.following.length}</dd>
        </div>
      </dl>
    </article>
  );
}

"use client";

import Link from "next/link";
import { WriterProfile } from "@/types";

interface WriterCardProps {
  writer: WriterProfile;
  showBio?: boolean;
}

export function WriterCard({ writer, showBio = false }: WriterCardProps) {
  return (
    <article className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-bg-surface p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand-500/10 hover:border-brand-500/20">
      <div className="space-y-4">
        <header className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-text-primary font-serif tracking-wide">
              <Link className="hover:text-brand-400 transition-colors" href={`/writers/${writer.slug}`}>
                {writer.name}
              </Link>
            </h3>
            <div className="h-2 w-2 rounded-full bg-brand-500 animate-pulse" />
          </div>
          <p className="text-sm font-medium text-brand-300 uppercase tracking-wider">{writer.tagline}</p>
        </header>
        {showBio && <p className="text-sm text-text-secondary leading-relaxed line-clamp-3">{writer.bio}</p>}
        <div className="flex flex-wrap gap-2" aria-label="Writer interests">
          {writer.interests.map((interest) => (
            <span
              key={interest}
              className="rounded-full border border-white/5 bg-white/5 px-3 py-1 text-xs font-medium text-text-muted transition-colors group-hover:border-brand-500/30 group-hover:text-brand-300"
            >
              {interest}
            </span>
          ))}
        </div>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/5 pt-4 text-xs">
        <div>
          <dt className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Followers</dt>
          <dd className="text-lg font-bold text-text-primary mt-0.5">{writer.network.followers.length}</dd>
        </div>
        <div>
          <dt className="font-semibold text-text-secondary uppercase tracking-wider text-[10px]">Following</dt>
          <dd className="text-lg font-bold text-text-primary mt-0.5">{writer.network.following.length}</dd>
        </div>
      </dl>
    </article>
  );
}

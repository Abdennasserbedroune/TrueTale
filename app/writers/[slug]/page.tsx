import { notFound } from "next/navigation";
import { WriterCard } from "@/components/WriterCard";
import { WorkCard } from "@/components/WorkCard";
import { writers } from "@/data/sampleData";
import {
  getDraftWorksByWriter,
  getPublishedWorksByWriter,
  getRelatedWorks,
} from "@/lib/works";
import type { Metadata } from "next";

interface WriterPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return writers.map((writer) => ({ slug: writer.slug }));
}

export function generateMetadata({ params }: WriterPageProps): Metadata {
  const writer = writers.find((entry) => entry.slug === params.slug);
  if (!writer) {
    return {
      title: "Writer not found",
    };
  }

  return {
    title: `${writer.name} · Writer profile`,
    description: writer.bio,
  };
}

export default function WriterProfilePage({ params }: WriterPageProps) {
  const writer = writers.find((entry) => entry.slug === params.slug);
  if (!writer) {
    notFound();
  }

  const published = getPublishedWorksByWriter(writer.id);
  const drafts = getDraftWorksByWriter(writer.id);
  const relatedWorks = getRelatedWorks(writer.featuredWorks[0] ?? published[0]?.id ?? "");

  return (
    <div className="space-y-12">
      <section className="grid gap-8 rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
              Writer profile
            </p>
            <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
              {writer.name}
            </h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-300">{writer.tagline}</p>
          </div>
          <p className="text-neutral-700 dark:text-neutral-200">{writer.bio}</p>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Location</dt>
              <dd className="text-neutral-600 dark:text-neutral-300">{writer.location}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Website</dt>
              <dd>
                {writer.website ? (
                  <a className="text-emerald-600 hover:underline" href={writer.website}>
                    {writer.website}
                  </a>
                ) : (
                  <span className="text-neutral-500">—</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Genres</dt>
              <dd className="flex flex-wrap gap-2">
                {writer.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  >
                    {genre}
                  </span>
                ))}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Interests</dt>
              <dd className="flex flex-wrap gap-2">
                {writer.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-800 dark:bg-sky-900/40 dark:text-sky-200"
                  >
                    {interest}
                  </span>
                ))}
              </dd>
            </div>
          </dl>
        </div>
        <aside className="space-y-4" aria-label="Profile snapshot">
          <WriterCard writer={writer} showBio />
        </aside>
      </section>

      <section className="space-y-4" aria-labelledby="published-works">
        <div className="flex items-center justify-between">
          <h2 id="published-works" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Published works
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {published.length} {published.length === 1 ? "work" : "works"}
          </span>
        </div>
        {published.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white/60 px-4 py-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/60 dark:text-neutral-300">
            No published works yet.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {published.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4" aria-labelledby="public-drafts">
        <h2 id="public-drafts" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
          Public drafts
        </h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">No public drafts yet.</p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {drafts.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>

      {relatedWorks.length > 0 && (
        <section className="space-y-4" aria-labelledby="related-works">
          <h2 id="related-works" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            You may also enjoy
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {relatedWorks.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

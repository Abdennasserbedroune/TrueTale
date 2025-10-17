import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkEngagement } from "@/components/WorkEngagement";
import { writers } from "@/data/sampleData";
import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { getCommentsForWork, getRelatedWorks, getWorkBySlug } from "@/lib/works";
import type { Metadata } from "next";

interface WorkPageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return listAggregatedWorks().map((work) => ({ slug: work.slug }));
}

export function generateMetadata({ params }: WorkPageProps): Metadata {
  const work = getWorkBySlug(params.slug);
  if (!work) {
    return { title: "Work not found" };
  }
  return {
    title: `${work.title} by ${work.writer.name}`,
    description: work.summary,
  };
}

export default function WorkPage({ params }: WorkPageProps) {
  const work = getWorkBySlug(params.slug);
  if (!work) {
    notFound();
  }

  const comments = getCommentsForWork(work.id);
  const relatedWorks = getRelatedWorks(work.id, 3);
  const writerLookup = Object.fromEntries(writers.map((writer) => [writer.id, writer]));

  return (
    <div className="space-y-12">
      <article className="rounded-3xl border border-neutral-200 bg-white/80 p-8 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
        <header className="space-y-3">
          <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
            {work.status === "published" ? "Published work" : "Public draft"}
          </p>
          <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">{work.title}</h1>
          <p className="text-neutral-600 dark:text-neutral-300">{work.summary}</p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
            <span>
              By{" "}
              <Link className="font-semibold text-emerald-600 hover:underline" href={`/writers/${work.writer.slug}`}>
                {work.writer.name}
              </Link>
            </span>
            <span aria-hidden>·</span>
            <time dateTime={work.publishedAt}>
              {new Date(work.publishedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
            </time>
            <span aria-hidden>·</span>
            <span>{work.readingTimeMinutes} min read</span>
          </div>
        </header>
        <section className="mt-6 space-y-4" aria-label="Work excerpt">
          <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200">Excerpt</h2>
          <p className="text-neutral-700 dark:text-neutral-200">{work.excerpt}</p>
        </section>
        <section className="mt-6 flex flex-wrap gap-2" aria-label="Tags">
          {[...work.genres, ...work.interests].map((label) => (
            <span
              key={label}
              className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200"
            >
              {label}
            </span>
          ))}
        </section>
      </article>

      <WorkEngagement work={work} writers={writerLookup} initialComments={comments} />

      {relatedWorks.length > 0 && (
        <section className="space-y-4" aria-labelledby="related-spotlights">
          <h2 id="related-spotlights" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Related spotlights
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {relatedWorks.map((entry) => (
              <article
                key={entry.id}
                className="rounded-xl border border-neutral-200 bg-white/70 p-5 transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/60"
              >
                <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  <Link className="hover:underline" href={`/works/${entry.slug}`}>
                    {entry.title}
                  </Link>
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-300">{entry.summary}</p>
                <p className="mt-3 text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <Link className="hover:underline" href={`/writers/${entry.writer.slug}`}>
                    {entry.writer.name}
                  </Link>
                </p>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

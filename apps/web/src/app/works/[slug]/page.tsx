import Link from "next/link";
import { notFound } from "next/navigation";
import { WorkEngagement } from "@/components/WorkEngagement";
import { writers } from "@/data/sampleData";
import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { getCommentsForWork, getRelatedWorks, getWorkBySlug } from "@/lib/works";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { ClockIcon, CalendarIcon, UserCircleIcon } from "@heroicons/react/24/outline";



export function generateStaticParams() {
  return listAggregatedWorks().map((work) => ({ slug: work.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) {
    return { title: "Work not found" };
  }
  return {
    title: `${work.title} by ${work.writer.name}`,
    description: work.summary,
  };
}

export default async function WorkPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const work = getWorkBySlug(slug);
  if (!work) {
    notFound();
  }

  const comments = getCommentsForWork(work.id);
  const relatedWorks = getRelatedWorks(work.id, 3);
  const writerLookup = Object.fromEntries(writers.map((writer) => [writer.id, writer]));

  return (
    <div className="space-y-12 pb-20">
      <article className="relative overflow-hidden rounded-[2.5rem] bg-bg-surface border border-white/5 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-900/30 via-bg-page to-bg-page opacity-70" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 space-y-8">
          <header className="space-y-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-widest backdrop-blur-sm ${work.status === "published"
                ? "border-brand-500/30 bg-brand-500/10 text-brand-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
                }`}>
                {work.status === "published" ? "Published Story" : "Public Draft"}
              </div>

              <div className="flex items-center gap-4 text-sm text-text-secondary">
                <div className="flex items-center gap-1.5">
                  <Icon icon={CalendarIcon} size="xs" />
                  <time dateTime={work.publishedAt}>
                    {new Date(work.publishedAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>
                <div className="flex items-center gap-1.5">
                  <Icon icon={ClockIcon} size="xs" />
                  <span>{work.readingTimeMinutes} min read</span>
                </div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl font-bold text-text-primary font-serif leading-tight">
              {work.title}
            </h1>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white shadow-lg">
                <Icon icon={UserCircleIcon} size="sm" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary uppercase tracking-wider">Written by</span>
                <Link
                  className="font-bold text-text-primary hover:text-brand-400 transition-colors"
                  href={`/writers/${work.writer.slug}`}
                >
                  {work.writer.name}
                </Link>
              </div>
            </div>
          </header>

          <div className="prose prose-invert prose-lg max-w-none border-t border-white/5 pt-8">
            <p className="text-xl text-text-secondary leading-relaxed font-serif italic border-l-4 border-brand-500/50 pl-6 my-8">
              {work.summary}
            </p>

            <div className="mt-8 space-y-4">
              <h2 className="text-lg font-bold text-text-primary uppercase tracking-widest text-sm">Excerpt</h2>
              <p className="text-text-primary leading-loose whitespace-pre-line font-serif text-lg">
                {work.excerpt}
              </p>
              <div className="flex justify-center py-8">
                <span className="text-text-muted text-2xl">***</span>
              </div>
            </div>
          </div>

          <section className="flex flex-wrap gap-2 pt-4" aria-label="Tags">
            {[...work.genres, ...work.interests].map((label) => (
              <span
                key={label}
                className="rounded-full border border-white/5 bg-white/5 px-4 py-1.5 text-xs font-medium text-text-secondary transition-colors hover:bg-white/10 hover:text-text-primary"
              >
                {label}
              </span>
            ))}
          </section>
        </div>
      </article>

      <WorkEngagement work={work} writers={writerLookup} initialComments={comments} />

      {relatedWorks.length > 0 && (
        <section className="space-y-8" aria-labelledby="related-spotlights">
          <div className="flex items-center gap-4">
            <h2 id="related-spotlights" className="text-2xl font-bold text-text-primary font-serif">
              More Like This
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {relatedWorks.map((entry) => (
              <article
                key={entry.id}
                className="group relative overflow-hidden rounded-2xl border border-white/5 bg-bg-surface p-6 transition-all hover:-translate-y-1 hover:shadow-xl hover:border-brand-500/20"
              >
                <div className="space-y-4">
                  <header>
                    <h3 className="text-xl font-bold text-text-primary font-serif group-hover:text-brand-400 transition-colors">
                      <Link href={`/works/${entry.slug}`}>
                        <span className="absolute inset-0" />
                        {entry.title}
                      </Link>
                    </h3>
                    <p className="mt-2 text-xs font-medium text-text-muted uppercase tracking-wider">
                      by {entry.writer.name}
                    </p>
                  </header>
                  <p className="text-sm text-text-secondary line-clamp-2">{entry.summary}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

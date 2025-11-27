import { notFound } from "next/navigation";
import { WriterCard } from "@/components/WriterCard";
import { WorkCard } from "@/components/WorkCard";
import { writers } from "@/data/sampleData";
import { getDraftWorksByWriter, getPublishedWorksByWriter, getRelatedWorks } from "@/lib/works";
import type { Metadata } from "next";
import { Icon } from "@/components/Icon";
import { GlobeAltIcon, MapPinIcon } from "@heroicons/react/24/outline";



export function generateStaticParams() {
  return writers.map((writer) => ({ slug: writer.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const writer = writers.find((entry) => entry.slug === slug);
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

export default async function WriterProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const writer = writers.find((entry) => entry.slug === slug);
  if (!writer) {
    notFound();
  }

  const published = getPublishedWorksByWriter(writer.id);
  const drafts = getDraftWorksByWriter(writer.id);
  const relatedWorks = getRelatedWorks(writer.featuredWorks[0] ?? published[0]?.id ?? "");

  return (
    <div className="space-y-16 pb-20">
      {/* Profile Header */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-bg-surface border border-white/5 shadow-2xl">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-900/40 via-bg-page to-bg-page opacity-70" />
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl" />

        <div className="relative z-10 p-8 sm:p-12 grid gap-12 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-text-secondary uppercase tracking-widest backdrop-blur-sm">
                Writer Profile
              </div>
              <h1 className="text-5xl font-bold text-text-primary font-serif tracking-tight">
                {writer.name}
              </h1>
              <p className="text-xl text-brand-300 font-medium">{writer.tagline}</p>
            </div>

            <p className="text-lg text-text-secondary leading-relaxed max-w-2xl">{writer.bio}</p>

            <div className="flex flex-wrap gap-6 text-sm text-text-secondary">
              <div className="flex items-center gap-2">
                <Icon icon={MapPinIcon} size="sm" className="text-brand-400" />
                <span>{writer.location}</span>
              </div>
              {writer.website && (
                <div className="flex items-center gap-2">
                  <Icon icon={GlobeAltIcon} size="sm" className="text-brand-400" />
                  <a className="hover:text-brand-300 transition-colors underline decoration-brand-500/30 underline-offset-4" href={writer.website}>
                    {writer.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex flex-wrap gap-2">
                {writer.genres.map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300 ring-1 ring-inset ring-cyan-500/20"
                  >
                    {genre}
                  </span>
                ))}
                {writer.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-brand-500/10 px-3 py-1 text-xs font-medium text-brand-300 ring-1 ring-inset ring-brand-500/20"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="lg:border-l lg:border-white/5 lg:pl-12 flex flex-col justify-center">
            <div className="rounded-2xl bg-bg-page/50 p-6 border border-white/5 backdrop-blur-sm">
              <h3 className="text-sm font-bold uppercase tracking-widest text-text-muted mb-4">Community Stats</h3>
              <dl className="grid grid-cols-2 gap-6">
                <div>
                  <dt className="text-xs text-text-secondary uppercase tracking-wider">Followers</dt>
                  <dd className="text-3xl font-bold text-text-primary font-serif mt-1">{writer.network.followers.length}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-secondary uppercase tracking-wider">Following</dt>
                  <dd className="text-3xl font-bold text-text-primary font-serif mt-1">{writer.network.following.length}</dd>
                </div>
              </dl>
              <button className="mt-6 w-full rounded-xl bg-brand-600 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/20 hover:bg-brand-500 transition-all active:scale-95">
                Follow Writer
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="published-works">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div>
            <h2 id="published-works" className="text-3xl font-bold text-text-primary font-serif">
              Published Works
            </h2>
            <p className="mt-2 text-text-secondary">
              {published.length} {published.length === 1 ? "story" : "stories"} available to read
            </p>
          </div>
        </div>

        {published.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
            <p className="text-text-secondary">No published works yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {published.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-8" aria-labelledby="public-drafts">
        <div className="flex items-end justify-between border-b border-white/5 pb-4">
          <div>
            <h2 id="public-drafts" className="text-3xl font-bold text-text-primary font-serif">
              Public Drafts
            </h2>
            <p className="mt-2 text-text-secondary">Works in progress shared with the community</p>
          </div>
        </div>

        {drafts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
            <p className="text-text-secondary">No public drafts yet.</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            {drafts.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>

      {relatedWorks.length > 0 && (
        <section className="space-y-8" aria-labelledby="related-works">
          <div className="flex items-center gap-4">
            <h2 id="related-works" className="text-2xl font-bold text-text-primary font-serif">
              You May Also Enjoy
            </h2>
            <div className="h-px flex-1 bg-white/5" />
          </div>
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

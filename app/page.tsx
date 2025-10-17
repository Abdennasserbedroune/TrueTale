import Link from "next/link";
import { WriterCard } from "@/components/WriterCard";
import { WorkCard } from "@/components/WorkCard";
import { writers } from "@/data/sampleData";
import { getPopularWorks, getRecentWorks, getRecommendedWorks } from "@/lib/discovery";

export default function Home() {
  const recent = getRecentWorks(3);
  const popular = getPopularWorks(3);
  const recommended = getRecommendedWorks("writer-aria", 3);

  return (
    <div className="space-y-16">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-sky-500 px-6 py-12 text-white shadow-xl sm:px-12">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-100">Inkwave Collective</p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-5xl">
            Discover new writing partners, showcase your worlds, and nurture vibrant reader communities.
          </h1>
          <p className="text-lg text-emerald-50">
            Explore writer profiles, curated discovery signals, and community-first collaboration tools designed for storytellers.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/marketplace"
              className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Browse the marketplace
            </Link>
            <Link
              href="/writers/aria-sullivan"
              className="inline-flex items-center justify-center rounded-full border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              View sample profile
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3" aria-labelledby="feature-grid">
        <h2 id="feature-grid" className="sr-only">
          Platform features
        </h2>
        {[{
          title: "Public writer hubs",
          description:
            "SEO-friendly profile pages highlight bios, writing interests, publications, and drafts to help readers discover you.",
        },
        {
          title: "Marketplace discovery",
          description:
            "Search and filter by genre or shared interests, and explore curated reels for recent, popular, and recommended works.",
        },
        {
          title: "Collaborative draft workspace",
          description:
            "Compose with autosave, manage sharing permissions, inspect revision history, and gather inline feedback in real time.",
        }].map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900/70"
          >
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{feature.title}</h3>
            <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-300">{feature.description}</p>
          </article>
        ))}
      </section>

      <section className="space-y-6" aria-labelledby="recent-works">
        <div className="flex items-center justify-between">
          <h2 id="recent-works" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
            Fresh from the marketplace
          </h2>
          <Link className="text-sm font-semibold text-emerald-600 hover:underline" href="/marketplace">
            See all
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {recent.map((work) => (
            <WorkCard key={work.id} work={work} />
          ))}
        </div>
      </section>

      <section className="grid gap-12 lg:grid-cols-2" aria-labelledby="community-highlights">
        <div className="space-y-5">
          <h2 id="community-highlights" className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Community highlights
          </h2>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Popular this week
            </h3>
            <div className="space-y-4">
              {popular.map((work) => (
                <WorkCard key={work.id} work={work} variant="horizontal" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
              Recommended for you
            </h3>
            <div className="space-y-4">
              {recommended.map((work) => (
                <WorkCard key={work.id} work={work} variant="horizontal" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Featured writers
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {writers.slice(0, 3).map((writer) => (
              <WriterCard key={writer.id} writer={writer} showBio />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { WorkCard } from "@/components/WorkCard";
import { searchWorks } from "@/lib/discovery";
import { AggregatedWork } from "@/types";

interface MarketplaceExplorerProps {
  genres: string[];
  interests: string[];
  curated: {
    recent: AggregatedWork[];
    popular: AggregatedWork[];
    recommended: AggregatedWork[];
  };
}

const statuses = [
  { label: "Published", value: "published" as const },
  { label: "Drafts", value: "draft" as const },
  { label: "All", value: "all" as const },
];

export function MarketplaceExplorer({ genres, interests, curated }: MarketplaceExplorerProps) {
  const [query, setQuery] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedInterest, setSelectedInterest] = useState<string | null>(null);
  const [status, setStatus] = useState<typeof statuses[number]["value"]>("published");

  const results = useMemo(() => {
    return searchWorks({
      query,
      genres: selectedGenres,
      interests: selectedInterest ? [selectedInterest] : undefined,
      status,
    });
  }, [query, selectedGenres, selectedInterest, status]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres((previous) =>
      previous.includes(genre)
        ? previous.filter((item) => item !== genre)
        : [...previous, genre],
    );
  };

  const handleInterestToggle = (interest: string) => {
    setSelectedInterest((previous) => (previous === interest ? null : interest));
  };

  return (
    <div className="space-y-10">
      <form className="grid gap-6 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70" role="search" aria-label="Marketplace search">
        <div className="grid gap-2">
          <label className="text-sm font-semibold text-neutral-700 dark:text-neutral-300" htmlFor="search-query">
            Search works
          </label>
          <input
            id="search-query"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, genre, or writer"
            className="w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Filter by genre
          </legend>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => {
              const active = selectedGenres.includes(genre);
              return (
                <button
                  type="button"
                  key={genre}
                  onClick={() => handleGenreToggle(genre)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    active
                      ? "border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-400 dark:bg-emerald-900/30 dark:text-emerald-200"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                  aria-pressed={active}
                >
                  {genre}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Filter by interest
          </legend>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const active = selectedInterest === interest;
              return (
                <button
                  type="button"
                  key={interest}
                  onClick={() => handleInterestToggle(interest)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    active
                      ? "border-sky-600 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-900/40 dark:text-sky-200"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                  aria-pressed={active}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </fieldset>
        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            Visibility
          </legend>
          <div className="flex flex-wrap gap-2">
            {statuses.map((option) => {
              const active = status === option.value;
              return (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => setStatus(option.value)}
                  className={`rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    active
                      ? "border-neutral-900 bg-neutral-900 text-white dark:border-neutral-100 dark:bg-neutral-100 dark:text-neutral-900"
                      : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                  aria-pressed={active}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>
      </form>

      <section aria-live="polite" className="space-y-4" aria-labelledby="search-results-heading">
        <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 id="search-results-heading" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
            Discovery results
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Showing {results.length} {results.length === 1 ? "work" : "works"}
          </p>
        </header>
        {results.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-300 bg-white/60 px-4 py-6 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300">
            No matches yet. Adjust your filters or explore the curated sections below.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {results.map((work) => (
              <WorkCard key={work.id} work={work} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-8" aria-labelledby="curated-sections">
        <h2 id="curated-sections" className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Curated spotlights
        </h2>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            { title: "Recent arrivals", works: curated.recent },
            { title: "Popular right now", works: curated.popular },
            { title: "Recommended for you", works: curated.recommended },
          ].map((section) => (
            <div key={section.title} className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                {section.title}
              </h3>
              <div className="space-y-4">
                {section.works.map((work) => (
                  <WorkCard key={`${section.title}-${work.id}`} work={work} variant="horizontal" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

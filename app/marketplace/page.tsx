import type { Metadata } from "next";
import { MarketplaceExplorer } from "./MarketplaceExplorer";
import { aggregatedWorks } from "@/data/sampleData";
import {
  listAvailableGenres,
  listAvailableInterests,
  getRecentWorks,
  getPopularWorks,
  getRecommendedWorks,
} from "@/lib/discovery";
import { currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Search and filter published works, drafts, and recommended pieces across the Inkwave community marketplace.",
};

export default function MarketplacePage() {
  const genres = listAvailableGenres();
  const interests = listAvailableInterests();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">Discover</p>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Marketplace discovery
        </h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-300">
          Search works, filter by genre or shared interests, and explore curated sections showcasing what the community is creating.
        </p>
      </header>
      <MarketplaceExplorer
        genres={genres}
        interests={interests}
        curated={{
          recent: getRecentWorks(4),
          popular: getPopularWorks(4),
          recommended: getRecommendedWorks(currentUserId, 4),
        }}
      />
      <p className="text-xs text-neutral-500 dark:text-neutral-500">
        Showing {aggregatedWorks.length} total works and drafts across the community marketplace.
      </p>
    </div>
  );
}

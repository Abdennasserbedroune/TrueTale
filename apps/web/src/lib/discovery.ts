import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { AggregatedWork, WorkStatus } from "@/types";

export interface SearchFilters {
  query?: string;
  genres?: string[];
  interests?: string[];
  status?: WorkStatus | "all";
}

export function normalise(text: string): string {
  return text.toLowerCase();
}

function matchesQuery(work: AggregatedWork, query?: string): boolean {
  if (!query) return true;
  const target = normalise(query);
  const haystacks = [
    work.title,
    work.summary,
    work.writer.name,
    ...work.genres,
    ...work.interests,
  ].map(normalise);

  return haystacks.some((value) => value.includes(target));
}

function matchesCollection(values: string[], selected?: string[]): boolean {
  if (!selected || selected.length === 0) return true;
  const normalisedSelected = selected.map(normalise);
  return values.some((value) => normalisedSelected.includes(normalise(value)));
}

function matchesStatus(work: AggregatedWork, status: SearchFilters["status"]): boolean {
  if (!status || status === "all") {
    return true;
  }

  return work.status === status;
}

export function searchWorks(filters: SearchFilters = {}): AggregatedWork[] {
  const { query, genres, interests, status } = filters;
  const works = listAggregatedWorks();

  return works
    .filter((work) => matchesStatus(work, status))
    .filter((work) => matchesQuery(work, query))
    .filter((work) => matchesCollection(work.genres, genres))
    .filter((work) => matchesCollection(work.interests, interests))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getRecentWorks(limit = 6): AggregatedWork[] {
  return [...listAggregatedWorks()]
    .filter((work) => work.status === "published")
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit);
}

export function getPopularWorks(limit = 6): AggregatedWork[] {
  return [...listAggregatedWorks()]
    .filter((work) => work.status === "published")
    .sort((a, b) => {
      const aScore = a.likes * 0.6 + a.bookmarks * 0.4 + a.popularityScore;
      const bScore = b.likes * 0.6 + b.bookmarks * 0.4 + b.popularityScore;
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getRecommendedWorks(forWriterId?: string, limit = 6): AggregatedWork[] {
  const pool = listAggregatedWorks().filter(
    (work) => work.status === "published" && (!forWriterId || work.writerId !== forWriterId)
  );

  const scored = pool.map((work) => {
    let score = work.recommendationsScore;

    if (forWriterId) {
      const sharedInterests = work.interests.includes("collaborations") ? 5 : 0;
      score += sharedInterests;
    }

    return { work, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.work)
    .slice(0, limit);
}

export function listAvailableGenres(): string[] {
  const set = new Set<string>();
  listAggregatedWorks().forEach((work) => work.genres.forEach((genre) => set.add(genre)));
  return Array.from(set).sort();
}

export function listAvailableInterests(): string[] {
  const set = new Set<string>();
  listAggregatedWorks().forEach((work) => work.interests.forEach((interest) => set.add(interest)));
  return Array.from(set).sort();
}

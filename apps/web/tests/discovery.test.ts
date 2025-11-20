import { describe, expect, it } from "vitest";
import {
  getPopularWorks,
  getRecentWorks,
  getRecommendedWorks,
  listAvailableGenres,
  listAvailableInterests,
  searchWorks,
} from "@/lib/discovery";
import { listAggregatedWorks, resetMarketplaceState } from "@/lib/marketplaceStore";

describe("marketplace discovery", () => {
  beforeEach(() => {
    resetMarketplaceState();
  });

  it("filters works by search query", () => {
    const results = searchWorks({ query: "tidal" });
    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Tidal Dreams");
  });

  it("filters works by genre and interest", () => {
    const results = searchWorks({
      genres: ["Mystery"],
      interests: ["interactive fiction"],
    });

    expect(results).toHaveLength(1);
    expect(results[0].title).toBe("Echo Vault");
  });

  it("supports filtering for drafts", () => {
    const results = searchWorks({ status: "draft" });
    expect(results.every((work) => work.status === "draft")).toBe(true);
  });

  it("exposes available genres and interests", () => {
    expect(listAvailableGenres()).toContain("Science Fiction");
    expect(listAvailableInterests()).toContain("collaborations");
  });

  it("sorts recent works by published date", () => {
    const recent = getRecentWorks(2);
    const [first, second] = recent;
    expect(new Date(first.publishedAt).getTime()).toBeGreaterThan(
      new Date(second.publishedAt).getTime()
    );
  });

  it("returns popular and recommended works with deterministic ordering", () => {
    const popular = getPopularWorks(3);
    expect(popular).toHaveLength(3);
    const scores = popular.map(
      (work) => work.likes * 0.6 + work.bookmarks * 0.4 + work.popularityScore
    );
    expect(scores[0]).toBeGreaterThanOrEqual(scores[1]);

    const recommended = getRecommendedWorks("writer-aria", 2);
    expect(recommended).toHaveLength(2);
    const notOwned = recommended.every((work) => work.writerId !== "writer-aria");
    expect(notOwned).toBe(true);
  });

  it("defaults to returning all aggregated works when no filters are provided", () => {
    const results = searchWorks();
    expect(results.length).toBe(listAggregatedWorks().length);
  });
});

import { comments } from "@/data/sampleData";
import { getAggregatedWorkBySlug, listAggregatedWorks } from "@/lib/marketplaceStore";
import { AggregatedWork, WorkComment } from "@/types";

export function getWorkBySlug(slug: string): AggregatedWork | undefined {
  return getAggregatedWorkBySlug(slug);
}

export function getWorksByWriter(writerId: string): AggregatedWork[] {
  return listAggregatedWorks().filter((work) => work.writerId === writerId);
}

export function getPublishedWorksByWriter(writerId: string): AggregatedWork[] {
  return getWorksByWriter(writerId).filter((work) => work.status === "published");
}

export function getDraftWorksByWriter(writerId: string): AggregatedWork[] {
  return getWorksByWriter(writerId).filter((work) => work.status === "draft");
}

export function getCommentsForWork(workId: string): WorkComment[] {
  return comments
    .filter((comment) => comment.workId === workId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function getRelatedWorks(workId: string, limit = 3): AggregatedWork[] {
  const works = listAggregatedWorks();
  const work = works.find((entry) => entry.id === workId);
  if (!work) return [];

  return works
    .filter((candidate) => candidate.id !== workId)
    .filter((candidate) =>
      candidate.genres.some((genre) => work.genres.includes(genre)) ||
      candidate.interests.some((interest) => work.interests.includes(interest)),
    )
    .sort((a, b) => b.recommendationsScore - a.recommendationsScore)
    .slice(0, limit);
}

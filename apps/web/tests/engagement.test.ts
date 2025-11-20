import { describe, expect, it } from "vitest";
import {
  addComment,
  EngagementRecord,
  summariseEngagement,
  toggleBookmark,
  toggleLike,
} from "@/lib/engagement";

const baseRecord: EngagementRecord = {
  workId: "work-tidal-dreams",
  likes: ["writer-jules"],
  bookmarks: [],
  comments: [],
};

describe("engagement interactions", () => {
  it("toggles likes for the same user", () => {
    const liked = toggleLike(baseRecord, "writer-aria");
    expect(liked.likes).toContain("writer-aria");

    const unliked = toggleLike(liked, "writer-aria");
    expect(unliked.likes).not.toContain("writer-aria");
  });

  it("toggles bookmarks independently from likes", () => {
    const bookmarked = toggleBookmark(baseRecord, "writer-aria");
    expect(bookmarked.bookmarks).toEqual(["writer-aria"]);

    const removed = toggleBookmark(bookmarked, "writer-aria");
    expect(removed.bookmarks).toHaveLength(0);
  });

  it("adds comments and keeps them sorted chronologically", () => {
    const first = addComment(baseRecord, {
      workId: baseRecord.workId,
      authorId: "writer-aria",
      body: "Loved this installment!",
      createdAt: "2024-10-10T10:00:00.000Z",
    });

    const second = addComment(first, {
      workId: baseRecord.workId,
      authorId: "writer-nova",
      body: "Let me know if you want audio layers.",
      createdAt: "2024-10-09T10:00:00.000Z",
    });

    expect(second.comments).toHaveLength(2);
    expect(second.comments[0].authorId).toBe("writer-nova");
    expect(second.comments[1].authorId).toBe("writer-aria");
  });

  it("throws when posting an empty comment", () => {
    expect(() =>
      addComment(baseRecord, {
        workId: baseRecord.workId,
        authorId: "writer-aria",
        body: "   ",
      })
    ).toThrow("Comments require content");
  });

  it("summarises engagement counts", () => {
    const enriched = {
      ...baseRecord,
      likes: ["writer-aria", "writer-jules"],
      bookmarks: ["writer-aria"],
      comments: [
        {
          id: "comment-1",
          workId: baseRecord.workId,
          authorId: "writer-aria",
          body: "So many ideas!",
          createdAt: "2024-10-10T10:00:00.000Z",
        },
      ],
    } satisfies EngagementRecord;

    const summary = summariseEngagement(enriched);
    expect(summary).toEqual({ likeCount: 2, bookmarkCount: 1, commentCount: 1 });
  });
});

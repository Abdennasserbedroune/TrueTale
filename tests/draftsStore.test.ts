import { describe, expect, it, beforeEach } from "vitest";
import {
  compareDraftRevisions,
  createDraft,
  createDraftComment,
  getDraftWorkspace,
  listDraftBucketsForUser,
  listDraftComments,
  listDraftRevisions,
  listAccessibleDrafts,
  resetDraftState,
  updateDraft,
} from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";
import { notifications } from "@/data/sampleData";

const collaboratorId = "writer-jules";
const otherWriterId = "writer-ronin";

describe("draftsStore", () => {
  beforeEach(() => {
    resetDraftState();
  });

  it("creates drafts with an initial revision and lists them for the owner", () => {
    const draft = createDraft({ ownerId: currentUserId, title: "Test draft", content: "<p>Hello world</p>" });
    expect(draft.revisions).toHaveLength(1);

    const buckets = listDraftBucketsForUser(currentUserId);
    expect(buckets.owned.find((entry) => entry.id === draft.id)).toBeDefined();
  });

  it("enforces sharing permissions between private, shared, and public drafts", () => {
    const sharedDraft = createDraft({
      ownerId: currentUserId,
      title: "Shared draft",
      content: "<p>Collaboration</p>",
      visibility: "shared",
      sharedWith: [collaboratorId],
    });

    const publicDraft = createDraft({
      ownerId: currentUserId,
      title: "Public draft",
      content: "<p>Open notes</p>",
      visibility: "public",
    });

    const collaboratorBuckets = listDraftBucketsForUser(collaboratorId);
    expect(collaboratorBuckets.collaborating.find((entry) => entry.id === sharedDraft.id)).toBeDefined();
    expect(collaboratorBuckets.public.find((entry) => entry.id === publicDraft.id)).toBeDefined();

    const otherBuckets = listDraftBucketsForUser(otherWriterId);
    expect(otherBuckets.collaborating.find((entry) => entry.id === sharedDraft.id)).toBeUndefined();
    expect(otherBuckets.public.find((entry) => entry.id === publicDraft.id)).toBeDefined();
  });

  it("supports autosave updates with revision history and diff", () => {
    const draft = createDraft({ ownerId: currentUserId, title: "Revision sample", content: "<p>Original</p>" });
    const updated = updateDraft(draft.id, currentUserId, {
      content: "<p>Original</p><p>Added line</p>",
      autosave: true,
    });

    expect(updated.revisions.length).toBeGreaterThan(draft.revisions.length);

    const revisions = listDraftRevisions(draft.id, currentUserId);
    const baseline = revisions[0];
    const latest = revisions[revisions.length - 1];
    const comparison = compareDraftRevisions(draft.id, baseline.id, latest.id, currentUserId);

    expect(comparison.segments.some((segment) => segment.type === "added")).toBe(true);
  });

  it("records comments, exposes them for collaborators, and triggers notifications", () => {
    const draft = createDraft({
      ownerId: currentUserId,
      title: "Feedback doc",
      content: "<p>Invite thoughts</p>",
      visibility: "shared",
      sharedWith: [collaboratorId],
    });

    const initialNotificationCount = notifications.length;

    const comment = createDraftComment(draft.id, collaboratorId, {
      body: "Love the new paragraph",
      placement: "inline",
      quote: "Invite thoughts",
    });

    expect(comment.id).toBeDefined();
    const comments = listDraftComments(draft.id, currentUserId);
    expect(comments.find((entry) => entry.id === comment.id)).toBeDefined();
    expect(notifications.length).toBeGreaterThan(initialNotificationCount);
  });

  it("prevents unauthorised users from accessing private drafts", () => {
    const draft = createDraft({ ownerId: currentUserId, title: "Private", content: "<p>Secret</p>" });
    expect(() => getDraftWorkspace(draft.id, otherWriterId)).toThrowError(/Not authorised/);

    const accessible = listAccessibleDrafts(otherWriterId);
    expect(accessible.find((entry) => entry.id === draft.id)).toBeUndefined();
  });
});

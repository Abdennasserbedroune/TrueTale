import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import {
  DraftSeed,
  draftCommentsSeed,
  draftRevisionSeed,
  draftSeeds,
  notifications,
  writers,
} from "@/data/sampleData";
import {
  DashboardNotification,
  DraftAttachment,
  DraftCommentPlacement,
  DraftComparisonView,
  DraftDiffSegment,
  DraftRevision,
  DraftSummary,
  DraftVisibility,
  DraftWorkspace,
  DraftWorkspaceComment,
  WriterProfile,
} from "@/types";

export interface DraftAttachmentInput {
  filename: string;
  contentType: string;
  base64Data: string;
  size: number;
}

export interface DraftCreationInput {
  title: string;
  ownerId: string;
  content?: string;
  visibility?: DraftVisibility;
  sharedWith?: string[];
  attachments?: DraftAttachmentInput[];
  note?: string;
}

export interface DraftUpdateInput {
  title?: string;
  content?: string;
  visibility?: DraftVisibility;
  sharedWith?: string[];
  attachmentsToAdd?: DraftAttachmentInput[];
  removeAttachmentIds?: string[];
  autosave?: boolean;
  note?: string;
}

export interface DraftCommentInput {
  body: string;
  placement: DraftCommentPlacement;
  quote?: string | null;
}

export interface DraftAccessBuckets {
  owned: DraftSummary[];
  collaborating: DraftSummary[];
  public: DraftSummary[];
}

interface DraftEntity extends DraftSeed {}

interface DraftState {
  drafts: Map<string, DraftEntity>;
  revisions: Map<string, DraftRevision>;
  revisionIndex: Map<string, string[]>;
  comments: Map<string, DraftWorkspaceComment[]>;
}

type DraftEventPayloads = {
  "draft:updated": DraftWorkspace;
  "draft:commented": { draftId: string; comment: DraftWorkspaceComment };
};

class DraftEventEmitter extends EventEmitter {
  emit<E extends keyof DraftEventPayloads>(event: E, payload: DraftEventPayloads[E]): boolean {
    return super.emit(event, payload);
  }

  on<E extends keyof DraftEventPayloads>(event: E, listener: (payload: DraftEventPayloads[E]) => void): this {
    return super.on(event, listener);
  }

  off<E extends keyof DraftEventPayloads>(event: E, listener: (payload: DraftEventPayloads[E]) => void): this {
    return super.off(event, listener);
  }
}

const draftsEmitter = new DraftEventEmitter();

const writerIndex = new Map<string, WriterProfile>(writers.map((writer) => [writer.id, writer] as const));
const originalNotifications = notifications.slice();

function cloneAttachment(attachment: DraftAttachment): DraftAttachment {
  return { ...attachment };
}

function cloneRevision(revision: DraftRevision): DraftRevision {
  return { ...revision };
}

function cloneComment(comment: DraftWorkspaceComment): DraftWorkspaceComment {
  return { ...comment };
}

function stripHtmlToPreview(content: string): string {
  const text = content
    .replace(/\n+/g, " ")
    .replace(/<\/(p|div)>/gi, " ")
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text.slice(0, 160);
}

function ensureArray<T>(values: T[] | undefined): T[] {
  if (!values) return [];
  return Array.from(new Set(values));
}

function createAttachment(input: DraftAttachmentInput): DraftAttachment {
  return {
    id: `draft-attachment-${randomUUID()}`,
    filename: input.filename,
    contentType: input.contentType,
    size: input.size,
    uploadedAt: new Date().toISOString(),
    dataUrl: `data:${input.contentType};base64,${input.base64Data}`,
  } satisfies DraftAttachment;
}

function cloneDraftSeed(seed: DraftSeed): DraftEntity {
  return {
    ...seed,
    attachments: seed.attachments.map(cloneAttachment),
    content: seed.content,
  } satisfies DraftEntity;
}

function createInitialState(): DraftState {
  const drafts = new Map<string, DraftEntity>();
  draftSeeds.forEach((seed) => {
    drafts.set(seed.id, cloneDraftSeed(seed));
  });

  const revisions = new Map<string, DraftRevision>();
  const revisionIndex = new Map<string, string[]>();
  draftRevisionSeed.forEach((revision) => {
    revisions.set(revision.id, cloneRevision(revision));
    const index = revisionIndex.get(revision.draftId) ?? [];
    index.push(revision.id);
    revisionIndex.set(revision.draftId, index);
  });
  revisionIndex.forEach((ids, draftId) => {
    const sorted = ids.sort((a, b) => {
      const revA = revisions.get(a);
      const revB = revisions.get(b);
      if (!revA || !revB) return 0;
      return new Date(revA.createdAt).getTime() - new Date(revB.createdAt).getTime();
    });
    revisionIndex.set(draftId, sorted);
  });

  const comments = new Map<string, DraftWorkspaceComment[]>();
  draftCommentsSeed.forEach((comment) => {
    const list = comments.get(comment.draftId) ?? [];
    list.push(cloneComment(comment));
    comments.set(comment.draftId, list);
  });
  comments.forEach((list, draftId) => {
    const ordered = list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
    comments.set(draftId, ordered);
  });

  return { drafts, revisions, revisionIndex, comments } satisfies DraftState;
}

const state: DraftState = createInitialState();

export function resetDraftState(): void {
  const next = createInitialState();
  state.drafts = next.drafts;
  state.revisions = next.revisions;
  state.revisionIndex = next.revisionIndex;
  state.comments = next.comments;
  notifications.splice(0, notifications.length, ...originalNotifications.map((notification) => ({ ...notification })));
}

function requireDraft(draftId: string): DraftEntity {
  const draft = state.drafts.get(draftId);
  if (!draft) {
    throw new Error(`Draft ${draftId} not found`);
  }
  return draft;
}

function ensureVisibility(value?: DraftVisibility): DraftVisibility {
  if (!value) return "private";
  if (value === "private" || value === "shared" || value === "public") {
    return value;
  }
  return "private";
}

function sanitiseSharedWith(sharedWith: string[] | undefined, ownerId: string): string[] {
  const clean = ensureArray(sharedWith).filter((id) => id && id !== ownerId);
  return clean;
}

function canViewDraft(draft: DraftEntity, userId?: string | null): boolean {
  if (draft.visibility === "public") {
    return true;
  }
  if (!userId) {
    return false;
  }
  if (draft.ownerId === userId) {
    return true;
  }
  if (draft.visibility === "shared" && draft.sharedWith.includes(userId)) {
    return true;
  }
  return false;
}

function canEditDraft(draft: DraftEntity, userId?: string | null): boolean {
  if (!userId) return false;
  if (draft.ownerId === userId) return true;
  if (draft.visibility === "shared" && draft.sharedWith.includes(userId)) {
    return true;
  }
  return false;
}

function toDraftSummary(draft: DraftEntity): DraftSummary {
  return {
    id: draft.id,
    title: draft.title,
    ownerId: draft.ownerId,
    visibility: draft.visibility,
    sharedWith: [...draft.sharedWith],
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    preview: draft.preview,
    attachments: draft.attachments.map(cloneAttachment),
  } satisfies DraftSummary;
}

function listRevisionEntities(draftId: string): DraftRevision[] {
  const revisionIds = state.revisionIndex.get(draftId) ?? [];
  return revisionIds
    .map((id) => state.revisions.get(id))
    .filter((revision): revision is DraftRevision => Boolean(revision))
    .map(cloneRevision);
}

function listCommentEntities(draftId: string): DraftWorkspaceComment[] {
  return (state.comments.get(draftId) ?? []).map(cloneComment);
}

function toDraftWorkspace(draft: DraftEntity): DraftWorkspace {
  return {
    ...toDraftSummary(draft),
    content: draft.content,
    revisions: listRevisionEntities(draft.id),
    comments: listCommentEntities(draft.id),
  } satisfies DraftWorkspace;
}

function createRevision(
  draft: DraftEntity,
  authorId: string,
  content: string,
  autosave: boolean,
  note?: string,
): DraftRevision {
  const revision: DraftRevision = {
    id: `draft-revision-${randomUUID()}`,
    draftId: draft.id,
    authorId,
    titleSnapshot: draft.title,
    content,
    createdAt: new Date().toISOString(),
    autosave,
    note,
  } satisfies DraftRevision;

  state.revisions.set(revision.id, cloneRevision(revision));
  const index = state.revisionIndex.get(draft.id) ?? [];
  index.push(revision.id);
  index.sort((a, b) => {
    const revA = state.revisions.get(a);
    const revB = state.revisions.get(b);
    if (!revA || !revB) return 0;
    return new Date(revA.createdAt).getTime() - new Date(revB.createdAt).getTime();
  });
  state.revisionIndex.set(draft.id, index);
  draft.latestRevisionId = revision.id;

  return cloneRevision(revision);
}

function recordNotification(notification: DashboardNotification): void {
  notifications.unshift(notification);
}

export function listDraftBucketsForUser(userId: string | null | undefined): DraftAccessBuckets {
  const owned: DraftSummary[] = [];
  const collaborating: DraftSummary[] = [];
  const publicDrafts: DraftSummary[] = [];

  state.drafts.forEach((draft) => {
    const summary = toDraftSummary(draft);
    if (draft.ownerId === userId) {
      owned.push(summary);
      return;
    }
    if (canEditDraft(draft, userId)) {
      collaborating.push(summary);
      return;
    }
    if (draft.visibility === "public") {
      publicDrafts.push(summary);
    }
  });

  const sortByUpdated = (a: DraftSummary, b: DraftSummary) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();

  owned.sort(sortByUpdated);
  collaborating.sort(sortByUpdated);
  publicDrafts.sort(sortByUpdated);

  return { owned, collaborating, public: publicDrafts } satisfies DraftAccessBuckets;
}

export function listAccessibleDrafts(userId: string | null | undefined): DraftSummary[] {
  const summaries: DraftSummary[] = [];
  state.drafts.forEach((draft) => {
    if (canViewDraft(draft, userId)) {
      summaries.push(toDraftSummary(draft));
    }
  });
  summaries.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  return summaries;
}

export function getDraftWorkspace(draftId: string, viewerId: string | null | undefined): DraftWorkspace {
  const draft = requireDraft(draftId);
  if (!canViewDraft(draft, viewerId)) {
    throw new Error("Not authorised to view this draft");
  }
  return toDraftWorkspace(draft);
}

export function createDraft(input: DraftCreationInput): DraftWorkspace {
  const now = new Date().toISOString();
  const visibility = ensureVisibility(input.visibility);
  const sharedWith = sanitiseSharedWith(input.sharedWith, input.ownerId);
  const attachments = ensureArray(input.attachments).map(createAttachment);
  const content = input.content ?? "";
  const draft: DraftEntity = {
    id: `draft-${randomUUID()}`,
    title: input.title || "Untitled draft",
    ownerId: input.ownerId,
    visibility,
    sharedWith,
    createdAt: now,
    updatedAt: now,
    preview: stripHtmlToPreview(content),
    attachments,
    content,
    latestRevisionId: "",
  } satisfies DraftEntity;

  state.drafts.set(draft.id, draft);
  if (!state.comments.has(draft.id)) {
    state.comments.set(draft.id, []);
  }
  if (!state.revisionIndex.has(draft.id)) {
    state.revisionIndex.set(draft.id, []);
  }

  createRevision(draft, input.ownerId, content, false, input.note ?? "Initial draft");

  draftsEmitter.emit("draft:updated", toDraftWorkspace(draft));
  return toDraftWorkspace(draft);
}

export function updateDraft(
  draftId: string,
  actorId: string,
  input: DraftUpdateInput,
): DraftWorkspace {
  const draft = requireDraft(draftId);
  if (!canEditDraft(draft, actorId)) {
    throw new Error("Not authorised to modify this draft");
  }

  let contentChanged = false;
  let revisionNote: string | undefined = input.note;

  if (typeof input.title === "string" && input.title.trim() && input.title !== draft.title) {
    draft.title = input.title.trim();
  }

  if (typeof input.content === "string" && input.content !== draft.content) {
    draft.content = input.content;
    draft.preview = stripHtmlToPreview(input.content);
    contentChanged = true;
  }

  if (input.attachmentsToAdd && input.attachmentsToAdd.length > 0) {
    const next = input.attachmentsToAdd.map(createAttachment);
    draft.attachments = draft.attachments.concat(next);
    draft.updatedAt = new Date().toISOString();
  }

  if (input.removeAttachmentIds && input.removeAttachmentIds.length > 0) {
    const toRemove = new Set(input.removeAttachmentIds);
    draft.attachments = draft.attachments.filter((attachment) => !toRemove.has(attachment.id));
    draft.updatedAt = new Date().toISOString();
  }

  if (input.visibility) {
    draft.visibility = ensureVisibility(input.visibility);
  }
  if (input.sharedWith) {
    draft.sharedWith = sanitiseSharedWith(input.sharedWith, draft.ownerId);
  }

  const now = new Date().toISOString();
  draft.updatedAt = now;

  if (contentChanged || input.autosave) {
    if (!revisionNote && !contentChanged) {
      revisionNote = "Autosave";
    }
    createRevision(draft, actorId, draft.content, Boolean(input.autosave), revisionNote);
  }

  draftsEmitter.emit("draft:updated", toDraftWorkspace(draft));
  return toDraftWorkspace(draft);
}

export function listDraftRevisions(
  draftId: string,
  viewerId: string | null | undefined,
): DraftRevision[] {
  const draft = requireDraft(draftId);
  if (!canViewDraft(draft, viewerId)) {
    throw new Error("Not authorised to inspect revisions");
  }
  return listRevisionEntities(draftId);
}

function extractTextBlocks(content: string): string[] {
  return content
    .replace(/<\/(p|div)>/gi, "\n")
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function buildDiff(baseContent: string, targetContent: string): DraftDiffSegment[] {
  const baseLines = extractTextBlocks(baseContent);
  const targetLines = extractTextBlocks(targetContent);
  const max = Math.max(baseLines.length, targetLines.length);
  const segments: DraftDiffSegment[] = [];

  for (let index = 0; index < max; index += 1) {
    const baseLine = baseLines[index];
    const targetLine = targetLines[index];

    if (baseLine && targetLine && baseLine === targetLine) {
      segments.push({ type: "unchanged", text: targetLine });
      continue;
    }
    if (baseLine) {
      segments.push({ type: "removed", text: baseLine });
    }
    if (targetLine) {
      segments.push({ type: "added", text: targetLine });
    }
  }

  return segments;
}

export function compareDraftRevisions(
  draftId: string,
  baseRevisionId: string,
  targetRevisionId: string,
  viewerId: string | null | undefined,
): DraftComparisonView {
  const draft = requireDraft(draftId);
  if (!canViewDraft(draft, viewerId)) {
    throw new Error("Not authorised to compare revisions");
  }

  const base = state.revisions.get(baseRevisionId);
  const target = state.revisions.get(targetRevisionId);
  if (!base || !target || base.draftId !== draftId || target.draftId !== draftId) {
    throw new Error("Revisions do not belong to the requested draft");
  }

  return {
    base: cloneRevision(base),
    target: cloneRevision(target),
    segments: buildDiff(base.content, target.content),
  } satisfies DraftComparisonView;
}

export function listDraftComments(
  draftId: string,
  viewerId: string | null | undefined,
): DraftWorkspaceComment[] {
  const draft = requireDraft(draftId);
  if (!canViewDraft(draft, viewerId)) {
    throw new Error("Not authorised to view comments");
  }
  return listCommentEntities(draftId);
}

export function createDraftComment(
  draftId: string,
  actorId: string,
  input: DraftCommentInput,
): DraftWorkspaceComment {
  const draft = requireDraft(draftId);
  if (!canViewDraft(draft, actorId)) {
    throw new Error("Not authorised to discuss this draft");
  }

  const trimmedBody = input.body.trim();
  if (!trimmedBody) {
    throw new Error("Comment body is required");
  }

  const comment: DraftWorkspaceComment = {
    id: `draft-comment-${randomUUID()}`,
    draftId,
    authorId: actorId,
    body: trimmedBody,
    createdAt: new Date().toISOString(),
    placement: input.placement,
    quote: input.quote?.trim() ? input.quote.trim() : null,
  } satisfies DraftWorkspaceComment;

  const list = state.comments.get(draftId) ?? [];
  list.push(comment);
  list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  state.comments.set(draftId, list);

  if (draft.ownerId !== actorId) {
    const actor = writerIndex.get(actorId);
    const summary = `${actor?.name ?? "Collaborator"} commented on draft ${draft.title}`;
    const notification: DashboardNotification = {
      id: `notif-${randomUUID()}`,
      type: "comment",
      actorId,
      subjectId: draftId,
      createdAt: comment.createdAt,
      summary,
    } satisfies DashboardNotification;
    recordNotification(notification);
  }

  draftsEmitter.emit("draft:commented", { draftId, comment: cloneComment(comment) });
  return cloneComment(comment);
}

export function deleteDraft(draftId: string, actorId: string): void {
  const draft = requireDraft(draftId);
  if (draft.ownerId !== actorId) {
    throw new Error("Only the owner can delete a draft");
  }

  state.drafts.delete(draftId);
  state.comments.delete(draftId);
  const revisionIds = state.revisionIndex.get(draftId) ?? [];
  revisionIds.forEach((id) => state.revisions.delete(id));
  state.revisionIndex.delete(draftId);
}

export function getDraftEventEmitter(): DraftEventEmitter {
  return draftsEmitter;
}

export function listPotentialCollaborators(excludeWriterId?: string): WriterProfile[] {
  return writers.filter((writer) => writer.id !== excludeWriterId);
}

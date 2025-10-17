'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import DraftCommentsPanel from "@/components/drafts/DraftCommentsPanel";
import {
  DraftComparisonView,
  DraftRevision,
  DraftWorkspace,
  DraftWorkspaceComment,
} from "@/types";

interface CollaboratorOption {
  id: string;
  name: string;
}

interface DraftWorkspaceClientProps {
  initialDraft: DraftWorkspace;
  viewerId: string;
  collaborators: CollaboratorOption[];
  authorLookup: Record<string, string>;
}

function formatRelativeTime(iso: string): string {
  const target = new Date(iso);
  const elapsed = Date.now() - target.getTime();
  if (Number.isNaN(elapsed)) {
    return "";
  }
  const minutes = Math.round(elapsed / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return target.toLocaleDateString();
}

function uniqueComments(existing: DraftWorkspaceComment[], incoming: DraftWorkspaceComment): DraftWorkspaceComment[] {
  if (existing.some((comment) => comment.id === incoming.id)) {
    return existing;
  }
  return [...existing, incoming].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export default function DraftWorkspaceClient({
  initialDraft,
  viewerId,
  collaborators,
  authorLookup,
}: DraftWorkspaceClientProps) {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState<DraftWorkspace>(initialDraft);
  const [revisions, setRevisions] = useState<DraftRevision[]>(initialDraft.revisions);
  const [comments, setComments] = useState<DraftWorkspaceComment[]>(initialDraft.comments);
  const [pendingContent, setPendingContent] = useState(initialDraft.content);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<DraftComparisonView | null>(null);
  const [baseRevisionId, setBaseRevisionId] = useState(revisions[0]?.id ?? "");
  const [targetRevisionId, setTargetRevisionId] = useState(revisions[revisions.length - 1]?.id ?? "");
  const [shareMode, setShareMode] = useState<"private" | "shared" | "public">(initialDraft.visibility);
  const [sharedWith, setSharedWith] = useState<string[]>([...initialDraft.sharedWith]);
  const [inlineQuote, setInlineQuote] = useState<string>("");
  const [commentBody, setCommentBody] = useState<string>("");
  const [sidebarCommentBody, setSidebarCommentBody] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editorRef.current && !dirty) {
      editorRef.current.innerHTML = draft.content;
    }
  }, [draft.content, draft.id, dirty]);

  useEffect(() => {
    const autoSaveDelay = 1200;
    if (!dirty) return undefined;
    const handle = window.setTimeout(() => {
      void saveDraft({ content: pendingContent, autosave: true, silent: true });
    }, autoSaveDelay);
    return () => window.clearTimeout(handle);
  }, [dirty, pendingContent]);

  useEffect(() => {
    const eventSource = new EventSource(`/api/drafts/events?draftId=${draft.id}`);

    eventSource.addEventListener("draft", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as DraftWorkspace;
        if (payload.id !== draft.id) return;
        setDraft(payload);
        setRevisions(payload.revisions);
        setComments(payload.comments);
        if (!dirty) {
          setPendingContent(payload.content);
        }
      } catch (error) {
        // ignore malformed payloads
      }
    });

    eventSource.addEventListener("comment", (event) => {
      try {
        const payload = JSON.parse((event as MessageEvent).data) as DraftWorkspaceComment;
        if (payload.draftId !== draft.id) return;
        setComments((current) => uniqueComments(current, payload));
      } catch (error) {
        // ignore malformed payloads
      }
    });

    return () => {
      eventSource.close();
    };
  }, [draft.id, dirty]);

  useEffect(() => {
    setBaseRevisionId(revisions[0]?.id ?? "");
    setTargetRevisionId(revisions[revisions.length - 1]?.id ?? "");
  }, [revisions.length]);

  const ownedByViewer = useMemo(() => draft.ownerId === viewerId, [draft.ownerId, viewerId]);

  const saveDraft = async (
    options: { content?: string; note?: string; autosave?: boolean; silent?: boolean } = {},
  ) => {
    setStatus(options.autosave ? "saving" : "saving");
    if (!options.silent) {
      setStatusMessage(options.autosave ? "Autosaving..." : "Saving draft...");
    }
    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: options.content ?? pendingContent,
          autosave: options.autosave ?? false,
          note: options.note,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to save draft");
      }
      const data = await response.json();
      setDraft(data.draft);
      setRevisions(data.draft.revisions);
      setComments(data.draft.comments);
      setPendingContent(data.draft.content);
      setDirty(false);
      setStatus("saved");
      setStatusMessage(options.autosave ? "Autosaved" : "Draft saved");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to save draft");
    }
  };

  const handleEditorInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    setPendingContent(html);
    setDraft((current) => ({ ...current, content: html }));
    setDirty(true);
  };

  const handleManualSave = () => {
    void saveDraft({ content: pendingContent, autosave: false });
  };

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const files = Array.from(event.target.files);
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    setUploading(true);
    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      const data = await response.json();
      setDraft(data.draft);
      setRevisions(data.draft.revisions);
      setComments(data.draft.comments);
      setStatusMessage("Attachments updated");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ removeAttachmentIds: [attachmentId] }),
      });
      if (!response.ok) {
        throw new Error("Unable to remove attachment");
      }
      const data = await response.json();
      setDraft(data.draft);
      setRevisions(data.draft.revisions);
      setComments(data.draft.comments);
      setStatusMessage("Attachment removed");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to remove attachment");
    }
  };

  const applySharing = async (visibility: "private" | "shared" | "public", partners: string[]) => {
    setShareMode(visibility);
    setSharedWith(partners);
    try {
      const response = await fetch(`/api/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility, sharedWith: visibility === "shared" ? partners : [] }),
      });
      if (!response.ok) {
        throw new Error("Unable to update sharing");
      }
      const data = await response.json();
      setDraft(data.draft);
      setRevisions(data.draft.revisions);
      setComments(data.draft.comments);
      setStatusMessage("Sharing preferences updated");
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to update sharing");
    }
  };

  const toggleSharedCollaborator = (collaboratorId: string) => {
    if (!ownedByViewer) return;
    const next = sharedWith.includes(collaboratorId)
      ? sharedWith.filter((entry) => entry !== collaboratorId)
      : [...sharedWith, collaboratorId];
    setSharedWith(next);
    void applySharing(shareMode, next);
  };

  const requestComparison = async () => {
    if (!baseRevisionId || !targetRevisionId) return;
    try {
      const response = await fetch(
        `/api/drafts/${draft.id}/compare?base=${baseRevisionId}&target=${targetRevisionId}`,
        {
          method: "GET",
        },
      );
      if (!response.ok) {
        throw new Error("Unable to compare revisions");
      }
      const data = await response.json();
      setComparison(data.comparison);
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to compare revisions");
    }
  };

  const submitComment = async (
    placement: "inline" | "sidebar",
    body: string,
    quote?: string,
  ) => {
    if (!body.trim()) return;
    try {
      const response = await fetch(`/api/drafts/${draft.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, placement, quote }),
      });
      if (!response.ok) {
        throw new Error("Unable to add comment");
      }
      const data = await response.json();
      setComments((current) => uniqueComments(current, data.comment));
      setStatusMessage("Comment added");
      if (placement === "inline") {
        setInlineQuote("");
        setCommentBody("");
      } else {
        setSidebarCommentBody("");
      }
    } catch (error) {
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "Unable to add comment");
    }
  };

  const captureSelection = () => {
    const selection = window.getSelection();
    if (!selection) return;
    const text = selection.toString().trim();
    if (text) {
      setInlineQuote(text);
    }
  };

  const sharingLabel = {
    private: "Private",
    shared: "Shared",
    public: "Public",
  } as const;

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-neutral-500 dark:text-neutral-400">
            Draft workspace
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
            {draft.title}
          </h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
            Visibility: <span className="font-medium">{sharingLabel[draft.visibility]}</span>
          </p>
        </div>
        <div className="text-right text-xs text-neutral-500 dark:text-neutral-400">
          <p>Updated {formatRelativeTime(draft.updatedAt)}</p>
          <p>Created {new Date(draft.createdAt).toLocaleDateString()}</p>
          {statusMessage ? <p className="mt-1 text-emerald-500">{statusMessage}</p> : null}
        </div>
      </header>

      <section className="grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Draft</h2>
              <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                {dirty ? <span className="text-amber-500">Unsaved changes</span> : <span>Synced</span>}
                <button
                  type="button"
                  onClick={handleManualSave}
                  className="rounded-full border border-emerald-500 px-3 py-1 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-500/10"
                >
                  Save snapshot
                </button>
              </div>
            </div>
            <div
              ref={editorRef}
              onInput={handleEditorInput}
              onBlur={handleEditorInput}
              className="mt-4 min-h-[320px] rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm leading-6 text-neutral-800 shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              contentEditable
              suppressContentEditableWarning
            />
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-neutral-600 transition hover:border-emerald-400 hover:text-emerald-500 dark:border-neutral-700 dark:text-neutral-300">
                <input type="file" className="hidden" multiple onChange={handleUpload} />
                <span>{uploading ? "Uploading..." : "Attach files"}</span>
              </label>
              {status === "saving" ? <span className="text-neutral-500">Saving…</span> : null}
            </div>
            {draft.attachments.length > 0 ? (
              <div className="mt-4 space-y-2 text-sm">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Attachments
                </h3>
                <ul className="space-y-2">
                  {draft.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                    >
                      <a
                        className="truncate font-medium text-emerald-600 hover:underline"
                        href={attachment.dataUrl}
                        download={attachment.filename}
                      >
                        {attachment.filename}
                      </a>
                      {ownedByViewer ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttachment(attachment.id)}
                          className="text-xs font-semibold text-rose-500 hover:underline"
                        >
                          Remove
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Version history</h2>
            {revisions.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No revisions yet.</p>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Base revision
                    <select
                      value={baseRevisionId}
                      onChange={(event) => setBaseRevisionId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      {revisions.map((revision) => (
                        <option key={revision.id} value={revision.id}>
                          {new Date(revision.createdAt).toLocaleString()} {revision.autosave ? "(autosave)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-medium uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                    Target revision
                    <select
                      value={targetRevisionId}
                      onChange={(event) => setTargetRevisionId(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                    >
                      {revisions.map((revision) => (
                        <option key={revision.id} value={revision.id}>
                          {new Date(revision.createdAt).toLocaleString()} {revision.autosave ? "(autosave)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <button
                  type="button"
                  onClick={requestComparison}
                  className="rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
                >
                  Compare revisions
                </button>
                {comparison ? (
                  <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3 text-sm dark:border-neutral-700 dark:bg-neutral-800/60">
                    <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-300">
                      Differences
                    </p>
                    <ul className="space-y-2">
                      {comparison.segments.map((segment, index) => (
                        <li
                          key={`${segment.type}-${index}-${segment.text.slice(0, 16)}`}
                          className={
                            segment.type === "added"
                              ? "rounded-md bg-emerald-100/70 px-3 py-2 text-emerald-700"
                              : segment.type === "removed"
                                ? "rounded-md bg-rose-100/70 px-3 py-2 text-rose-700"
                                : "rounded-md bg-white px-3 py-2 text-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-200"
                          }
                        >
                          {segment.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sharing</h2>
            <div className="mt-3 space-y-3 text-sm">
              {([
                { value: "private", label: "Private" },
                { value: "shared", label: "Shared with writers" },
                { value: "public", label: "Public" },
              ] as const).map((option) => (
                <label key={option.value} className="flex items-center justify-between gap-3">
                  <span>{option.label}</span>
                  <input
                    type="radio"
                    name="share-mode"
                    value={option.value}
                    checked={shareMode === option.value}
                    onChange={() => applySharing(option.value, option.value === "shared" ? sharedWith : [])}
                    className="h-4 w-4 text-emerald-500 focus:ring-emerald-400"
                    disabled={!ownedByViewer}
                  />
                </label>
              ))}
            </div>
            {shareMode === "shared" ? (
              <div className="mt-4 space-y-2 text-sm">
                <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  Select collaborators
                </p>
                <div className="flex flex-wrap gap-2">
                  {collaborators.map((collaborator) => (
                    <label
                      key={collaborator.id}
                      className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1 text-neutral-700 dark:border-neutral-700 dark:text-neutral-200"
                    >
                      <input
                        type="checkbox"
                        checked={sharedWith.includes(collaborator.id)}
                        onChange={() => toggleSharedCollaborator(collaborator.id)}
                        className="h-4 w-4 text-emerald-500 focus:ring-emerald-400"
                        disabled={!ownedByViewer}
                      />
                      <span>{collaborator.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Inline comment</h2>
              <button
                type="button"
                onClick={captureSelection}
                className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-neutral-700 dark:text-neutral-300"
              >
                Capture selection
              </button>
            </div>
            {inlineQuote ? (
              <blockquote className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs italic text-amber-800 dark:bg-amber-900/40 dark:text-amber-100">
                “{inlineQuote}”
              </blockquote>
            ) : (
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Select text in the draft and capture it to annotate inline.</p>
            )}
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Leave an inline note"
              rows={3}
            />
            <button
              type="button"
              onClick={() => submitComment("inline", commentBody, inlineQuote)}
              className="mt-3 w-full rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
            >
              Comment inline
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Sidebar comment</h2>
            <textarea
              value={sidebarCommentBody}
              onChange={(event) => setSidebarCommentBody(event.target.value)}
              className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Share general feedback"
              rows={3}
            />
            <button
              type="button"
              onClick={() => submitComment("sidebar", sidebarCommentBody)}
              className="mt-3 w-full rounded-full bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Comment in sidebar
            </button>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">Discussion</h2>
            <DraftCommentsPanel comments={comments} authors={authorLookup} />
          </div>
        </aside>
      </section>

      <footer className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
        <button
          type="button"
          onClick={() => {
            router.push("/drafts");
          }}
          className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-600 hover:border-emerald-400 hover:text-emerald-500 dark:border-neutral-700 dark:text-neutral-300"
        >
          Back to drafts
        </button>
        <span>Owner: {authorLookup[draft.ownerId] ?? "You"}</span>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import CreateDraftForm from "@/components/drafts/CreateDraftForm";
import { listDraftBucketsForUser, listPotentialCollaborators } from "@/lib/draftsStore";
import { currentUser, currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Draft workspace",
  description:
    "Compose, autosave, and collaborate on works-in-progress with version history, sharing controls, and inline feedback.",
};

export const dynamic = "force-dynamic";

function formatRelative(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
}

interface DraftSectionProps {
  heading: string;
  description: string;
  drafts: ReturnType<typeof listDraftBucketsForUser>["owned"];
}

function DraftSection({ heading, description, drafts }: DraftSectionProps) {
  const headingId = heading.toLowerCase().replace(/\s+/g, "-");
  return (
    <section className="space-y-3" aria-labelledby={headingId}>
      <div>
        <h2 id={headingId} className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          {heading}
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">{description}</p>
      </div>
      {drafts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-neutral-200 px-4 py-3 text-sm text-neutral-500 dark:border-neutral-700 dark:text-neutral-400">
          Nothing here yet.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {drafts.map((draft) => (
            <li
              key={draft.id}
              className="rounded-2xl border border-neutral-200 bg-white/80 p-5 shadow-sm transition hover:border-emerald-400 hover:shadow-lg dark:border-neutral-800 dark:bg-neutral-900/70"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
                    <Link href={`/drafts/${draft.id}`} className="hover:underline">
                      {draft.title}
                    </Link>
                  </h3>
                  <p className="mt-1 line-clamp-2 text-sm text-neutral-600 dark:text-neutral-400">
                    {draft.preview || "No preview yet"}
                  </p>
                </div>
                <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                  {draft.visibility}
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <div>
                  <dt className="font-semibold text-neutral-700 dark:text-neutral-200">Updated</dt>
                  <dd>{formatRelative(draft.updatedAt)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-neutral-700 dark:text-neutral-200">Shared with</dt>
                  <dd>{draft.sharedWith.length}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function DraftsPage() {
  const buckets = listDraftBucketsForUser(currentUserId);
  const collaborators = listPotentialCollaborators(currentUserId).map((writer) => ({
    id: writer.id,
    name: writer.name,
  }));

  return (
    <div className="space-y-12">
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
          Draft workspace
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Welcome back, {currentUser.name}
        </h1>
        <p className="max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
          Manage private drafts, share works-in-progress with collaborators, and keep track of inline feedback within a shared workspace.
        </p>
      </header>

      <CreateDraftForm collaborators={collaborators} />

      <div className="space-y-10">
        <DraftSection
          heading="Owned drafts"
          description="Drafts you created. Manage visibility, revisions, and attachments."
          drafts={buckets.owned}
        />
        <DraftSection
          heading="Collaborating"
          description="Drafts shared with you. Provide inline or sidebar comments in real time."
          drafts={buckets.collaborating}
        />
        <DraftSection
          heading="Public drafts"
          description="Drafts opened to the community."
          drafts={buckets.public}
        />
      </div>
    </div>
  );
}

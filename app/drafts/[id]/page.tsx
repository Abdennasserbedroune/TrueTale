import type { Metadata } from "next";
import { notFound } from "next/navigation";
import DraftWorkspaceClient from "@/components/drafts/DraftWorkspaceClient";
import { getDraftWorkspace, listPotentialCollaborators } from "@/lib/draftsStore";
import { currentUserId } from "@/lib/session";
import { writers } from "@/data/sampleData";

export const dynamic = "force-dynamic";

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  try {
    const draft = getDraftWorkspace(params.id, currentUserId);
    return {
      title: `${draft.title} – Draft workspace`,
      description: `Editing workspace for ${draft.title} with revision history and collaboration tools.`,
      openGraph: {
        title: draft.title,
        description: `Collaborative workspace for ${draft.title}.`,
      },
    } satisfies Metadata;
  } catch (error) {
    return {
      title: "Draft workspace",
    } satisfies Metadata;
  }
}

export default function DraftWorkspacePage({ params }: { params: { id: string } }) {
  try {
    const draft = getDraftWorkspace(params.id, currentUserId);
    const collaborators = listPotentialCollaborators(draft.ownerId).map((writer) => ({
      id: writer.id,
      name: writer.name,
    }));
    const authorLookup = Object.fromEntries(writers.map((writer) => [writer.id, writer.name] as const));

    return (
      <DraftWorkspaceClient
        initialDraft={draft}
        viewerId={currentUserId}
        collaborators={collaborators}
        authorLookup={authorLookup}
      />
    );
  } catch (error) {
    notFound();
  }
}

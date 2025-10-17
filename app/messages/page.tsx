import { MessageCenter } from "./MessageCenter";
import { writers } from "@/data/sampleData";
import { getThreadsForWriter } from "@/lib/messaging";
import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { currentUser, currentUserId } from "@/lib/session";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages",
  description:
    "Direct messaging between writers with presence-aware polling updates and collaboration recommendations.",
};

export default function MessagesPage() {
  const initialThreads = getThreadsForWriter(currentUserId);
  const works = listAggregatedWorks();

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
          Messages
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Connect with collaborators
        </h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-300">
          Manage conversations, respond to feedback, and discover new collaborators ready to build stories with {currentUser.name}.
        </p>
      </header>
      <MessageCenter initialThreads={initialThreads} writers={writers} works={works} />
    </div>
  );
}

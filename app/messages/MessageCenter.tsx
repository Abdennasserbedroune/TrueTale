"use client";

import { useEffect, useMemo, useState } from "react";
import { WorkCard } from "@/components/WorkCard";
import { currentUserId } from "@/lib/session";
import {
  canMessage,
  createThreadId,
  getThreadMessages,
  pollScheduledMessages,
} from "@/lib/messaging";
import { AggregatedWork, DirectMessage, MessageThreadSummary, WriterProfile } from "@/types";

interface MessageCenterProps {
  initialThreads: MessageThreadSummary[];
  writers: WriterProfile[];
  works: AggregatedWork[];
}

interface ThreadState {
  summary: MessageThreadSummary;
  messages: DirectMessage[];
}

export function MessageCenter({ initialThreads, writers, works }: MessageCenterProps) {
  const writerLookup = useMemo(
    () => Object.fromEntries(writers.map((writer) => [writer.id, writer])),
    [writers]
  );

  const [threadMap, setThreadMap] = useState<Record<string, ThreadState>>(() => {
    const initial: Record<string, ThreadState> = {};
    initialThreads.forEach((thread) => {
      initial[thread.threadId] = {
        summary: thread,
        messages: getThreadMessages(thread.threadId),
      };
    });
    return initial;
  });
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(
    initialThreads[0]?.threadId ?? null
  );
  const [messageDraft, setMessageDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedThreadId) return;
    const interval = window.setInterval(() => {
      const newMessages = pollScheduledMessages(selectedThreadId);
      if (newMessages.length > 0) {
        setThreadMap((previous) => {
          const state = previous[selectedThreadId];
          if (!state) return previous;
          const updatedMessages = [...state.messages, ...newMessages];
          const latestMessage = updatedMessages[updatedMessages.length - 1];
          return {
            ...previous,
            [selectedThreadId]: {
              summary: {
                ...state.summary,
                latestMessage,
              },
              messages: updatedMessages,
            },
          };
        });
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [selectedThreadId]);

  const threads = useMemo(
    () =>
      Object.values(threadMap).sort(
        (a, b) =>
          new Date(b.summary.latestMessage.createdAt).getTime() -
          new Date(a.summary.latestMessage.createdAt).getTime()
      ),
    [threadMap]
  );
  const selectedThread = selectedThreadId ? threadMap[selectedThreadId] : undefined;

  const currentParticipant = selectedThread
    ? selectedThread.summary.participant
    : selectedThreadId
      ? writerLookup[selectedThreadId.split("__").find((id) => id !== currentUserId) ?? ""]
      : undefined;

  const recommendedCollaborations: AggregatedWork[] = useMemo(() => {
    const publishedWorks = works.filter((work) => work.status === "published");
    if (!currentParticipant) return publishedWorks.slice(0, 2);
    return publishedWorks.filter((work) => work.writerId === currentParticipant.id).slice(0, 2);
  }, [currentParticipant, works]);

  const handleSelectThread = (threadId: string) => {
    setSelectedThreadId(threadId);
    setError(null);
    setMessageDraft("");
  };

  const handleStartConversation = (writer: WriterProfile) => {
    const threadId = createThreadId(currentUserId, writer.id);
    setThreadMap((previous) => {
      if (previous[threadId]) {
        return previous;
      }
      const placeholderMessage: DirectMessage = {
        id: `placeholder-${threadId}`,
        threadId,
        senderId: writer.id,
        receiverId: currentUserId,
        body: `${writer.name} is ready to collaborate—say hello!`,
        createdAt: new Date().toISOString(),
        read: true,
      };
      return {
        ...previous,
        [threadId]: {
          summary: {
            threadId,
            participant: writer,
            latestMessage: placeholderMessage,
          },
          messages: [placeholderMessage],
        },
      };
    });
    setSelectedThreadId(threadId);
    setMessageDraft("");
    setError(null);
  };

  const handleSendMessage = () => {
    if (!selectedThreadId || !selectedThread) {
      setError("Select a conversation to send a message.");
      return;
    }
    const trimmed = messageDraft.trim();
    if (!trimmed) {
      setError("Message cannot be empty.");
      return;
    }

    const participant = selectedThread.summary.participant;
    if (!canMessage(currentUserId, participant.id)) {
      setError("This writer’s inbox is restricted.");
      return;
    }

    const message: DirectMessage = {
      id: `local-${Date.now()}`,
      threadId: selectedThreadId,
      senderId: currentUserId,
      receiverId: participant.id,
      body: trimmed,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setThreadMap((previous) => {
      const state = previous[selectedThreadId];
      if (!state) return previous;
      const updatedMessages = [...state.messages, message];
      return {
        ...previous,
        [selectedThreadId]: {
          summary: {
            ...state.summary,
            latestMessage: message,
          },
          messages: updatedMessages,
        },
      };
    });

    setMessageDraft("");
    setError(null);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <aside
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
        aria-label="Conversations"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          Threads
        </h2>
        <ul className="space-y-2">
          {threads.map(({ summary }) => {
            const isActive = summary.threadId === selectedThreadId;
            return (
              <li key={summary.threadId}>
                <button
                  type="button"
                  onClick={() => handleSelectThread(summary.threadId)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                    isActive
                      ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:border-emerald-400 dark:bg-emerald-900/40 dark:text-emerald-100"
                      : "border-transparent bg-neutral-100/60 text-neutral-700 hover:bg-neutral-200 dark:bg-neutral-800/60 dark:text-neutral-200"
                  }`}
                >
                  <p className="font-semibold">{summary.participant.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    {summary.latestMessage.body.slice(0, 80)}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="space-y-3" aria-label="Start a new conversation">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            New message
          </h3>
          <ul className="space-y-2">
            {writers
              .filter((writer) => writer.id !== currentUserId)
              .map((writer) => {
                const allowed = canMessage(currentUserId, writer.id);
                return (
                  <li key={writer.id}>
                    <button
                      type="button"
                      onClick={() => handleStartConversation(writer)}
                      disabled={!allowed}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${
                        allowed
                          ? "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
                          : "border-neutral-200 bg-neutral-100 text-neutral-400 opacity-60 dark:border-neutral-800 dark:bg-neutral-900"
                      }`}
                    >
                      <p className="font-semibold">{writer.name}</p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {allowed ? "Start conversation" : "Messaging restricted"}
                      </p>
                    </button>
                  </li>
                );
              })}
          </ul>
        </div>
      </aside>

      <section
        className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
        aria-label="Message thread"
      >
        {selectedThread && (
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                Conversation with {selectedThread.summary.participant.name}
              </h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                Last message{" "}
                {new Date(selectedThread.summary.latestMessage.createdAt).toLocaleString()}
              </p>
            </div>
          </header>
        )}

        <div className="space-y-3" role="log" aria-live="polite">
          {selectedThread ? (
            selectedThread.messages.map((message) => {
              const isCurrentUser = message.senderId === currentUserId;
              return (
                <p
                  key={message.id}
                  className={`max-w-xl rounded-2xl px-4 py-2 text-sm ${
                    isCurrentUser
                      ? "ml-auto bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  }`}
                >
                  <span className="block text-xs uppercase tracking-wide">
                    {isCurrentUser ? "You" : (writerLookup[message.senderId]?.name ?? "Writer")}
                  </span>
                  {message.body}
                </p>
              );
            })
          ) : (
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Select a conversation to see messages.
            </p>
          )}
        </div>

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            handleSendMessage();
          }}
        >
          <label
            className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300"
            htmlFor="message-draft"
          >
            Write a message
          </label>
          <textarea
            id="message-draft"
            value={messageDraft}
            onChange={(event) => setMessageDraft(event.target.value)}
            rows={3}
            placeholder={
              selectedThread ? "Share an update or ask a question" : "Select a contact to start"
            }
            className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          />
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            Send message
          </button>
        </form>

        <div className="space-y-3" aria-label="Suggested collaborations">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
            Suggested collaborations
          </h3>
          <div className="space-y-3">
            {recommendedCollaborations.map((work) => (
              <WorkCard key={`collab-${work.id}`} work={work} variant="horizontal" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

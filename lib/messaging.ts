import {
  aggregatedWorks,
  directMessages,
  scheduledMessages,
  writers,
} from "@/data/sampleData";
import {
  AggregatedWork,
  DirectMessage,
  MessagingPreference,
  WriterProfile,
} from "@/types";

export function createThreadId(userA: string, userB: string): string {
  return [userA, userB].sort().join("__");
}

const scheduleBoot = Date.now();
const deliveredMessages = new Set<string>();

export function canMessage(senderId: string, receiverId: string): boolean {
  if (senderId === receiverId) return false;
  const sender = writers.find((writer) => writer.id === senderId);
  const receiver = writers.find((writer) => writer.id === receiverId);
  if (!sender || !receiver) return false;

  const preference: MessagingPreference = receiver.messagingPreference;

  if (preference === "anyone") return true;

  const isFollower = receiver.network.followers.includes(senderId);
  if (preference === "followers") {
    return isFollower;
  }

  const receiverFollowsSender = receiver.network.following.includes(senderId);
  const senderFollowsReceiver = sender.network.following.includes(receiverId);
  return isFollower && receiverFollowsSender && senderFollowsReceiver;
}

export function getThreadMessages(threadId: string): DirectMessage[] {
  const historical = directMessages.filter(
    (message) => message.threadId === threadId,
  );
  const delivered = scheduledMessages
    .filter(
      (item) =>
        item.message.threadId === threadId && deliveredMessages.has(item.message.id),
    )
    .map((item) => item.message);

  return [...historical, ...delivered].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function pollScheduledMessages(threadId: string): DirectMessage[] {
  const now = Date.now();
  const ready = scheduledMessages
    .filter((entry) => entry.message.threadId === threadId)
    .filter((entry) => now - scheduleBoot >= entry.delayMs)
    .filter((entry) => !deliveredMessages.has(entry.message.id))
    .map((entry) => entry.message)
    .sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

  ready.forEach((message) => deliveredMessages.add(message.id));
  return ready;
}

export interface MessageThreadSummary {
  threadId: string;
  participant: WriterProfile;
  latestMessage: DirectMessage;
}

export function getThreadsForWriter(writerId: string): MessageThreadSummary[] {
  const allMessages = [
    ...directMessages,
    ...scheduledMessages.map((entry) => entry.message),
  ];

  const threads = new Map<string, DirectMessage[]>();
  allMessages.forEach((message) => {
    if (message.senderId !== writerId && message.receiverId !== writerId) {
      return;
    }
    const thread = threads.get(message.threadId) ?? [];
    thread.push(message);
    threads.set(message.threadId, thread);
  });

  return Array.from(threads.entries())
    .map(([threadId, messages]) => {
      const latest = messages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )[0];
      const participantId =
        latest.senderId === writerId ? latest.receiverId : latest.senderId;
      const participant = writers.find((writer) => writer.id === participantId);
      if (!participant || !latest) {
        return null;
      }
      return {
        threadId,
        participant,
        latestMessage: latest,
      } satisfies MessageThreadSummary;
    })
    .filter(Boolean) as MessageThreadSummary[];
}

export function findWorkById(workId: string): AggregatedWork | undefined {
  return aggregatedWorks.find((work) => work.id === workId);
}

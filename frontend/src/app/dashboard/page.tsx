import type { Metadata } from "next";
import {
  comments,
  directMessages,
  marketplaceEvents,
  notifications,
  writers,
} from "@/data/sampleData";
import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { currentUser, currentUserId } from "@/lib/session";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Notifications and activity feed summarising comments, messages, and marketplace milestones for your writing profile.",
};

const writerLookup = Object.fromEntries(writers.map((writer) => [writer.id, writer]));

export default function DashboardPage() {
  const userNotifications = notifications.filter((notification) => {
    if (notification.type === "message") {
      return notification.subjectId === currentUserId;
    }
    return notification.type === "comment" || notification.type === "marketplace";
  });

  const unreadThreads = directMessages.filter(
    (message) => message.receiverId === currentUserId && !message.read
  );

  const aggregated = listAggregatedWorks();
  const workLookup = Object.fromEntries(aggregated.map((work) => [work.id, work] as const));

  const latestWorks = aggregated.filter((work) => work.writerId === currentUserId).slice(0, 3);

  const activityFeed = [
    ...comments.map((comment) => ({
      id: `activity-comment-${comment.id}`,
      type: "comment" as const,
      createdAt: comment.createdAt,
      summary: `${writerLookup[comment.authorId]?.name ?? "Community member"} commented on ${workLookup[comment.workId]?.title ?? "a work"}`,
    })),
    ...marketplaceEvents.map((event) => ({
      id: `activity-event-${event.id}`,
      type: event.type,
      createdAt: event.createdAt,
      summary: event.description,
    })),
    ...unreadThreads.map((message) => ({
      id: `activity-message-${message.id}`,
      type: "message" as const,
      createdAt: message.createdAt,
      summary: `${writerLookup[message.senderId]?.name ?? "Writer"} sent a new message`,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="space-y-12">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-[0.3em] text-neutral-500 dark:text-neutral-400">
          Dashboard
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900 dark:text-neutral-50">
          Welcome back, {currentUser.name}
        </h1>
        <p className="max-w-2xl text-neutral-600 dark:text-neutral-300">
          Monitor new comments, keep track of direct messages, and follow marketplace momentum for
          your recent publications.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2" aria-labelledby="dashboard-highlights">
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2
            id="dashboard-highlights"
            className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
          >
            Notifications
          </h2>
          <ul className="space-y-3">
            {userNotifications.map((notification) => (
              <li
                key={notification.id}
                className="rounded-lg bg-neutral-100/60 px-4 py-3 text-sm text-neutral-700 dark:bg-neutral-800/70 dark:text-neutral-200"
              >
                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                  <span>{notification.type}</span>
                  <time dateTime={notification.createdAt}>
                    {new Date(notification.createdAt).toLocaleString()}
                  </time>
                </div>
                <p className="mt-2 font-medium">{notification.summary}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            Unread messages
          </h2>
          {unreadThreads.length === 0 ? (
            <p className="text-sm text-neutral-600 dark:text-neutral-400">All caught up!</p>
          ) : (
            <ul className="space-y-3">
              {unreadThreads.map((message) => (
                <li
                  key={message.id}
                  className="rounded-lg bg-sky-100/60 px-4 py-3 text-sm text-neutral-700 dark:bg-sky-900/60 dark:text-neutral-200"
                >
                  <p className="font-semibold">
                    {writerLookup[message.senderId]?.name ?? "Writer"}
                  </p>
                  <p className="text-sm">{message.body}</p>
                  <time
                    className="mt-1 block text-xs uppercase tracking-wide"
                    dateTime={message.createdAt}
                  >
                    {new Date(message.createdAt).toLocaleString()}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section
        className="rounded-2xl border border-neutral-200 bg-white/80 p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
        aria-labelledby="activity-feed"
      >
        <h2
          id="activity-feed"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Activity feed
        </h2>
        <ul className="mt-4 space-y-4">
          {activityFeed.slice(0, 6).map((activity) => (
            <li
              key={activity.id}
              className="border-l-4 border-emerald-500 bg-neutral-100/60 px-4 py-3 text-sm text-neutral-700 dark:bg-neutral-800/60 dark:text-neutral-200"
            >
              <div className="flex items-center justify-between text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                <span>{activity.type}</span>
                <time dateTime={activity.createdAt}>
                  {new Date(activity.createdAt).toLocaleString()}
                </time>
              </div>
              <p className="mt-2 font-medium">{activity.summary}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4" aria-labelledby="draft-preview">
        <h2
          id="draft-preview"
          className="text-lg font-semibold text-neutral-900 dark:text-neutral-100"
        >
          Your recent works
        </h2>
        {latestWorks.length === 0 ? (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            You haven’t published any works yet.
          </p>
        ) : (
          <div className="space-y-3">
            {latestWorks.map((work) => (
              <article
                key={work.id}
                className="rounded-xl border border-neutral-200 bg-white/80 p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900/70"
              >
                <header className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {work.title}
                  </h3>
                  <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-semibold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200">
                    {work.status}
                  </span>
                </header>
                <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
                  {work.summary}
                </p>
                <dl className="mt-3 grid grid-cols-3 gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                  <div>
                    <dt className="font-semibold text-neutral-700 dark:text-neutral-300">Likes</dt>
                    <dd>{work.likes}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Bookmarks
                    </dt>
                    <dd>{work.bookmarks}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-neutral-700 dark:text-neutral-300">
                      Updated
                    </dt>
                    <dd>{new Date(work.updatedAt).toLocaleDateString()}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { Header } from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";
import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { BookCover } from "@/components/BookCover";
import type { AggregatedWork } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Activity {
  id: string;
  activityType: "book_published" | "review_created" | "follow_created" | "follow_removed" | "story_published";
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  metadata?: Record<string, any>;
}

export default function FeedPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchFeed();
  }, [token]);

  async function fetchFeed() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/feed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivities(res.data.activities || []);
    } catch (err: any) {
      console.error("Failed to fetch feed:", err);
      setError(err.response?.data?.message || "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }

  // Get recommended works for readers
  const allWorks = listAggregatedWorks();
  const publishedWorks = allWorks.filter((w: AggregatedWork) => w.status === "published");
  const recommended = publishedWorks.slice(0, 6);

  const renderActivity = (activity: Activity) => {
    const activityUser = activity.user;
    const username = activityUser?.username || "Unknown user";
    const avatar = activityUser?.avatar;

    let content = null;

    switch (activity.activityType) {
      case "book_published":
        content = (
          <>
            published a new book{" "}
            {activity.metadata?.bookTitle && (
              <span className="font-semibold">{activity.metadata.bookTitle}</span>
            )}
          </>
        );
        break;
      case "story_published":
        content = <>published a new story</>;
        break;
      case "review_created":
        content = (
          <>
            left a{" "}
            {activity.metadata?.rating && (
              <span className="text-neon-cyan">
                {activity.metadata.rating}★
              </span>
            )}{" "}
            review
          </>
        );
        break;
      case "follow_created":
        content = <>followed a new writer</>;
        break;
      default:
        content = <>had an activity</>;
    }

    return (
      <div key={activity.id} className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
        <div className="flex gap-3">
          {avatar && (
            <img
              src={avatar}
              alt={username}
              className="w-12 h-12 rounded-full object-cover"
            />
          )}
          <div className="flex-1">
            <div className="mb-1">
              <Link href={`/writers/${username}`} className="font-semibold hover:text-neon-purple transition-colors">
                {username}
              </Link>{" "}
              <span className="text-white/70">{content}</span>
            </div>
            <div className="text-white/40 text-sm">
              {new Date(activity.createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12] pt-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-purple"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12] pt-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center py-32 text-red-300">{error}</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12] pt-24 px-6 pb-16">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-5xl font-bold mb-12">Your Feed</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-16 px-6 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-white/60 mb-6 text-lg">
                    No activities yet. Start following writers to see their updates!
                  </p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all"
                  >
                    Discover Stories
                  </Link>
                </div>
              ) : (
                activities.map((activity) => renderActivity(activity))
              )}
            </div>

            {/* Sidebar - Recommended */}
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                <h2 className="text-xl font-bold mb-4">Recommended for You</h2>
                <div className="space-y-4">
                  {recommended.map((work) => (
                    <Link
                      key={work.id}
                      href={`/works/${work.slug}`}
                      className="flex gap-3 group"
                    >
                      <BookCover
                        title={work.title}
                        author={work.writer.name}
                        size="sm"
                        className="flex-shrink-0 group-hover:scale-105 transition-transform"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium line-clamp-2 mb-1 group-hover:text-neon-purple transition-colors">
                          {work.title}
                        </h3>
                        <p className="text-xs text-white/50">{work.writer.name}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Activity {
  id: string;
  activityType: 'book_published' | 'review_created' | 'follow_created' | 'follow_removed' | 'story_published';
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatar?: string | null;
  };
  metadata?: Record<string, any>;
}

export default function FeedPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

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
      console.error('Failed to fetch feed:', err);
      setError(err.response?.data?.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  }

  const renderActivity = (activity: Activity) => {
    const user = activity.user;
    const username = user?.username || 'Unknown user';
    const avatar = user?.avatar;

    let content = null;

    switch (activity.activityType) {
      case 'book_published':
        content = (
          <>
            published a new book{' '}
            {activity.metadata?.bookTitle && (
              <span className="font-semibold">{activity.metadata.bookTitle}</span>
            )}
          </>
        );
        break;
      case 'story_published':
        content = <>published a new story</>;
        break;
      case 'review_created':
        content = (
          <>
            left a{' '}
            {activity.metadata?.rating && (
              <span className="text-yellow-500">
                {activity.metadata.rating}★
              </span>
            )}{' '}
            review
          </>
        );
        break;
      case 'follow_created':
        content = <>followed a new writer</>;
        break;
      default:
        content = <>had an activity</>;
    }

    return (
      <div key={activity.id} className="border p-4 rounded-lg hover:bg-gray-50 transition">
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
              <Link href={`/writers/${username}`} className="font-semibold hover:underline">
                {username}
              </Link>{' '}
              {content}
            </div>
            <div className="text-gray-500 text-sm">
              {new Date(activity.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center py-12">
          <h1 className="text-3xl font-bold mb-4">Your Feed</h1>
          <p className="text-gray-600 mb-6">
            Please log in to view your personalized feed
          </p>
          <Link
            href="/auth/login"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Feed</h1>
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Your Feed</h1>
        <div className="text-center py-12 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Your Feed</h1>

      {activities.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            No activities yet. Start following authors to see their updates!
          </p>
          <Link
            href="/marketplace"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-semibold"
          >
            Discover Books
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => renderActivity(activity))}
        </div>
      )}
    </div>
  );
}

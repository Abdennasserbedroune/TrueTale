'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface TrendingBook {
  id: string;
  title: string;
  slug?: string;
  coverImage?: string;
  description?: string;
  price: number;
  averageRating: number;
  reviewCount: number;
  trendScore: number;
  recentReviewCount: number;
  author?: {
    id: string;
    username: string;
    avatar?: string;
  };
}

interface TrendingBooksProps {
  limit?: number;
  days?: number;
}

export function TrendingBooks({ limit = 10, days = 7 }: TrendingBooksProps) {
  const [books, setBooks] = useState<TrendingBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTrendingBooks();
  }, [limit, days]);

  async function fetchTrendingBooks() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/feed/trending`, {
        params: { limit, days },
      });
      setBooks(res.data || []);
    } catch (err: any) {
      console.error('Failed to fetch trending books:', err);
      setError(err.response?.data?.message || 'Failed to load trending books');
    } finally {
      setLoading(false);
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5 text-yellow-500 text-sm">
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= Math.round(rating) ? '' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">Loading trending books...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No trending books found</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">🔥 Trending Books</h2>
        <span className="text-sm text-gray-500">Last {days} days</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book, index) => (
          <Link
            key={book.id}
            href={`/books/${book.slug || book.id}`}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition group"
          >
            <div className="relative">
              {book.coverImage ? (
                <img
                  src={book.coverImage}
                  alt={book.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400 text-sm">No cover</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-orange-500 text-white px-2 py-1 rounded text-xs font-bold">
                #{index + 1}
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 transition line-clamp-2">
                {book.title}
              </h3>

              {book.author && (
                <p className="text-sm text-gray-600 mb-2">by {book.author.username}</p>
              )}

              <div className="flex items-center gap-2 mb-2">
                {renderStars(book.averageRating)}
                <span className="text-sm text-gray-600">
                  {book.averageRating.toFixed(1)} ({book.reviewCount})
                </span>
              </div>

              {book.recentReviewCount > 0 && (
                <div className="text-xs text-green-600 mb-2">
                  +{book.recentReviewCount} new reviews
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-blue-600">
                  ${book.price.toFixed(2)}
                </span>
                <span className="text-xs text-gray-500">
                  Score: {book.trendScore.toFixed(1)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

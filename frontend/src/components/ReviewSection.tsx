'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Review {
  id: string;
  rating: number;
  reviewText: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatar?: string | null;
  };
}

interface ReviewStats {
  averageRating: number;
  reviewCount: number;
  distribution: Record<string, number>;
}

interface ReviewSectionProps {
  bookId: string;
}

export function ReviewSection({ bookId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [newReview, setNewReview] = useState({ rating: 5, reviewText: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  async function fetchReviews() {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/books/${bookId}`);
      
      if (res.data.reviews) {
        setReviews(res.data.reviews.data || []);
        setStats(res.data.reviews.stats || null);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitReview(e: React.FormEvent) {
    e.preventDefault();
    
    if (!token) {
      setError('Please log in to post a review');
      return;
    }

    if (!newReview.reviewText.trim()) {
      setError('Please write a review');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await axios.post(
        `${API_URL}/api/books/${bookId}/review`,
        newReview,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNewReview({ rating: 5, reviewText: '' });
      await fetchReviews();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to post review');
    } finally {
      setSubmitting(false);
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'text-2xl' : 'text-base';
    return (
      <div className={`flex gap-0.5 ${sizeClass}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={i <= rating ? 'text-yellow-500' : 'text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="mt-8 text-center">Loading reviews...</div>;
  }

  return (
    <div className="mt-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Reviews</h2>
        {stats && (
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              {renderStars(Math.round(stats.averageRating), 'lg')}
              <span className="text-2xl font-semibold">{stats.averageRating.toFixed(1)}</span>
            </div>
            <span className="text-gray-600">({stats.reviewCount} reviews)</span>
          </div>
        )}
      </div>

      {token && (
        <form onSubmit={handleSubmitReview} className="bg-gray-50 p-6 rounded-lg mb-6 border">
          <h3 className="font-semibold mb-4 text-lg">Write a Review</h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block font-semibold mb-2">Your Rating</label>
            <select
              value={newReview.rating}
              onChange={(e) => setNewReview({ ...newReview, rating: parseInt(e.target.value) })}
              className="px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5 - Excellent</option>
              <option value="4">4 - Very Good</option>
              <option value="3">3 - Good</option>
              <option value="2">2 - Fair</option>
              <option value="1">1 - Poor</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block font-semibold mb-2">Your Review</label>
            <textarea
              value={newReview.reviewText}
              onChange={(e) => setNewReview({ ...newReview, reviewText: e.target.value })}
              placeholder="Share your thoughts about this book..."
              maxLength={1000}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              required
            />
            <div className="text-sm text-gray-500 mt-1">
              {newReview.reviewText.length}/1000 characters
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {submitting ? 'Posting...' : 'Post Review'}
          </button>
        </form>
      )}

      {!token && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-6 text-center">
          <p className="text-blue-800">
            Please <a href="/auth/login" className="underline font-semibold">log in</a> to post a review
          </p>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="border p-4 rounded-lg hover:bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-3">
                  {review.user.avatar && (
                    <img
                      src={review.user.avatar}
                      alt={review.user.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <span className="font-semibold">{review.user.username}</span>
                    {renderStars(review.rating)}
                  </div>
                </div>
                <small className="text-gray-600">
                  {new Date(review.createdAt).toLocaleDateString()}
                </small>
              </div>
              <p className="text-gray-700 leading-relaxed">{review.reviewText}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

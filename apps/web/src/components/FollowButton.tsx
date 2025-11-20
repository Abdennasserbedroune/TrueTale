'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface FollowButtonProps {
  writerId: string;
  onFollowChange?: (isFollowing: boolean) => void;
}

export function FollowButton({ writerId, onFollowChange }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  useEffect(() => {
    checkFollowStatus();
  }, [writerId]);

  async function checkFollowStatus() {
    try {
      setChecking(true);
      const res = await axios.get(`${API_URL}/api/follow/${writerId}/check`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setIsFollowing(res.data.isFollowing);
    } catch (err) {
      console.error('Failed to check follow status:', err);
    } finally {
      setChecking(false);
    }
  }

  async function handleFollow() {
    if (!token) {
      alert('Please log in to follow writers');
      return;
    }

    setLoading(true);

    try {
      if (isFollowing) {
        await axios.delete(`${API_URL}/api/follow/${writerId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await axios.post(
          `${API_URL}/api/follow/${writerId}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (err: any) {
      console.error('Failed to toggle follow:', err);
      alert(err.response?.data?.message || 'Failed to update follow status');
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <button
        disabled
        className="px-4 py-2 border rounded-md text-sm font-semibold opacity-50 cursor-not-allowed"
      >
        Loading...
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      className={`px-4 py-2 rounded-md text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed ${
        isFollowing
          ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          : 'bg-blue-600 text-white hover:bg-blue-700'
      }`}
    >
      {loading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
    </button>
  );
}

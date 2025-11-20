"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Profile {
  username: string;
  name?: string;
  bio?: string;
  avatar?: string;
  location?: string;
  socials?: {
    website?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  role: string;
  followers: number;
  following: number;
  bookCount: number;
  createdAt: string;
}

export default function ProfilePage() {
  const params = useParams();
  const username = params?.username as string;
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await axios.get(`${API_URL}/api/users/${username}`);
        setProfile(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    if (username) {
      fetchProfile();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">User not found</h1>
          <p className="text-gray-600">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline mt-4 inline-block">
            Go home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-start gap-6 mb-6">
            {profile.avatar ? (
              <Image
                src={profile.avatar}
                alt={profile.username}
                width={128}
                height={128}
                className="rounded-full object-cover"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center text-3xl font-bold text-gray-600">
                {profile.username[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{profile.name || profile.username}</h1>
              <p className="text-gray-600">@{profile.username}</p>
              {profile.location && (
                <p className="text-gray-600 mt-1">📍 {profile.location}</p>
              )}
              <div className="mt-4 flex gap-6 text-sm">
                <div>
                  <strong className="text-lg">{profile.bookCount}</strong>
                  <span className="text-gray-600 ml-1">
                    {profile.bookCount === 1 ? "Book" : "Books"}
                  </span>
                </div>
                <div>
                  <strong className="text-lg">{profile.followers}</strong>
                  <span className="text-gray-600 ml-1">
                    {profile.followers === 1 ? "Follower" : "Followers"}
                  </span>
                </div>
                <div>
                  <strong className="text-lg">{profile.following}</strong>
                  <span className="text-gray-600 ml-1">Following</span>
                </div>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  {profile.role === "writer" ? "Writer" : "Reader"}
                </span>
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">About</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {profile.socials && Object.keys(profile.socials).some((key) => profile.socials?.[key as keyof typeof profile.socials]) && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Connect</h2>
              <div className="flex gap-3 flex-wrap">
                {profile.socials.website && (
                  <a
                    href={profile.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🌐 Website
                  </a>
                )}
                {profile.socials.twitter && (
                  <a
                    href={`https://twitter.com/${profile.socials.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🐦 Twitter
                  </a>
                )}
                {profile.socials.instagram && (
                  <a
                    href={`https://instagram.com/${profile.socials.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📷 Instagram
                  </a>
                )}
                {profile.socials.facebook && (
                  <a
                    href={`https://facebook.com/${profile.socials.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    👥 Facebook
                  </a>
                )}
                {profile.socials.youtube && (
                  <a
                    href={`https://youtube.com/${profile.socials.youtube}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    📹 YouTube
                  </a>
                )}
                {profile.socials.tiktok && (
                  <a
                    href={`https://tiktok.com/@${profile.socials.tiktok}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    🎵 TikTok
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    role: "reader" as "reader" | "writer",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("Not authenticated");
        router.push("/login");
        return;
      }

      // Update profile
      await axios.put(
        `${API_URL}/api/users`,
        {
          name: formData.name,
          bio: formData.bio,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Update role
      await axios.put(
        `${API_URL}/api/users/role`,
        {
          role: formData.role,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-2">Complete Your Profile</h1>
        <p className="text-gray-600 mb-6">Tell us a bit about yourself to get started</p>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block font-semibold mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Your name"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold mb-2">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Tell us about yourself (max 500 chars)"
              maxLength={500}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />
            <small className="text-gray-500">{formData.bio.length}/500</small>
          </div>

          <div>
            <label className="block font-semibold mb-2">What do you want to do?</label>
            <div className="space-y-3">
              <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="reader"
                  checked={formData.role === "reader"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "reader" | "writer" })
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Reader</div>
                  <div className="text-sm text-gray-600">
                    Discover and read amazing stories
                  </div>
                </div>
              </label>
              <label className="flex items-center p-4 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="role"
                  value="writer"
                  checked={formData.role === "writer"}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "reader" | "writer" })
                  }
                  className="mr-3"
                />
                <div>
                  <div className="font-semibold">Writer</div>
                  <div className="text-sm text-gray-600">
                    Publish and sell your books
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 disabled:opacity-50 font-semibold"
          >
            {loading ? "Saving..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

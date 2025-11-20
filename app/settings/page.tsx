"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

type Tab = "profile" | "email" | "password" | "notifications" | "account";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [profileData, setProfileData] = useState({
    name: "",
    bio: "",
    location: "",
    socials: {
      website: "",
      twitter: "",
      instagram: "",
      facebook: "",
      youtube: "",
      tiktok: "",
    },
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailUpdates: true,
    newFollowers: true,
    bookReviews: true,
    orderNotifications: true,
  });

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setProfileData({
          name: res.data.name || "",
          bio: res.data.bio || "",
          location: res.data.location || "",
          socials: res.data.socials || {
            website: "",
            twitter: "",
            instagram: "",
            facebook: "",
            youtube: "",
            tiktok: "",
          },
        });
        setNotificationPrefs(
          res.data.notificationPreferences || {
            emailUpdates: true,
            newFollowers: true,
            bookReviews: true,
            orderNotifications: true,
          }
        );
      } catch (err) {
        console.error("Failed to fetch user");
        router.push("/login");
      }
    }
    fetchUser();
  }, [router]);

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(`${API_URL}/api/users`, profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Profile updated successfully!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangeEmail(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData(e.currentTarget);
      const newEmail = formData.get("newEmail") as string;

      await axios.put(
        `${API_URL}/api/users/email`,
        { newEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Email updated. Check your new email for verification.");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      const formData = new FormData(e.currentTarget);
      const oldPassword = formData.get("oldPassword") as string;
      const newPassword = formData.get("newPassword") as string;
      const confirmPassword = formData.get("confirmPassword") as string;

      if (newPassword !== confirmPassword) {
        setMessage("New passwords do not match");
        setLoading(false);
        return;
      }

      await axios.put(
        `${API_URL}/api/users/password`,
        { oldPassword, newPassword },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Password changed. Please login again.");
      setTimeout(() => {
        localStorage.removeItem("accessToken");
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateNotifications(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.put(
        `${API_URL}/api/users`,
        { notificationPreferences: notificationPrefs },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Notification preferences updated!");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestDeletion() {
    if (!confirm("Are you sure? Your account will be deleted in 30 days.")) {
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${API_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Account deletion scheduled for 30 days from now.");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelDeletion() {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("accessToken");
      await axios.post(
        `${API_URL}/api/users/cancel-deletion`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("Account deletion cancelled.");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Account Settings</h1>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="flex border-b overflow-x-auto">
            {(["profile", "email", "password", "notifications", "account"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setMessage("");
                }}
                className={`px-6 py-4 capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? "border-b-2 border-blue-600 font-semibold text-blue-600"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="p-6">
            {message && (
              <div
                className={`p-3 rounded mb-4 ${
                  message.includes("failed") || message.includes("not match")
                    ? "bg-red-100 text-red-700"
                    : "bg-green-100 text-green-700"
                }`}
              >
                {message}
              </div>
            )}

            {activeTab === "profile" && (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-2">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    maxLength={500}
                    rows={4}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <small className="text-gray-500">{profileData.bio.length}/500</small>
                </div>

                <div>
                  <label className="block font-semibold mb-2">Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Social Links</h3>
                  <div className="space-y-2">
                    {Object.keys(profileData.socials).map((social) => (
                      <div key={social}>
                        <label className="block text-sm text-gray-600 mb-1 capitalize">
                          {social}
                        </label>
                        <input
                          type="text"
                          value={profileData.socials[social as keyof typeof profileData.socials]}
                          onChange={(e) =>
                            setProfileData({
                              ...profileData,
                              socials: {
                                ...profileData.socials,
                                [social]: e.target.value,
                              },
                            })
                          }
                          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder={social === "website" ? "https://example.com" : `@username`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Profile"}
                </button>
              </form>
            )}

            {activeTab === "email" && (
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Current Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className="w-full px-4 py-2 border rounded bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">New Email</label>
                  <input
                    type="email"
                    name="newEmail"
                    required
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Email"}
                </button>
              </form>
            )}

            {activeTab === "password" && (
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-2">Current Password</label>
                  <input
                    type="password"
                    name="oldPassword"
                    required
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Change Password"}
                </button>
              </form>
            )}

            {activeTab === "notifications" && (
              <form onSubmit={handleUpdateNotifications} className="space-y-4">
                <div className="space-y-3">
                  {Object.keys(notificationPrefs).map((pref) => (
                    <label key={pref} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={notificationPrefs[pref as keyof typeof notificationPrefs]}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            [pref]: e.target.checked,
                          })
                        }
                        className="mr-3"
                      />
                      <span className="capitalize">
                        {pref.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                    </label>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Updating..." : "Update Preferences"}
                </button>
              </form>
            )}

            {activeTab === "account" && (
              <div className="space-y-6">
                <div className="border border-red-300 rounded p-4 bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">Delete Account</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Once you delete your account, there is no going back. Your account will be
                    scheduled for deletion in 30 days. You can cancel within this period.
                  </p>
                  {user.deletionRequestedAt ? (
                    <div>
                      <p className="text-sm text-red-700 mb-2">
                        Account deletion scheduled for{" "}
                        {new Date(
                          new Date(user.deletionRequestedAt).getTime() + 30 * 24 * 60 * 60 * 1000
                        ).toLocaleDateString()}
                      </p>
                      <button
                        onClick={handleCancelDeletion}
                        disabled={loading}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {loading ? "Cancelling..." : "Cancel Deletion"}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleRequestDeletion}
                      disabled={loading}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {loading ? "Processing..." : "Delete My Account"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

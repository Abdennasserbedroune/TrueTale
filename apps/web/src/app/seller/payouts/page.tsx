"use client";
import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface PayoutInfo {
  amountCents: number;
  eligible: boolean;
  message: string;
  unpaidOrderCount: number;
  settings: {
    frequency: string;
    minimumThreshold: number;
  };
  stripeConnected: boolean;
  stripeOnboardingComplete: boolean;
}

interface Payout {
  _id: string;
  amountCents: number;
  currency: string;
  status: string;
  createdAt: string;
  paidAt?: string;
  stripePayoutId?: string;
}

export default function PayoutsPage() {
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingSettings, setEditingSettings] = useState(false);
  const [frequency, setFrequency] = useState("weekly");
  const [minimumThreshold, setMinimumThreshold] = useState(5000);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    fetchData();
  }, [token]);

  async function fetchData() {
    if (!token) {
      setError("Please log in to view payouts");
      setLoading(false);
      return;
    }

    try {
      const [infoRes, payoutsRes] = await Promise.all([
        axios.get(`${API_URL}/api/v1/seller/dashboard/payout-info`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/v1/seller/dashboard/payouts`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setPayoutInfo(infoRes.data);
      setPayouts(payoutsRes.data.payouts || payoutsRes.data);
      setFrequency(infoRes.data.settings?.frequency || "weekly");
      setMinimumThreshold(infoRes.data.settings?.minimumThreshold || 5000);
    } catch (err: any) {
      console.error("Error fetching payout data:", err);
      setError(err.response?.data?.error || "Failed to load payouts");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateSettings() {
    if (!token) return;

    try {
      await axios.put(
        `${API_URL}/api/v1/seller/dashboard/payout-settings`,
        {
          frequency,
          minimumThreshold: parseInt(minimumThreshold.toString()),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEditingSettings(false);
      fetchData();
    } catch (err: any) {
      console.error("Error updating settings:", err);
      alert(err.response?.data?.error || "Failed to update settings");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-32 bg-gray-200 rounded mb-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !payoutInfo) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700">{error || "Failed to load payouts"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Payouts</h1>
          <a
            href="/seller/dashboard"
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Back to Dashboard
          </a>
        </div>

        {/* Stripe Connection Warning */}
        {!payoutInfo.stripeConnected && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">
              Connect Stripe Account
            </h3>
            <p className="text-yellow-700 mb-3">
              You need to connect your Stripe account to receive payouts.
            </p>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700">
              Connect Stripe
            </button>
          </div>
        )}

        {/* Pending Payout Card */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-300 rounded-lg p-6 mb-6 shadow">
          <h2 className="font-bold text-blue-900 text-lg mb-2">
            Pending Payout
          </h2>
          <div className="text-4xl font-bold text-blue-900 mb-2">
            ${(payoutInfo.amountCents / 100).toFixed(2)}
          </div>
          <div className="text-sm text-blue-700 mb-3">
            From {payoutInfo.unpaidOrderCount} unpaid orders
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`px-3 py-1 rounded text-sm font-medium ${
                payoutInfo.eligible
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {payoutInfo.message}
            </div>
          </div>
        </div>

        {/* Payout Settings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Payout Settings</h2>
            {!editingSettings && (
              <button
                onClick={() => setEditingSettings(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Edit
              </button>
            )}
          </div>

          {editingSettings ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payout Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Threshold (cents)
                </label>
                <input
                  type="number"
                  value={minimumThreshold}
                  onChange={(e) => setMinimumThreshold(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="100"
                />
                <p className="text-sm text-gray-500 mt-1">
                  ${(minimumThreshold / 100).toFixed(2)} minimum payout
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleUpdateSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setEditingSettings(false);
                    setFrequency(payoutInfo.settings?.frequency || "weekly");
                    setMinimumThreshold(
                      payoutInfo.settings?.minimumThreshold || 5000
                    );
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Frequency:</span>
                <span className="font-medium text-gray-900 capitalize">
                  {payoutInfo.settings?.frequency || "weekly"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Minimum Threshold:</span>
                <span className="font-medium text-gray-900">
                  ${((payoutInfo.settings?.minimumThreshold || 5000) / 100).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 text-gray-900">
            Payout History
          </h2>
          {payouts.length > 0 ? (
            <div className="space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout._id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        ${(payout.amountCents / 100).toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </div>
                      {payout.stripePayoutId && (
                        <div className="text-xs text-gray-500 mt-1">
                          ID: {payout.stripePayoutId}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium ${
                          payout.status === "paid"
                            ? "bg-green-100 text-green-800"
                            : payout.status === "in_transit"
                            ? "bg-blue-100 text-blue-800"
                            : payout.status === "failed"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payout.status}
                      </span>
                      {payout.paidAt && (
                        <div className="text-xs text-gray-500 mt-1">
                          Paid: {new Date(payout.paidAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No payout history yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Payouts will appear here once processed
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

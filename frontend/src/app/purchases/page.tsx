"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Purchase {
  id: string;
  title: string;
  description: string;
  price: number;
  coverImage?: string;
  writer: {
    id: string;
    username: string;
  };
  purchasedAt: string;
  downloadUrl?: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchPurchases() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          window.location.href = "/auth/signin";
          return;
        }

        const res = await axios.get(`${API_URL}/api/user/purchases`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        setPurchases(res.data.purchases || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load purchases");
      } finally {
        setLoading(false);
      }
    }

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading your purchases...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Purchases</h1>

      {purchases.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-600 mb-4">You haven&apos;t purchased any books yet.</p>
          <Link href="/marketplace" className="text-blue-600 hover:underline">
            Browse the marketplace
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <div key={purchase.id} className="border rounded-lg p-6 flex items-start gap-4 hover:shadow-md transition">
              {purchase.coverImage && (
                <img
                  src={purchase.coverImage}
                  alt={purchase.title}
                  className="w-24 h-32 object-cover rounded"
                />
              )}
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-1">{purchase.title}</h2>
                <p className="text-sm text-gray-600 mb-2">by {purchase.writer.username}</p>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{purchase.description}</p>
                <p className="text-sm text-gray-400">
                  Purchased on {new Date(purchase.purchasedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-lg font-bold">${purchase.price.toFixed(2)}</p>
                {purchase.downloadUrl ? (
                  <a
                    href={purchase.downloadUrl}
                    download
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-center text-sm"
                  >
                    Download
                  </a>
                ) : (
                  <button
                    disabled
                    className="bg-gray-300 text-gray-600 px-4 py-2 rounded text-center text-sm cursor-not-allowed"
                  >
                    Processing...
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Earnings {
  totalEarnings: number;
  totalSales: number;
  monthlyEarnings: number;
  monthlySales: number;
  pendingOrders: number;
}

interface Order {
  _id: string;
  bookId: {
    title: string;
  };
  userId: {
    username: string;
    email: string;
  };
  amountCents: number;
  sellerProceedsCents: number;
  platformFeeCents: number;
  status: string;
  createdAt: string;
}

export default function SellerOrdersPage() {
  const [earnings, setEarnings] = useState<Earnings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          window.location.href = "/auth/signin";
          return;
        }

        const [earningsRes, ordersRes] = await Promise.all([
          axios.get(`${API_URL}/api/seller/earnings`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
          axios.get(`${API_URL}/api/seller/orders`, {
            headers: { Authorization: `Bearer ${accessToken}` },
          }),
        ]);

        setEarnings(earningsRes.data);
        setOrders(ordersRes.data.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load seller data");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">Loading seller dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>

      {earnings && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
            <p className="text-2xl font-bold">${(earnings.totalEarnings / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 mb-1">Total Sales</p>
            <p className="text-2xl font-bold">{earnings.totalSales}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 mb-1">Monthly Earnings</p>
            <p className="text-2xl font-bold">${(earnings.monthlyEarnings / 100).toFixed(2)}</p>
          </div>
          <div className="bg-white border rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
            <p className="text-2xl font-bold">{earnings.pendingOrders}</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold mb-4">Recent Orders</h2>

      {orders.length === 0 ? (
        <div className="text-center py-10 border rounded-lg">
          <p className="text-gray-600">No sales yet.</p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Book</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Buyer</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Sale Amount</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Platform Fee</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-600">Your Earnings</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{order.bookId.title}</td>
                  <td className="px-4 py-3 text-sm">{order.userId.username}</td>
                  <td className="px-4 py-3 text-sm text-right">${(order.amountCents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-right text-red-600">
                    -${((order.platformFeeCents || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-bold text-green-600">
                    ${((order.sellerProceedsCents || 0) / 100).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

interface Stats {
  totalRevenueCents: number;
  monthlyRevenueCents: number;
  totalSales: number;
  activeListings: number;
}

interface TopBook {
  _id: string;
  title: string;
  slug: string;
  totalSales: number;
  totalRevenue: number;
}

interface RecentOrder {
  _id: string;
  bookTitle: string;
  bookSlug: string;
  buyerName: string;
  buyerUsername: string;
  amountCents: number;
  sellerProceedsCents: number;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [topBooks, setTopBooks] = useState<TopBook[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  useEffect(() => {
    async function fetchData() {
      if (!token) {
        setError("Please log in to view your dashboard");
        setLoading(false);
        return;
      }

      try {
        const [statsRes, chartRes, booksRes, ordersRes] = await Promise.all([
          axios.get(`${API_URL}/api/v1/seller/dashboard/summary`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/v1/seller/dashboard/revenue-chart`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/v1/seller/dashboard/top-books`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/api/v1/seller/dashboard/recent-orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setStats(statsRes.data);
        setChartData(chartRes.data);
        setTopBooks(booksRes.data);
        setRecentOrders(ordersRes.data);
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-10 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <p className="text-red-700">{error || "Failed to load dashboard"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Seller Dashboard</h1>
          <a
            href="/seller/payouts"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            View Payouts
          </a>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <KPICard
            title="Total Revenue"
            value={`$${(stats.totalRevenueCents / 100).toFixed(2)}`}
            color="blue"
          />
          <KPICard
            title="This Month"
            value={`$${(stats.monthlyRevenueCents / 100).toFixed(2)}`}
            color="green"
          />
          <KPICard
            title="Total Sales"
            value={stats.totalSales.toString()}
            color="purple"
          />
          <KPICard
            title="Active Books"
            value={stats.activeListings.toString()}
            color="orange"
          />
        </div>

        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-lg shadow mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">
            Revenue Trend (Last 12 Months)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `$${(value / 100).toFixed(2)}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-8">No revenue data yet</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Books */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">
              Top Selling Books
            </h2>
            {topBooks.length > 0 ? (
              <div className="space-y-3">
                {topBooks.map((book) => (
                  <div
                    key={book._id}
                    className="flex justify-between items-center p-3 border-b hover:bg-gray-50"
                  >
                    <div>
                      <a
                        href={`/books/${book.slug}`}
                        className="font-semibold text-blue-600 hover:underline"
                      >
                        {book.title}
                      </a>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {book.totalSales} sales
                      </div>
                      <div className="text-sm text-gray-600">
                        ${(book.totalRevenue / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No sales yet</p>
            )}
          </div>

          {/* Recent Orders */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Recent Orders</h2>
            {recentOrders.length > 0 ? (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order._id}
                    className="p-3 border-b hover:bg-gray-50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {order.bookTitle}
                        </div>
                        <div className="text-sm text-gray-600">
                          Buyer: {order.buyerName || order.buyerUsername}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-600">
                          ${(order.sellerProceedsCents / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                          from ${(order.amountCents / 100).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: string;
  color?: "blue" | "green" | "purple" | "orange";
}

function KPICard({ title, value, color = "blue" }: KPICardProps) {
  const colorClasses = {
    blue: "border-blue-600 bg-blue-50",
    green: "border-green-600 bg-green-50",
    purple: "border-purple-600 bg-purple-50",
    orange: "border-orange-600 bg-orange-50",
  };

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow border-l-4 ${colorClasses[color]}`}
    >
      <div className="text-gray-600 text-sm font-semibold uppercase tracking-wide">
        {title}
      </div>
      <div className="text-3xl font-bold mt-2 text-gray-900">{value}</div>
    </div>
  );
}

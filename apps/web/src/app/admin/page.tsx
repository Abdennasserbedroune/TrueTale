'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface User {
  _id: string;
  email: string;
  username: string;
  roles: string[];
  isBanned?: boolean;
  banReason?: string;
}

interface Order {
  _id: string;
  buyerId: { email: string; username: string };
  writerId: { email: string; username: string };
  bookId: { title: string };
  amountCents: number;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tab, setTab] = useState<'users' | 'orders' | 'reports'>('users');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  async function fetchUsers(query = '') {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/api/v1/admin/users`, {
        params: { q: query },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }

  async function fetchOrders(status = '') {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get(`${API_URL}/api/v1/admin/orders`, {
        params: { status },
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }

  async function banUser(userId: string, reason: string) {
    if (!reason || reason.trim().length === 0) {
      alert('Please provide a ban reason');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/v1/admin/users/${userId}/ban`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User banned successfully');
      fetchUsers(searchQuery);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to ban user');
    } finally {
      setLoading(false);
    }
  }

  async function unbanUser(userId: string) {
    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/v1/admin/users/${userId}/unban`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('User unbanned successfully');
      fetchUsers(searchQuery);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to unban user');
    } finally {
      setLoading(false);
    }
  }

  async function refundOrder(orderId: string) {
    if (!confirm('Are you sure you want to refund this order?')) {
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        `${API_URL}/api/v1/admin/orders/${orderId}/refund`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Order refunded successfully');
      fetchOrders();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to refund order');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      window.location.href = '/login';
      return;
    }

    if (tab === 'users') fetchUsers();
    if (tab === 'orders') fetchOrders();
  }, [tab]);

  if (!token) {
    return <div className="p-6">Please log in to access admin panel</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
        <p className="text-gray-600">Manage users, content, and orders</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6 border-b border-gray-200">
        {['users', 'orders', 'reports'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 capitalize font-medium ${
              tab === t
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <div>
          <div className="mb-4 flex gap-4">
            <input
              type="text"
              placeholder="Search users by email or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => fetchUsers(searchQuery)}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{u.username}</div>
                          <div className="text-sm text-gray-500">{u.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {u.roles && u.roles.length > 0 ? u.roles.join(', ') : 'User'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {u.isBanned ? (
                          <div>
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                              Banned
                            </span>
                            {u.banReason && (
                              <div className="text-xs text-gray-500 mt-1">{u.banReason}</div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {u.isBanned ? (
                          <button
                            onClick={() => unbanUser(u._id)}
                            disabled={loading}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            Unban
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              const reason = prompt('Ban reason:');
                              if (reason) banUser(u._id, reason);
                            }}
                            disabled={loading}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Ban
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Order Management & Disputes</h2>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Book
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No orders found'}
                    </td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {o._id.slice(0, 8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {o.bookId?.title || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {o.buyerId?.username || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${(o.amountCents / 100).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            o.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : o.status === 'refunded'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {o.status === 'paid' && (
                          <button
                            onClick={() => refundOrder(o._id)}
                            disabled={loading}
                            className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'reports' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Platform Reports</h2>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600">
              Platform analytics and reports will be displayed here. This could include:
            </p>
            <ul className="list-disc list-inside mt-4 space-y-2 text-gray-600">
              <li>Total revenue and platform fees</li>
              <li>Top-selling books and authors</li>
              <li>User growth metrics</li>
              <li>Content moderation statistics</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

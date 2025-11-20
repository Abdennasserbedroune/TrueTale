'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Book {
  _id: string;
  title: string;
  slug: string;
  description: string;
  priceCents: number;
  authorId: { username: string; profile: { name: string } };
  stats: { sales: number };
}

export default function MarketplacePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ q: '', tag: '', sort: 'newest' });

  useEffect(() => {
    async function fetchBooks() {
      try {
        const params = new URLSearchParams();
        if (filters.q) params.append('q', filters.q);
        if (filters.tag) params.append('tag', filters.tag);
        if (filters.sort) params.append('sort', filters.sort);

        const res = await fetch(`${API_URL}/api/books?${params}`);
        const data = await res.json();
        setBooks(data.data || []);
      } catch (err) {
        console.error('Failed to fetch books:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBooks();
  }, [filters]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">Marketplace</h1>

      <div className="flex gap-4 mb-6">
        <input
          type="text"
          placeholder="Search books..."
          value={filters.q}
          onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          className="flex-1 px-4 py-2 border rounded"
        />
        <select
          value={filters.sort}
          onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
          className="px-4 py-2 border rounded"
        >
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {books.map((book) => (
            <Link key={book._id} href={`/books/${book.slug}`}>
              <div className="border rounded p-4 cursor-pointer hover:shadow-lg transition">
                <h2 className="font-bold text-lg mb-2">{book.title}</h2>
                <p className="text-gray-600 text-sm mb-2 line-clamp-2">{book.description}</p>
                <p className="text-sm text-gray-500 mb-2">
                  By {book.authorId?.profile?.name || book.authorId?.username || 'Unknown'}
                </p>
                <div className="flex justify-between items-center">
                  <span className="font-bold">${(book.priceCents / 100).toFixed(2)}</span>
                  <span className="text-xs text-gray-500">{book.stats?.sales || 0} sold</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

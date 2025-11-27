'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Icon } from "@/components/Icon";
import { MagnifyingGlassIcon, FunnelIcon, ShoppingBagIcon } from "@heroicons/react/24/outline";

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
    <div className="space-y-12 pb-20">
      {/* Header Section */}
      <section className="relative overflow-hidden rounded-[2.5rem] bg-bg-surface border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-900/30 via-bg-page to-bg-page opacity-70" />
        <div className="relative z-10 p-8 sm:p-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-brand-300 uppercase tracking-widest backdrop-blur-sm">
                <Icon icon={ShoppingBagIcon} size="xs" />
                <span>The Marketplace</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-text-primary font-serif">
                Discover Your Next <span className="text-brand-400 italic">Favorite Story</span>
              </h1>
              <p className="text-lg text-text-secondary max-w-xl">
                Explore a curated collection of premium stories, novels, and anthologies from independent creators.
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="mt-12 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon icon={MagnifyingGlassIcon} size="sm" className="text-text-muted group-focus-within:text-brand-400 transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by title, author, or genre..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-bg-page pl-11 pr-4 py-4 text-text-primary placeholder-text-muted shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all"
              />
            </div>
            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Icon icon={FunnelIcon} size="sm" className="text-text-muted" />
              </div>
              <select
                value={filters.sort}
                onChange={(e) => setFilters({ ...filters, sort: e.target.value })}
                className="w-full appearance-none rounded-xl border border-white/10 bg-bg-page pl-11 pr-10 py-4 text-text-primary shadow-inner focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all cursor-pointer"
              >
                <option value="newest">Newest Arrivals</option>
                <option value="popular">Most Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-[400px] rounded-3xl bg-white/5 border border-white/5" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {books.map((book) => (
            <Link key={book._id} href={`/books/${book.slug}`} className="group">
              <article className="h-full flex flex-col rounded-3xl border border-white/5 bg-bg-surface p-6 shadow-xl transition-all hover:-translate-y-1 hover:shadow-brand-500/10 hover:border-brand-500/20">
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <h2 className="text-xl font-bold text-text-primary font-serif group-hover:text-brand-400 transition-colors line-clamp-2">
                      {book.title}
                    </h2>
                    <span className="shrink-0 rounded-full bg-brand-500/10 px-3 py-1 text-sm font-bold text-brand-300">
                      ${(book.priceCents / 100).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-sm text-text-secondary line-clamp-3 leading-relaxed">
                    {book.description}
                  </p>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-gradient-to-br from-brand-400 to-brand-600" />
                      <span className="font-medium text-text-primary">
                        {book.authorId?.profile?.name || book.authorId?.username || 'Unknown'}
                      </span>
                    </div>
                    <span className="text-text-muted text-xs uppercase tracking-wider">
                      {book.stats?.sales || 0} sold
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {!loading && books.length === 0 && (
        <div className="rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center">
          <p className="text-lg text-text-secondary">No books found matching your criteria.</p>
          <button
            onClick={() => setFilters({ q: '', tag: '', sort: 'newest' })}
            className="mt-4 text-brand-400 hover:text-brand-300 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

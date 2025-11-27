"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 backdrop-blur-xl bg-black/50 border-b border-white/5">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          TrueTale
        </Link>

        <nav className="flex items-center gap-8">
          {user ? (
            <>
              <Link href="/marketplace" className="text-sm hover:text-neon-purple transition-colors">
                Stories
              </Link>
              <Link href="/trending" className="text-sm hover:text-neon-purple transition-colors">
                Trending
              </Link>

              {user.role === "writer" ? (
                <>
                  <Link href="/seller/dashboard" className="text-sm hover:text-neon-purple transition-colors">
                    Dashboard
                  </Link>
                  <Link
                    href="/seller/dashboard"
                    className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
                  >
                    Publish
                  </Link>
                </>
              ) : (
                <Link href="/feed" className="text-sm hover:text-neon-purple transition-colors">
                  My Feed
                </Link>
              )}

              <button
                onClick={logout}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm hover:text-neon-purple transition-colors">
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="px-6 py-2 bg-white text-black text-sm font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

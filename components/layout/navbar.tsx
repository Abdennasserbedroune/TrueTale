"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { SignOutButton } from "./sign-out-button";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold text-slate-900">
          TrueTale
        </Link>
        <nav className="flex items-center gap-3 text-sm font-medium text-slate-600">
          <Link href="/" className="transition hover:text-slate-900">
            Home
          </Link>
          <Link href="/profile/onboarding" className="transition hover:text-slate-900">
            Onboarding
          </Link>
          {session && (
            <Link href="/dashboard" className="transition hover:text-slate-900">
              Dashboard
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-2 text-sm">
          {session ? (
            <>
              <span className="hidden text-slate-600 md:inline">
                {session.user?.name ?? session.user?.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md px-3 py-1.5 font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-600 px-3 py-1.5 font-medium text-white shadow hover:bg-brand-500"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const navigation = [
  { href: "/", label: "Home" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/messages", label: "Messages" },
];

export const metadata: Metadata = {
  title: {
    default: "Inkwave Writers Marketplace",
    template: "%s | Inkwave Writers Marketplace",
  },
  description:
    "Discover writer profiles, explore community marketplaces, and collaborate through comments, likes, bookmarks, and direct messaging.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-neutral-50 dark:bg-neutral-950">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased text-neutral-900 dark:text-neutral-100`}
      >
        <a
          href="#main-content"
          className="absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
        >
          Skip to main content
        </a>
        <div className="flex min-h-screen flex-col">
          <header className="border-b border-neutral-200 bg-white/80 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/70">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-5 sm:px-6 lg:px-8">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <span aria-hidden className="h-3 w-3 rounded-full bg-emerald-500" />
                Inkwave
              </Link>
              <nav aria-label="Primary" className="flex items-center gap-4 text-sm font-medium">
                {navigation.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-full px-3 py-2 transition hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-neutral-800"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  href="/writers/aria-sullivan"
                  className="hidden rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 sm:inline-flex"
                >
                  Your profile
                </Link>
              </nav>
            </div>
          </header>
          <main
            id="main-content"
            className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-8"
          >
            {children}
          </main>
          <footer className="border-t border-neutral-200 bg-white/80 py-6 text-sm text-neutral-500 dark:border-neutral-800 dark:bg-neutral-950/70 dark:text-neutral-400">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>&copy; {new Date().getFullYear()} Inkwave Collective. All rights reserved.</p>
              <div className="flex gap-4">
                <Link href="/marketplace" className="hover:underline">
                  Explore marketplace
                </Link>
                <Link href="/writers/aria-sullivan" className="hover:underline">
                  Meet the writers
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

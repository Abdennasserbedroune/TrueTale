import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "TrueTale - Writers Marketplace",
    template: "%s | TrueTale",
  },
  description:
    "Discover writer profiles, explore community marketplaces, and collaborate through a calm, professional platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} bg-bg-primary`}>
      <body className="antialiased text-text-primary">
        <a
          href="#main-content"
          className="sr-only absolute left-1/2 top-2 -translate-x-1/2 rounded-lg bg-brand-600 px-5 py-2.5 text-base font-medium text-text-inverse shadow-sm focus:not-sr-only focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
        >
          Skip to main content
        </a>

        <div className="flex min-h-screen flex-col">
          <Header />

          <main
            id="main-content"
            role="main"
            className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8"
          >
            {children}
          </main>

          <footer
            className="border-t border-border bg-surface py-8 text-sm text-text-secondary"
            role="contentinfo"
          >
            <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
              <p>&copy; {new Date().getFullYear()} TrueTale. All rights reserved.</p>
              <nav aria-label="Footer navigation" className="flex gap-6">
                <Link href="/marketplace" className="hover:text-text-primary transition-colors">
                  Explore marketplace
                </Link>
                <Link href="/writers/aria-sullivan" className="hover:text-text-primary transition-colors">
                  Meet the writers
                </Link>
              </nav>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { AuthSessionProvider } from "@/components/providers/session-provider";
import { auth } from "@/auth";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "TrueTale",
  description:
    "TrueTale is a home for writers to develop their voice, connect with readers, and publish ambitious storytelling.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <html lang="en">
      <body className={`${inter.className} bg-slate-50 text-slate-900`}>
        <AuthSessionProvider session={session}>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">
              <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
                {children}
              </div>
            </main>
            <footer className="border-t border-slate-200 bg-white">
              <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 text-sm text-slate-500">
                <span>&copy; {new Date().getFullYear()} TrueTale</span>
                <span>Craft the stories only you can tell.</span>
              </div>
            </footer>
          </div>
        </AuthSessionProvider>
      </body>
    </html>
  );
}

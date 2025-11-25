"use client";

import { listAggregatedWorks } from "@/lib/marketplaceStore";
import { writers } from "@/data/sampleData";
import { Header } from "@/components/Header";
import { BookCover } from "@/components/BookCover";
import Link from "next/link";
import type { AggregatedWork } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const allWorks = listAggregatedWorks();
  const publishedWorks = allWorks.filter((w: AggregatedWork) => w.status === "published");
  const featured = publishedWorks.slice(0, 12);

  const handleProtectedClick = (e: React.MouseEvent, href: string) => {
    if (!user) {
      e.preventDefault();
      router.push("/auth/register");
    }
  };

  return (
    <>
      <Header />

      <main className="min-h-screen bg-gradient-to-br from-[#0a0a12] via-[#1a0a2e] to-[#0a0a12]">
        {/* Hero */}
        <section className="min-h-screen flex items-center justify-center px-6 pt-24 pb-16">
          <div className="max-w-screen-2xl mx-auto w-full">
            <div className="mb-20">
              <h1 className="text-[clamp(3rem,12vw,14rem)] font-bold leading-[0.85] tracking-tighter mb-8">
                Stories
                <br />
                Worth
                <br />
                Reading
              </h1>
              <div className="flex items-center gap-6">
                <Link
                  href={user ? "/marketplace" : "/auth/register"}
                  className="px-8 py-3 bg-white text-black font-medium rounded-full hover:bg-white/90 transition-all"
                >
                  Start Reading
                </Link>
                <div className="text-sm text-white/40">
                  {publishedWorks.length} stories • {writers.length} writers
                </div>
              </div>
            </div>

            {/* Horizontal scroll of books */}
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {featured.map((work) => (
                  <Link
                    key={work.id}
                    href={`/works/${work.slug}`}
                    onClick={(e) => handleProtectedClick(e, `/works/${work.slug}`)}
                    className="flex-shrink-0 group"
                  >
                    <div className="w-48">
                      <BookCover
                        title={work.title}
                        author={work.writer.name}
                        size="md"
                        className="mb-3 transform group-hover:scale-105 transition-transform"
                      />
                      <h3 className="text-sm font-medium line-clamp-2 mb-1">
                        {work.title}
                      </h3>
                      <p className="text-xs text-white/50">{work.writer.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Grid */}
        <section className="px-6 py-32">
          <div className="max-w-screen-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-12">Trending</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
              {featured.map((work) => (
                <Link
                  key={work.id}
                  href={`/works/${work.slug}`}
                  onClick={(e) => handleProtectedClick(e, `/works/${work.slug}`)}
                  className="group"
                >
                  <BookCover
                    title={work.title}
                    author={work.writer.name}
                    size="md"
                    className="mb-3 transform group-hover:scale-105 transition-transform"
                  />
                  <h3 className="text-sm font-medium line-clamp-2 mb-1">
                    {work.title}
                  </h3>
                  <p className="text-xs text-white/50">{work.writer.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Writers */}
        <section className="px-6 py-32">
          <div className="max-w-screen-2xl mx-auto">
            <h2 className="text-4xl font-bold mb-12">Writers</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {writers.slice(0, 6).map((writer) => {
                const writerWorks = allWorks.filter(
                  (w: AggregatedWork) => w.writerId === writer.id && w.status === "published"
                );

                return (
                  <Link
                    key={writer.id}
                    href={`/writers/${writer.slug}`}
                    onClick={(e) => handleProtectedClick(e, `/writers/${writer.slug}`)}
                    className="group p-6 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold">
                        {writer.name[0]}
                      </div>
                      <div>
                        <h3 className="font-medium">{writer.name}</h3>
                        <p className="text-sm text-white/50">
                          {writerWorks.length} stories
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {writerWorks.slice(0, 4).map((work: AggregatedWork) => (
                        <BookCover
                          key={work.id}
                          title={work.title}
                          author={writer.name}
                          size="sm"
                        />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-32">
          <div className="max-w-screen-2xl mx-auto text-center">
            <h2 className="text-6xl md:text-8xl font-bold mb-8">
              Start Writing
            </h2>
            <Link
              href={user ? "/seller/dashboard" : "/auth/register"}
              className="inline-block px-12 py-4 bg-white text-black text-lg font-medium rounded-full hover:bg-white/90 transition-all"
            >
              Publish Your Story
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}

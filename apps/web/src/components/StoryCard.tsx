import React from 'react';
import Link from 'next/link';
import { BookCover } from './BookCover';
import { Rating } from './Rating';
import type { AggregatedWork } from '@/types';

interface StoryCardProps {
    work: AggregatedWork;
    size?: 'sm' | 'md' | 'lg';
    showAuthor?: boolean;
    showRating?: boolean;
    showReaderCount?: boolean;
}

// Calculate average rating from likes/bookmarks (simplified)
function calculateRating(work: AggregatedWork): number {
    const total = work.likes + work.bookmarks;
    if (total === 0) return 0;
    // Simple heuristic: combine likes and bookmarks for a rating out of 5
    const score = Math.min((total / 100) * 5, 5);
    return Math.round(score * 10) / 10; // Round to 1 decimal
}

export function StoryCard({
    work,
    size = 'md',
    showAuthor = true,
    showRating = true,
    showReaderCount = true
}: StoryCardProps) {
    const rating = calculateRating(work);
    const genre = work.genres[0] || work.interests[0];

    return (
        <Link href={`/works/${work.slug}`} className="group block">
            <article className="space-y-3">
                {/* Book Cover */}
                <div className="relative">
                    <BookCover
                        title={work.title}
                        author={work.writer.name}
                        genre={genre}
                        size={size}
                        className="transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Status badge if draft */}
                    {work.status === 'draft' && (
                        <div className="absolute top-2 right-2">
                            <span className="inline-block px-2 py-1 text-xs font-medium uppercase tracking-wider bg-black/60 backdrop-blur-sm rounded text-white">
                                Draft
                            </span>
                        </div>
                    )}
                </div>

                {/* Info section */}
                <div className="space-y-1.5">
                    {/* Rating */}
                    {showRating && rating > 0 && (
                        <div className="flex items-center gap-1.5">
                            <div className="flex items-center gap-0.5 text-accent-400 text-sm">
                                <span>★</span>
                            </div>
                            <span className="text-sm font-semibold text-text-primary">{rating.toFixed(1)}</span>
                            {work.likes > 0 && (
                                <span className="text-xs text-text-secondary">({work.likes + work.bookmarks})</span>
                            )}
                        </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-serif font-bold text-text-primary line-clamp-2 group-hover:text-primary-400 transition-colors">
                        {work.title}
                    </h3>

                    {/* Author */}
                    {showAuthor && (
                        <p className="text-sm text-text-secondary">
                            by {work.writer.name}
                        </p>
                    )}

                    {/* Reader count */}
                    {showReaderCount && (work.likes > 0 || work.bookmarks > 0) && (
                        <p className="text-xs text-text-muted">
                            {(work.likes + work.bookmarks).toLocaleString()} readers
                        </p>
                    )}
                </div>
            </article>
        </Link>
    );
}

// Compact variant for smaller spaces
export function StoryCardCompact({ work }: { work: AggregatedWork }) {
    const rating = calculateRating(work);
    const genre = work.genres[0] || work.interests[0];

    return (
        <Link href={`/works/${work.slug}`} className="group flex gap-3 items-start">
            <BookCover
                title={work.title}
                author={work.writer.name}
                genre={genre}
                size="sm"
                className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            />
            <div className="flex-1 min-w-0 space-y-1">
                <h3 className="text-sm font-serif font-bold text-text-primary line-clamp-2 group-hover:text-primary-400 transition-colors">
                    {work.title}
                </h3>
                <p className="text-xs text-text-secondary">
                    by {work.writer.name}
                </p>
                {rating > 0 && (
                    <div className="flex items-center gap-1">
                        <span className="text-accent-400 text-xs">★</span>
                        <span className="text-xs font-semibold text-text-primary">{rating.toFixed(1)}</span>
                    </div>
                )}
            </div>
        </Link>
    );
}

import React from 'react';

interface RatingProps {
    rating: number; // 0-5
    count?: number;
    size?: 'sm' | 'md' | 'lg';
    showCount?: boolean;
    className?: string;
}

const sizeClasses = {
    sm: { star: 'text-sm', text: 'text-xs' },
    md: { star: 'text-base', text: 'text-sm' },
    lg: { star: 'text-lg', text: 'text-base' },
};

export function Rating({ rating, count, size = 'md', showCount = true, className = '' }: RatingProps) {
    // Generate star display
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <div className={`flex items-center gap-0.5 ${sizeClasses[size].star}`}>
                {/* Full stars */}
                {[...Array(fullStars)].map((_, i) => (
                    <span key={`full-${i}`} className="text-accent-400">★</span>
                ))}

                {/* Half star */}
                {hasHalfStar && (
                    <span className="relative inline-block">
                        <span className="text-text-muted">★</span>
                        <span className="absolute inset-0 overflow-hidden w-1/2 text-accent-400">★</span>
                    </span>
                )}

                {/* Empty stars */}
                {[...Array(emptyStars)].map((_, i) => (
                    <span key={`empty-${i}`} className="text-text-muted">★</span>
                ))}
            </div>

            {/* Rating score and count */}
            <div className={`flex items-baseline gap-1.5 ${sizeClasses[size].text}`}>
                <span className="font-semibold text-text-primary">
                    {rating.toFixed(1)}
                </span>
                {showCount && count !== undefined && (
                    <span className="text-text-secondary">
                        ({count.toLocaleString()})
                    </span>
                )}
            </div>
        </div>
    );
}

// Compact version for small spaces
export function RatingCompact({ rating, className = '' }: Pick<RatingProps, 'rating' | 'className'>) {
    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <span className="text-accent-400 text-sm">★</span>
            <span className="text-sm font-semibold text-text-primary">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

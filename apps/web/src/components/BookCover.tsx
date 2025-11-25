import React from 'react';

interface BookCoverProps {
    title: string;
    author: string;
    genre?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

// Simple hash function to generate consistent colors based on title
function hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

// Generate gradient based on title
function getGradientForTitle(title: string): string {
    const hash = hashCode(title);
    const hue1 = hash % 360;
    const hue2 = (hash + 60) % 360;

    return `linear-gradient(135deg, 
    hsl(${hue1}, 70%, 50%) 0%, 
    hsl(${hue2}, 70%, 35%) 100%)`;
}

const sizeClasses = {
    sm: 'w-32 h-48',
    md: 'w-40 h-60',
    lg: 'w-48 h-72',
    xl: 'w-56 h-84',
};

const textSizeClasses = {
    sm: { title: 'text-sm', author: 'text-xs' },
    md: { title: 'text-base', author: 'text-xs' },
    lg: { title: 'text-lg', author: 'text-sm' },
    xl: { title: 'text-xl', author: 'text-sm' },
};

export function BookCover({ title, author, genre, size = 'md', className = '' }: BookCoverProps) {
    const gradient = getGradientForTitle(title);
    const truncatedTitle = title.length > 40 ? title.slice(0, 37) + '...' : title;

    return (
        <div
            className={`${sizeClasses[size]} ${className} relative rounded-lg overflow-hidden shadow-card hover:shadow-card-hover transition-shadow duration-300 group`}
            style={{ background: gradient }}
        >
            {/* Overlay for better text contrast */}
            <div className="absolute inset-0 bg-black/20" />

            {/* Content */}
            <div className="relative h-full flex flex-col justify-between p-4">
                {/* Genre tag at top if provided */}
                {genre && (
                    <div className="self-start">
                        <span className="inline-block px-2 py-1 text-xs font-medium uppercase tracking-wider bg-black/30 backdrop-blur-sm rounded text-white/90">
                            {genre}
                        </span>
                    </div>
                )}

                {/* Title and author at bottom */}
                <div className="space-y-2">
                    <h3 className={`${textSizeClasses[size].title} font-serif font-bold text-white leading-tight drop-shadow-lg`}>
                        {truncatedTitle}
                    </h3>
                    <p className={`${textSizeClasses[size].author} font-sans text-white/80 drop-shadow`}>
                        by {author}
                    </p>
                </div>
            </div>

            {/* Hover effect */}
            <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-300" />
        </div>
    );
}

// Preset cover variant for quick use
export function BookCoverCompact({ title, author, className = '' }: Omit<BookCoverProps, 'size'>) {
    return <BookCover title={title} author={author} size="sm" className={className} />;
}

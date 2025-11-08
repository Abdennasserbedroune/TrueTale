declare class SimpleCache {
    private cache;
    private readonly defaultTTL;
    set<T>(key: string, data: T, ttlMs?: number): void;
    get<T>(key: string): T | null;
    clear(): void;
    delete(key: string): void;
    cleanup(): void;
}
export declare const marketplaceCache: SimpleCache;
export {};
//# sourceMappingURL=marketplaceCache.d.ts.map
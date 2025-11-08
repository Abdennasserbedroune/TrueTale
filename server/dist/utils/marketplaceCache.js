"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.marketplaceCache = void 0;
class SimpleCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5 minutes default TTL
    }
    set(key, data, ttlMs = this.defaultTTL) {
        const expiresAt = Date.now() + ttlMs;
        this.cache.set(key, { data, expiresAt });
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        return entry.data;
    }
    clear() {
        this.cache.clear();
    }
    delete(key) {
        this.cache.delete(key);
    }
    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}
exports.marketplaceCache = new SimpleCache();
// Run cleanup every 5 minutes
setInterval(() => {
    exports.marketplaceCache.cleanup();
}, 5 * 60 * 1000);
//# sourceMappingURL=marketplaceCache.js.map
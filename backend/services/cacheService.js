class CacheService {
    constructor(ttlSeconds = 300) {
        this.cache = new Map();
        this.ttl = ttlSeconds * 1000;
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.value;
    }

    set(key, value) {
        this.cache.set(key, {
            value,
            expiry: Date.now() + this.ttl
        });
    }

    generateKey(prefix, params) {
        return `${prefix}_${JSON.stringify(params)}`;
    }
}

// Global cache instance (5 min TTL)
const globalCache = new CacheService(300);

module.exports = globalCache;

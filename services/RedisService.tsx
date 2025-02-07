import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.AZURE_REDIS_CONNECTIONSTRING,
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));

(async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
})();

/**
 * Retrieves a value from Redis by key.
 * @param key Redis key
 * @returns The value or null if not found
 */
export async function getValue(key: string): Promise<string | null> {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        return await redisClient.get(key);
    } catch (error) {
        console.error("Redis GET Error:", error);
        return null;
    }
}

/**
 * Sets a value in Redis with an optional expiration time.
 * @param key Redis key
 * @param value Value to store
 * @param ttl Time-to-live in seconds (optional)
 */
export async function setValue(key: string, value: string, ttl?: number): Promise<void> {
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        if (ttl) {
            await redisClient.set(key, value, { EX: ttl });
        } else {
            await redisClient.set(key, value);
        }
    } catch (error) {
        console.error("Redis SET Error:", error);
    }
}

export default redisClient;

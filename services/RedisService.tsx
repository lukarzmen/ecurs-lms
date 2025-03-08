import { createClient } from "redis";

// Create the Redis client
const redisClient = createClient({
    url: process.env.AZURE_REDIS_CONNECTIONSTRING,
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Reconnecting attempt #${retries}`);
            return Math.min(retries * 50, 500); // Delay grows with retries but caps at 500ms
        },
    },
});

// Listen for error events
redisClient.on("error", (err) => console.error("Redis Client Error:", err));

// Ensure connection is established at startup
(async () => {
    try {
        await connectRedis();
    } catch (error) {
        console.error("Redis Connection Error:", error);
    }
})();

// Helper function to check and connect to Redis
async function connectRedis() {
    if (!redisClient.isOpen) {
        await redisClient.connect();
    }
}

/**
 * Retrieves a value from Redis by key.
 * @param key Redis key
 * @returns The value or null if not found
 */
export async function getValue(key: string): Promise<string | null> {
    try {
        await connectRedis();
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
        await connectRedis();
        if (ttl) {
            await redisClient.set(key, value, { EX: ttl }); // Set with expiration
        } else {
            await redisClient.set(key, value); // Set without expiration
        }
    } catch (error) {
        console.error("Redis SET Error:", error);
    }
}

export default redisClient;

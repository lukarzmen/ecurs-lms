import { createClient, RedisClientType } from "redis";

// Create the Redis client
const redisClient: RedisClientType = createClient({
    url: process.env.AZURE_REDIS_CONNECTIONSTRING,
    socket: {
        reconnectStrategy: (retries) => {
            console.log(`Reconnecting attempt #${retries}`);
            if (retries > 20) {
                return new Error('Too many reconnection attempts')
            }
            return Math.min(retries * 50, 500); // Delay grows with retries but caps at 500ms
        },
    },
});

// Listen for error events
redisClient.on("error", (err) => console.error("Redis Client Error:", err));

redisClient.on('reconnecting', () => {
    console.log('Redis client reconnecting...');
});

redisClient.on('connect', () => {
    console.log('Redis client connected');
});

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
    try {
        if (!redisClient.isOpen) {
            await redisClient.connect();
            console.log('Redis connected');
        }
    } catch (error) {
        console.error("Failed to connect to Redis:", error);
        throw error;
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

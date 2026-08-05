const { Redis } = require("@upstash/redis");

let redisClient;

async function connectRedis() {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Simple health check
    await redisClient.ping();

    console.log("✅ Upstash Redis Connected");

    return redisClient;
  } catch (err) {
    console.error("❌ Failed to connect Upstash Redis:", err.message);

    throw err;
  }
}

function getRedisClient() {
  if (!redisClient) {
    throw new Error("Redis client is not initialized");
  }

  return redisClient;
}

module.exports = {
  connectRedis,
  getRedisClient,
};
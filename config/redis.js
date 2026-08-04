const { createClient } = require("redis");

let redisClient;

async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => {
      console.error("❌ Redis Error:", err.message);
    });

    redisClient.on("connect", () => {
      console.log("🔄 Connecting to Redis...");
    });

    redisClient.on("ready", () => {
      console.log("✅ Redis Connected");
    });

    await redisClient.connect();

    return redisClient;
  } catch (err) {
    console.error("❌ Failed to connect to Redis:", err.message);
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
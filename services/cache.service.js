const { getRedisClient } = require("../config/redis");

/**
 * Get data from Redis
 * @param {string} key
 * @returns {Object|null}
 */
async function get(key) {
  try {
    const redis = getRedisClient();

    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("❌ Cache GET Error:", error.message);
    return null;
  }
}

/**
 * Store data in Redis
 * @param {string} key
 * @param {Object} value
 * @param {number} ttl Time in seconds
 */
async function set(key, value, ttl = 600) {
  try {
    const redis = getRedisClient();

    await redis.set(
      key,
      JSON.stringify(value),
      {
        EX: ttl,
      }
    );
  } catch (error) {
    console.error("❌ Cache SET Error:", error.message);
  }
}

/**
 * Delete a single cache key
 */
async function del(key) {
  try {
    const redis = getRedisClient();

    await redis.del(key);
  } catch (error) {
    console.error("❌ Cache DELETE Error:", error.message);
  }
}

/**
 * Check if key exists
 */
async function exists(key) {
  try {
    const redis = getRedisClient();

    return await redis.exists(key);
  } catch (error) {
    console.error("❌ Cache EXISTS Error:", error.message);
    return 0;
  }
}

/**
 * Remove cache by pattern
 * Example:
 * student:*
 * notice:*
 */
async function clearPattern(pattern) {
  try {
    const redis = getRedisClient();

    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(keys);
    }
  } catch (error) {
    console.error("❌ Cache Pattern Delete Error:", error.message);
  }
}

module.exports = {
  get,
  set,
  del,
  exists,
  clearPattern,
};
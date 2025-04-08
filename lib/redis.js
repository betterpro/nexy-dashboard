import { createClient } from "redis";

let redisClient = null;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.NEXT_PUBLIC_REDIS_API,
    });
    redisClient.on("error", (err) => console.error("Redis Client Error", err));
    await redisClient.connect();
  }
  return redisClient;
}

async function fetchFromRedis(stationId) {
  const key = `stations:${stationId}`;
  try {
    const client = await getRedisClient();
    const data = await client.get(key);
    if (data) {
      const parsedData = JSON.parse(data);
      return parsedData.batteries || null;
    }
    return null;
  } catch (error) {
    console.error("Error fetching data from Redis:", error);
    throw error;
  }
}

export { getRedisClient, fetchFromRedis };

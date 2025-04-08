import { NextResponse } from "next/server";
import axios from "axios";
import { createClient } from "redis";

// Redis client initialization
let redisClient = null;

async function getRedisClient() {
  if (!process.env.NEXT_PUBLIC_REDIS_API) {
    throw new Error("Redis configuration is missing");
  }

  if (!redisClient) {
    redisClient = createClient({ url: process.env.NEXT_PUBLIC_REDIS_API });
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const stationId = searchParams.get("stationId");

    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID is required" },
        { status: 400 }
      );
    }

    let batteries;

    if (stationId.startsWith("ZAPP")) {
      if (
        !process.env.NEXT_PUBLIC_ZAPP_API_URL ||
        !process.env.NEXT_PUBLIC_ZAPP_AUTH_USERNAME
      ) {
        return NextResponse.json(
          { error: "ZAPP API configuration is missing" },
          { status: 500 }
        );
      }

      // Fetch battery data for ZAPP station
      const awsRes = await axios.get(
        `${process.env.NEXT_PUBLIC_ZAPP_API_URL}/v1/station/${stationId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.NEXT_PUBLIC_ZAPP_AUTH_USERNAME}`,
          },
        }
      );
      batteries = awsRes.data.batteries;
    } else if (stationId.startsWith("NEXY")) {
      if (
        !process.env.NEXT_PUBLIC_NEXY_API_URL ||
        !process.env.NEXT_PUBLIC_NEXY_API_TOKEN
      ) {
        return NextResponse.json(
          { error: "NEXY API configuration is missing" },
          { status: 500 }
        );
      }

      try {
        // Fetch from Nexy API
        const nexyApiRes = await axios.get(
          process.env.NEXT_PUBLIC_NEXY_API_URL,
          {
            params: {
              I: 64,
              E: stationId,
              token: process.env.NEXT_PUBLIC_NEXY_API_TOKEN,
            },
          }
        );

        if (nexyApiRes.data.code !== 200) {
          throw new Error("Failed to update Redis for NEXY station");
        }

        // Fetch updated battery data from Redis
        batteries = await fetchFromRedis(stationId);
        if (!batteries) {
          throw new Error("Battery data not found in Redis for NEXY station");
        }
      } catch (error) {
        console.error("Error in NEXY API call:", error);
        return NextResponse.json(
          { error: `Failed to fetch NEXY station data: ${error.message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported station ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json({ batteries });
  } catch (error) {
    console.error("Error fetching battery status:", error);
    return NextResponse.json(
      { error: "Failed to fetch battery status" },
      { status: 500 }
    );
  }
}

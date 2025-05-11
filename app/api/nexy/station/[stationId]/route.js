import { NextResponse } from "next/server";
import axios from "axios";

export async function GET(request, { params }) {
  try {
    const { stationId } = params;

    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID is required" },
        { status: 400 }
      );
    }

    // Use server-side environment variables
    const NEXY_API_URL = process.env.NEXY_API_URL;
    const NEXY_API_TOKEN = process.env.NEXY_API_TOKEN;

    if (!NEXY_API_URL || !NEXY_API_TOKEN) {
      console.error("Missing NEXY API configuration:", {
        hasUrl: !!NEXY_API_URL,
        hasToken: !!NEXY_API_TOKEN,
        env: process.env.NODE_ENV
      });
      return NextResponse.json(
        { error: "NEXY API configuration is missing" },
        { status: 500 }
      );
    }

    console.log("Making NEXY API request:", {
      url: NEXY_API_URL,
      stationId,
      env: process.env.NODE_ENV
    });

    // Make the request to NEXY API
    const response = await axios.get(NEXY_API_URL, {
      params: {
        I: 64,
        E: stationId,
        token: NEXY_API_TOKEN,
      },
      timeout: 10000,
    });

    if (response.data.code !== 200) {
      console.error("NEXY API error response:", {
        code: response.data.code,
        message: response.data.message,
        stationId,
        env: process.env.NODE_ENV
      });
      return NextResponse.json(
        {
          error: `NEXY API error: ${response.data.message || "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching NEXY station data:", {
      error: error.message,
      stationId: params.stationId,
      env: process.env.NODE_ENV,
      response: error.response?.data,
      status: error.response?.status
    });

    if (error.response) {
      return NextResponse.json(
        {
          error: `NEXY API error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: "No response received from NEXY API" },
        { status: 500 }
      );
    } else {
      return NextResponse.json(
        { error: `Error setting up request: ${error.message}` },
        { status: 500 }
      );
    }
  }
}

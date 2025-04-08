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

    if (
      !process.env.NEXT_PUBLIC_NEXY_API_URL ||
      !process.env.NEXT_PUBLIC_NEXY_API_TOKEN
    ) {
      return NextResponse.json(
        { error: "NEXY API configuration is missing" },
        { status: 500 }
      );
    }

    // Make the request to NEXY API
    const response = await axios.get(process.env.NEXT_PUBLIC_NEXY_API_URL, {
      params: {
        I: 64,
        E: stationId,
        token: process.env.NEXT_PUBLIC_NEXY_API_TOKEN,
      },
      timeout: 10000,
    });

    if (response.data.code !== 200) {
      return NextResponse.json(
        {
          error: `NEXY API error: ${response.data.message || "Unknown error"}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching NEXY station data:", error);
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

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

    if (!process.env.NEXT_PUBLIC_ZAPP_USERNAME) {
      return NextResponse.json(
        { error: "ZAPP API credentials are missing" },
        { status: 500 }
      );
    }

    // Make the HTTP request to ZAPP API
    const response = await axios.get(
      `http://15.223.4.61:17990/v1/station/${stationId}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(
            process.env.NEXT_PUBLIC_ZAPP_USERNAME + ":"
          ).toString("base64")}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching ZAPP station data:", error);
    if (error.response) {
      return NextResponse.json(
        {
          error: `ZAPP API error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: "No response received from ZAPP API" },
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

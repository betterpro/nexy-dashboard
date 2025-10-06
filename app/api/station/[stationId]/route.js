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

    // Make the request to the external API
    const response = await axios.get(
      `http://15.223.4.61:17990/v1/station/${stationId}`,
      {
        timeout: 10000,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error fetching station data:", {
      error: error.message,
      stationId: params.stationId,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response) {
      return NextResponse.json(
        {
          error: `API error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: "No response received from API" },
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

export async function POST(request, { params }) {
  try {
    const { stationId } = params;
    const body = await request.formData();

    if (!stationId) {
      return NextResponse.json(
        { error: "Station ID is required" },
        { status: 400 }
      );
    }

    // Create basic auth header
    const auth = Buffer.from("ec0f42a52f81ac228c673ed51d0f0421:").toString(
      "base64"
    );

    // Make the POST request to release slots
    const response = await axios.post(
      `http://15.223.4.61:17990/v1/station/${stationId}`,
      body,
      {
        timeout: 10000,
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    return NextResponse.json(response.data);
  } catch (error) {
    console.error("Error releasing slots:", {
      error: error.message,
      stationId: params.stationId,
      response: error.response?.data,
      status: error.response?.status,
    });

    if (error.response) {
      return NextResponse.json(
        {
          error: `API error: ${error.response.status} - ${
            error.response.data?.message || "Unknown error"
          }`,
        },
        { status: error.response.status }
      );
    } else if (error.request) {
      return NextResponse.json(
        { error: "No response received from API" },
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

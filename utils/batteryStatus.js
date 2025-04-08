import axios from "axios";

export async function getBatteryStatus(stationId) {
  try {
    let batteries;

    if (stationId.startsWith("ZAPP")) {
      if (
        !process.env.NEXT_PUBLIC_ZAPP_API_URL ||
        !process.env.NEXT_PUBLIC_ZAPP_AUTH_USERNAME
      ) {
        throw new Error(
          "ZAPP API configuration is missing. Please check your environment variables."
        );
      }

      try {
        // Fetch battery data for ZAPP station with Basic Auth
        const awsRes = await axios.get(
          `${process.env.NEXT_PUBLIC_ZAPP_API_URL}/v1/station/${stationId}`,
          {
            headers: {
              Authorization: `Basic ${process.env.NEXT_PUBLIC_ZAPP_AUTH_USERNAME}`,
            },
            timeout: 10000, // 10 second timeout
          }
        );
        batteries = awsRes.data.batteries;
      } catch (error) {
        console.error("Error fetching ZAPP station data:", error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          throw new Error(
            `ZAPP API error: ${error.response.status} - ${
              error.response.data?.message || "Unknown error"
            }`
          );
        } else if (error.request) {
          // The request was made but no response was received
          throw new Error(
            "No response received from ZAPP API. Please check your network connection."
          );
        } else {
          // Something happened in setting up the request that triggered an Error
          throw new Error(
            `Error setting up ZAPP API request: ${error.message}`
          );
        }
      }
    } else if (stationId.startsWith("NEXY")) {
      if (
        !process.env.NEXT_PUBLIC_NEXY_API_URL ||
        !process.env.NEXT_PUBLIC_NEXY_API_TOKEN
      ) {
        throw new Error(
          "NEXY API configuration is missing. Please check your environment variables."
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
            timeout: 10000, // 10 second timeout
          }
        );

        if (nexyApiRes.data.code !== 200) {
          throw new Error(
            `Failed to fetch data for NEXY station: ${
              nexyApiRes.data.message || "Unknown error"
            }`
          );
        }

        // Fetch battery data from our API
        const response = await fetch(
          `/api/battery/status?stationId=${stationId}`
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch battery status: ${
              errorData.error || response.statusText
            }`
          );
        }
        const data = await response.json();
        batteries = data.batteries;
      } catch (error) {
        console.error("Error in NEXY API call:", error);
        throw new Error(`Failed to fetch NEXY station data: ${error.message}`);
      }
    } else {
      throw new Error("Unsupported station ID format");
    }

    return { batteries };
  } catch (error) {
    console.error("Error fetching battery status:", error);
    throw error;
  }
}

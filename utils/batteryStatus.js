import axios from "axios";

export async function getBatteryStatus(stationId) {
  try {
    let batteries;

    if (stationId.startsWith("ZAPP")) {
      try {
        // Use our proxy endpoint for ZAPP stations
        const response = await fetch(`/api/zapp/station/${stationId}`);
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            `Failed to fetch ZAPP station data: ${
              errorData.error || response.statusText
            }`
          );
        }
        const data = await response.json();
        batteries = data.batteries;
      } catch (error) {
        console.error("Error fetching ZAPP station data:", error);
        throw error;
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
